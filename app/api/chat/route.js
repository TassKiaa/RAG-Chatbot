import { retrieveContext } from "@/lib/retrieval"; 
import { createServerComponentClient } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    // 1. Authenticate Supabase session
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { messages, chatId } = body;

    const query = body.query || body.text || (messages && messages[messages.length - 1]?.content);

    if (!query || !messages) {
      return new Response(JSON.stringify({ error: "Missing query or conversation payload" }), { status: 400 });
    }

    // 2. Fetch context chunks from your local RAG vector storage
    // BUG FIX #1: retrieveContext is async — must be awaited
    let retrievedText = "";
    let sources = [];
    
    try {
      const searchResult = await retrieveContext(query);
      if (searchResult) {
        retrievedText = searchResult.context || "";
        sources = searchResult.sources || [];
      }
    } catch (retrievalError) {
      console.error("Vector retrieval caution flag:", retrievalError);
    }

    // 3. Construct the system instruction block for Gemini
    const detailedSystemPrompt = `You are a helpful, advanced RAG Assistant powered by Gemini.
You have access to the user's uploaded knowledge base documents.

CRITICAL INSTRUCTION: Analyze the provided document context sections below. You must use them explicitly to answer the user's request with deep analytical reasoning. If the context does not contain the answer, use your general knowledge to reply but explicitly mention what files are uploaded.

DOCUMENT CONTEXT SECTIONS:
${retrievedText || "No document context chunks are currently indexed for this query."}`;

    // 4. Map the chat history cleanly to Gemini's expected structure
    const geminiContents = messages
      .filter(m => m.content && m.content.trim() !== "")
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    if (geminiContents.length === 0) {
      geminiContents.push({ role: "user", parts: [{ text: query || "Hello" }] });
    }

    const encoder = new TextEncoder();
    let assistantReplyAccumulator = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Immediately stream source document citations to the UI
          const sourcesLine = JSON.stringify({ type: "sources", sources }) + "\n";
          controller.enqueue(encoder.encode(sourcesLine));

          // 5. Query Gemini's official live endpoint directly using streamGenerateContent
          const apiKey = process.env.GEMINI_API_KEY;
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: geminiContents,
                systemInstruction: {
                  parts: [{ text: detailedSystemPrompt }]
                },
                generationConfig: {
                  maxOutputTokens: 2048,
                  temperature: 0.3
                }
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API rejected connection: ${response.status} - ${errorText}`);
          }

          // BUG FIX #2: Read the full response body, then parse the JSON array.
          // Gemini's streamGenerateContent returns a JSON array: [{...}, {...}, ...]
          // Trying to split the raw byte stream by "},\n" is fragile and drops tokens.
          // The correct approach is to accumulate the full body and parse it as a JSON array.
          const fullBody = await response.text();

          let chunks;
          try {
            chunks = JSON.parse(fullBody);
          } catch (parseError) {
            // If for some reason the body is not valid JSON, surface the raw error
            throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}. Body: ${fullBody.slice(0, 500)}`);
          }

          // chunks is an array of GenerateContentResponse objects
          if (!Array.isArray(chunks)) {
            // Single object response (non-streaming fallback)
            chunks = [chunks];
          }

          for (const chunk of chunks) {
            const token = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (token) {
              assistantReplyAccumulator += token;
              const sanitizedText = token.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
              const outputLine = JSON.stringify({ type: "text", text: sanitizedText }) + "\n";
              controller.enqueue(encoder.encode(outputLine));
            }
          }

          // 7. Commit conversation logs back to Supabase
          const finalMessagesArray = [
            ...messages.filter(m => m.content && m.content.trim() !== ""),
            { role: "assistant", content: assistantReplyAccumulator }
          ];

          if (chatId) {
            await supabase
              .from("chats")
              .update({ messages: finalMessagesArray })
              .eq("id", chatId);
          } else {
            const autoTitle = query.length > 25 ? query.substring(0, 25) + "..." : query;
            await supabase
              .from("chats")
              .insert({
                user_id: user.id,
                title: autoTitle,
                messages: finalMessagesArray
              });
          }

          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
          controller.close();
        } catch (err) {
          console.error("Gemini stream processing failure:", err);
          const errLine = JSON.stringify({ type: "text", text: `Gemini Stream Error: ${err.message}` }) + "\n";
          controller.enqueue(encoder.encode(errLine));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat routing runtime crash container:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}