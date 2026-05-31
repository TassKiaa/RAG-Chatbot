/**
 * Splits a long text into overlapping chunks for retrieval.
 * @param {string} text - Full document text
 * @param {number} chunkSize - Characters per chunk (default 800)
 * @param {number} overlap - Overlap between chunks (default 150)
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  const sentences = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > chunkSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        // Keep overlap: last N characters
        const words = current.split(" ");
        const overlapWords = [];
        let overlapLen = 0;
        for (let i = words.length - 1; i >= 0; i--) {
          overlapLen += words[i].length + 1;
          if (overlapLen > overlap) break;
          overlapWords.unshift(words[i]);
        }
        current = overlapWords.join(" ");
      }
    }
    current = current ? current + " " + sentence : sentence;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 20);
}
