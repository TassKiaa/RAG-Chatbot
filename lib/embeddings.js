/**
 * Lightweight TF-IDF based embeddings for in-memory vector search.
 * For production, replace with a real embedding model (OpenAI, Cohere, etc.)
 */

/**
 * Tokenize text into terms.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Compute term frequencies for a document.
 * @param {string[]} terms
 * @returns {Map<string, number>}
 */
function termFrequency(terms) {
  const tf = new Map();
  for (const t of terms) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  const max = Math.max(...tf.values());
  for (const [k, v] of tf) tf.set(k, v / max);
  return tf;
}

/**
 * Build a sparse TF vector for a piece of text given a vocabulary.
 * @param {string} text
 * @param {string[]} vocab
 * @returns {number[]}
 */
export function buildVector(text, vocab) {
  const terms = tokenize(text);
  const tf = termFrequency(terms);
  return vocab.map((word) => tf.get(word) || 0);
}

/**
 * Build vocabulary from a collection of texts.
 * @param {string[]} texts
 * @returns {string[]}
 */
export function buildVocabulary(texts) {
  const vocab = new Set();
  for (const text of texts) {
    for (const term of tokenize(text)) {
      vocab.add(term);
    }
  }
  return Array.from(vocab);
}

/**
 * Cosine similarity between two vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
