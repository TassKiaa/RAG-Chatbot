import { search, getStore } from "./vectorStore.js";

/**
 * Retrieve relevant chunks for a query and format them as LLM context.
 * @param {string} query
 * @param {number} topK
 * @returns {{ context: string, sources: { text: string, source: string, score: number }[] }}
 */
export function retrieveContext(query, topK = 5) {
  // 1. Attempt the standard vector/keyword search
  let results = search(query, topK);
  const lowerQuery = query.toLowerCase();

  // 2. SMART FALLBACK: If user wants a summary OR if the search returned nothing,
  // we pull chunks directly from the store to ensure Gemini isn't left blind.
  if (results.length === 0 || lowerQuery.includes("summarize") || lowerQuery.includes("summary")) {
    const allChunks = getStore ? getStore() : [];
    
    if (allChunks.length > 0) {
      // If they named a specific file format, prioritize chunks from those files
      if (lowerQuery.includes("docx") || lowerQuery.includes("doc")) {
        results = allChunks.filter(c => c.source.toLowerCase().endsWith(".docx") || c.source.toLowerCase().endsWith(".doc")).slice(0, topK);
      } else if (lowerQuery.includes("pdf")) {
        results = allChunks.filter(c => c.source.toLowerCase().endsWith(".pdf")).slice(0, topK);
      } else if (lowerQuery.includes("jpg") || lowerQuery.includes("jpeg") || lowerQuery.includes("png")) {
        results = allChunks.filter(c => c.source.toLowerCase().endsWith(".jpg") || c.source.toLowerCase().endsWith(".jpeg") || c.source.toLowerCase().endsWith(".png")).slice(0, topK);
      }
      
      // Fallback: Just grab the first few chunks of whatever is uploaded if no specific format matched
      if (results.length === 0) {
        results = allChunks.slice(0, topK);
      }
    }
  }

  if (!results || results.length === 0) {
    return { context: "", sources: [] };
  }

  // 3. Format context blocks clearly for the LLM injection engine
  const context = results
    .map((r, i) => `[Source ${i + 1}: ${r.source}]\n${r.text}`)
    .join("\n\n---\n\n");

  return { context, sources: results };
}

/**
 * Build the system prompt with retrieved context injected.
 * @param {string} context
 * @returns {string}
 */
export function buildSystemPrompt(context) {
  const base = `You are a helpful, precise assistant. Answer questions clearly and concisely.
Use markdown formatting where appropriate (bullet points, bold, code blocks).
Always be honest — if you don't know something, say so.`;

  if (!context || context.trim() === "") {
    return (
      base +
      "\n\nNo documents have been uploaded yet. Answer from your general knowledge."
    );
  }

  return `${base}

## Retrieved Context
The following passages are retrieved from the user's uploaded documents. 
Use them to answer the question. Cite sources as [Source N] when referencing them.
CRITICAL: If context is present above, use it to answer or summarize. Do not tell the user you cannot read or access local files, because the text content has been directly provided to you right here.

${context}`;
}