/**
 * Global Singleton Vector Store Wrapper
 * This prevents Next.js hot-reloads from clearing out your uploaded text chunks.
 */
if (!global._globalVectorStore) {
  global._globalVectorStore = [];
}

// Bind our operational reference pointer directly to the persistent global scope array
let vectorStore = global._globalVectorStore;

/**
 * Adds parsed document chunks to the persistent memory store
 * @param {Array} chunks 
 */
export function addChunks(chunks) {
  if (Array.isArray(chunks)) {
    vectorStore.push(...chunks);
    console.log(`\x1b[32m[VectorStore Cache Success]: Indexed ${chunks.length} new chunks. Total database size: ${vectorStore.length} chunks.\x1b[0m`);
  }
}

/**
 * Removes a document's chunks from persistent memory by source filename
 * @param {string} source 
 */
export function removeDocument(source) {
  global._globalVectorStore = global._globalVectorStore.filter((chunk) => chunk.source !== source);
  vectorStore = global._globalVectorStore; // Sync pointer reference
  console.log(`[VectorStore]: Removed ${source}. Remaining total chunks: ${vectorStore.length}`);
}

/**
 * Basic Keyword Similarity Scoring Engine
 */
export function search(query, topK = 5) {
  if (!query || vectorStore.length === 0) return [];
  
  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/);
  
  const scored = vectorStore.map((chunk) => {
    let matches = 0;
    tokens.forEach((token) => {
      if (token.length > 2 && chunk.text.toLowerCase().includes(token)) {
        matches++;
      }
    });
    return { ...chunk, score: matches };
  });

  return scored
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * CRITICAL GETTER: Safely exports the persistent global array to lib/retrieval.js
 */
export function getStore() {
  return vectorStore;
}