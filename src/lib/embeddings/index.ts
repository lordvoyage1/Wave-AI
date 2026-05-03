/* ═══════════════════════════════════════════════════════════════
   Wave AI — Embeddings Engine
   Semantic vector representations for text using HuggingFace
   sentence-transformers. Supports cosine similarity, clustering.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";

export type EmbeddingVector = number[];

export interface EmbeddingResult {
  vector: EmbeddingVector;
  dimensions: number;
  model: string;
  text: string;
  cached: boolean;
}

export interface SimilarityResult {
  score: number;
  index: number;
  text?: string;
}

/* ── In-memory embedding cache ──────────────────────────────── */
const embCache = new Map<string, EmbeddingVector>();
const EMB_CACHE_MAX = 2000;

function cacheKey(text: string, model: string): string {
  return `${model}::${text.slice(0, 512)}`;
}

/* ── HuggingFace inference API call ─────────────────────────── */
async function fetchEmbedding(
  text: string,
  model: string,
  apiKey?: string
): Promise<EmbeddingVector | null> {
  const url = `${WAVE_CONFIG.huggingface.baseUrl}/${model}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: text }),
      signal: AbortSignal.timeout(WAVE_CONFIG.huggingface.timeout),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0] as EmbeddingVector;
    }
    if (Array.isArray(data)) {
      return data as EmbeddingVector;
    }
    return null;
  } catch {
    return null;
  }
}

/* ── Local pseudo-embedding (deterministic fallback) ─────────── */
function localEmbedding(text: string, dims = 384): EmbeddingVector {
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let c = 0; c < word.length; c++) {
      const idx = (word.charCodeAt(c) * 31 + w * 17 + c * 7) % dims;
      vec[idx] += 1 / (w + 1);
    }
  }
  return normalize(vec);
}

/* ── Vector math ─────────────────────────────────────────────── */
export function normalize(vec: EmbeddingVector): EmbeddingVector {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vec;
  return vec.map(v => v / magnitude);
}

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function euclideanDistance(a: EmbeddingVector, b: EmbeddingVector): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

export function dotProduct(a: EmbeddingVector, b: EmbeddingVector): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/* ── Add vectors ─────────────────────────────────────────────── */
export function addVectors(a: EmbeddingVector, b: EmbeddingVector): EmbeddingVector {
  return a.map((v, i) => v + b[i]);
}

export function averageVectors(vecs: EmbeddingVector[]): EmbeddingVector {
  if (vecs.length === 0) return [];
  const sum = vecs.reduce(addVectors);
  return sum.map(v => v / vecs.length);
}

/* ── Main embed function ─────────────────────────────────────── */
export async function embed(
  text: string,
  apiKey?: string,
  model = WAVE_CONFIG.huggingface.models.embedding
): Promise<EmbeddingResult> {
  const key = cacheKey(text, model);
  if (embCache.has(key)) {
    return {
      vector: embCache.get(key)!,
      dimensions: embCache.get(key)!.length,
      model,
      text,
      cached: true,
    };
  }

  let vector: EmbeddingVector;
  if (apiKey) {
    const fetched = await fetchEmbedding(text, model, apiKey);
    vector = fetched ?? localEmbedding(text);
  } else {
    vector = localEmbedding(text);
  }

  if (embCache.size >= EMB_CACHE_MAX) {
    const first = embCache.keys().next().value;
    if (first) embCache.delete(first);
  }
  embCache.set(key, vector);

  return { vector, dimensions: vector.length, model, text, cached: false };
}

/* ── Batch embed ─────────────────────────────────────────────── */
export async function embedBatch(
  texts: string[],
  apiKey?: string
): Promise<EmbeddingResult[]> {
  return Promise.all(texts.map(t => embed(t, apiKey)));
}

/* ── Similarity search ───────────────────────────────────────── */
export function findMostSimilar(
  query: EmbeddingVector,
  candidates: EmbeddingVector[],
  topK = 5,
  threshold = 0
): SimilarityResult[] {
  return candidates
    .map((vec, index) => ({ score: cosineSimilarity(query, vec), index }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/* ── Clustering (k-means) ────────────────────────────────────── */
export function kMeansClusters(
  vectors: EmbeddingVector[],
  k: number,
  iterations = 10
): number[] {
  if (vectors.length === 0 || k <= 0) return [];
  k = Math.min(k, vectors.length);
  const dims = vectors[0].length;

  let centroids = vectors.slice(0, k).map(v => [...v]);
  let assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < vectors.length; i++) {
      let bestCluster = 0;
      let bestSim = -Infinity;
      for (let c = 0; c < k; c++) {
        const sim = cosineSimilarity(vectors[i], centroids[c]);
        if (sim > bestSim) { bestSim = sim; bestCluster = c; }
      }
      assignments[i] = bestCluster;
    }

    const newCentroids: EmbeddingVector[] = Array.from({ length: k }, () => new Array(dims).fill(0));
    const counts = new Array(k).fill(0);

    for (let i = 0; i < vectors.length; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dims; d++) newCentroids[c][d] += vectors[i][d];
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = newCentroids[c].map(v => v / counts[c]);
      }
    }
  }

  return assignments;
}

/* ── Clear cache ─────────────────────────────────────────────── */
export function clearEmbeddingCache(): void {
  embCache.clear();
}

export function embeddingCacheSize(): number {
  return embCache.size;
}
