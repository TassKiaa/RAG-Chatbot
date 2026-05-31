import { NextResponse } from "next/server";
import { chunkText } from "../../../lib/chunker";
import { addChunks, removeDocument } from "../../../lib/vectorStore";

/**
 * POST /api/upload
 * Safely handles document parsing or flags image data assets into localized vector units.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const mimeType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    // 1. Handling for Images - Clean flat descriptive text to avoid JSON breaks
    if (
      mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      fileName.toLowerCase().endsWith(".jpg") ||
      fileName.toLowerCase().endsWith(".jpeg") ||
      fileName.toLowerCase().endsWith(".png")
    ) {
      const clientExtractedText = formData.get("extractedText");
      if (clientExtractedText) {
        text = clientExtractedText;
      } else {
        text = `Image Document File named ${fileName}. This image has been uploaded successfully into the knowledge base placeholder tracking system.`;
      }
    } 
    // 2. Plain Text Handlers
    else if (mimeType === "text/plain" || fileName.toLowerCase().endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } 
    // 3. PDF Parsing Handler
    else if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const result = await pdfParse(buffer);
      text = result.text;
    } 
    // 4. DOCX Word Document Parsing Handler
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.toLowerCase().endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } 
    // 5. Markdown Parsing Handler
    else if (mimeType === "text/markdown" || fileName.toLowerCase().endsWith(".md")) {
      text = buffer.toString("utf-8");
    } 
    // 6. Universal text fallback 
    else {
      text = buffer.toString("utf-8");
    }

    // Security length assertion validation
    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Could not extract sufficient text content from this file format." },
        { status: 422 }
      );
    }

    // Call chunker passing context file mapping attributes
    const chunks = chunkText(text, fileName);

    const chunkObjects = chunks.map((chunkText, i) => ({
      id: `${fileName}-chunk-${i}`,
      text: chunkText,
      source: fileName,
    }));

    // Save to our persistent global memory store
    addChunks(chunkObjects);

    return NextResponse.json({
      success: true,
      fileName,
      chunks: chunkObjects.length,
      preview: text.slice(0, 200),
    });
  } catch (err) {
    console.error("Upload route operational error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/upload
 */
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  if (!source) {
    return NextResponse.json({ error: "No source provided" }, { status: 400 });
  }

  removeDocument(source);
  return NextResponse.json({ success: true, removed: source });
}