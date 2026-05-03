/* ═══════════════════════════════════════════════════════════════
   Wave AI — Vector Store
   In-browser vector database with HNSW-like approximate nearest
   neighbor search. Persists to localStorage for knowledge base.
═══════════════════════════════════════════════════════════════ */

import { EmbeddingVector, cosineSimilarity, findMostSimilar } from "@/lib/embeddings";

export interface VectorDocument {
  id: string;
  text: string;
  vector: EmbeddingVector;
  metadata: Record<string, unknown>;
  createdAt: number;
  source?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
  rank: number;
}

export interface StoreStats {
  totalDocuments: number;
  indexName: string;
  avgDimensions: number;
  memoryEstimateKB: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

/* ── HNSW-approximated index layer ───────────────────────────── */
interface HNSWNode {
  id: string;
  vector: EmbeddingVector;
  neighbors: Map<number, string[]>;
  level: number;
}

class HNSWIndex {
  private nodes = new Map<string, HNSWNode>();
  private entryPoint: string | null = null;
  private maxLevel = 0;
  private M = 16;
  private efConstruction = 200;

  private getRandomLevel(): number {
    let level = 0;
    while (Math.random() < 0.5 && level < 6) level++;
    return level;
  }

  insert(id: string, vector: EmbeddingVector): void {
    const level = this.getRandomLevel();
    const node: HNSWNode = { id, vector, neighbors: new Map(), level };
    for (let l = 0; l <= level; l++) node.neighbors.set(l, []);
    this.nodes.set(id, node);

    if (!this.entryPoint) {
      this.entryPoint = id;
      this.maxLevel = level;
      return;
    }

    if (level > this.maxLevel) {
      this.maxLevel = level;
      this.entryPoint = id;
    }

    for (let l = Math.min(level, this.maxLevel); l >= 0; l--) {
      const candidates = this.searchLayer(vector, this.entryPoint, this.M, l);
      const nodeNeighbors = node.neighbors.get(l) || [];
      for (const cid of candidates.slice(0, this.M)) {
        nodeNeighbors.push(cid);
        const cNode = this.nodes.get(cid);
        if (cNode) {
          const cNeighbors = cNode.neighbors.get(l) || [];
          cNeighbors.push(id);
          cNode.neighbors.set(l, cNeighbors.slice(0, this.M));
        }
      }
      node.neighbors.set(l, nodeNeighbors);
    }
  }

  private searchLayer(query: EmbeddingVector, entry: string, ef: number, level: number): string[] {
    const visited = new Set<string>([entry]);
    const candidates: Array<[number, string]> = [];
    const entryNode = this.nodes.get(entry);
    if (!entryNode) return [];

    const entrySim = cosineSimilarity(query, entryNode.vector);
    candidates.push([entrySim, entry]);

    let i = 0;
    while (i < candidates.length) {
      const [, current] = candidates[i];
      i++;
      const currentNode = this.nodes.get(current);
      if (!currentNode) continue;
      const neighbors = currentNode.neighbors.get(level) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const neighborNode = this.nodes.get(neighbor);
          if (neighborNode) {
            const sim = cosineSimilarity(query, neighborNode.vector);
            candidates.push([sim, neighbor]);
          }
        }
      }
    }

    return candidates.sort((a, b) => b[0] - a[0]).slice(0, ef).map(c => c[1]);
  }

  search(query: EmbeddingVector, topK: number): Array<[string, number]> {
    if (!this.entryPoint || this.nodes.size === 0) return [];
    const results = this.searchLayer(query, this.entryPoint, topK * 2, 0);
    return results
      .map(id => {
        const node = this.nodes.get(id);
        if (!node) return null;
        return [id, cosineSimilarity(query, node.vector)] as [string, number];
      })
      .filter(Boolean) as Array<[string, number]>
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK);
  }

  delete(id: string): void {
    this.nodes.delete(id);
    if (this.entryPoint === id) {
      this.entryPoint = this.nodes.keys().next().value ?? null;
    }
  }

  size(): number {
    return this.nodes.size;
  }

  clear(): void {
    this.nodes.clear();
    this.entryPoint = null;
    this.maxLevel = 0;
  }
}

/* ── VectorStore class ───────────────────────────────────────── */
export class VectorStore {
  private documents = new Map<string, VectorDocument>();
  private index = new HNSWIndex();
  private storageKey: string;

  constructor(indexName: string) {
    this.storageKey = `wave_vector_${indexName}`;
    this.loadFromStorage();
  }

  /* Add or update a document */
  upsert(doc: VectorDocument): void {
    if (this.documents.has(doc.id)) {
      this.index.delete(doc.id);
    }
    this.documents.set(doc.id, doc);
    this.index.insert(doc.id, doc.vector);
    this.saveToStorage();
  }

  /* Batch upsert */
  upsertBatch(docs: VectorDocument[]): void {
    for (const doc of docs) {
      if (this.documents.has(doc.id)) this.index.delete(doc.id);
      this.documents.set(doc.id, doc);
      this.index.insert(doc.id, doc.vector);
    }
    this.saveToStorage();
  }

  /* Delete a document */
  delete(id: string): boolean {
    if (!this.documents.has(id)) return false;
    this.documents.delete(id);
    this.index.delete(id);
    this.saveToStorage();
    return true;
  }

  /* Search for similar documents */
  search(query: EmbeddingVector, topK = 5, threshold = 0): SearchResult[] {
    const indexResults = this.index.search(query, topK * 2);

    if (indexResults.length === 0) {
      const allVecs = Array.from(this.documents.values()).map(d => d.vector);
      const allIds = Array.from(this.documents.keys());
      const simResults = findMostSimilar(query, allVecs, topK, threshold);
      return simResults.map((r, rank) => ({
        document: this.documents.get(allIds[r.index])!,
        score: r.score,
        rank,
      })).filter(r => r.document);
    }

    return indexResults
      .filter(([, score]) => score >= threshold)
      .slice(0, topK)
      .map(([id, score], rank) => ({
        document: this.documents.get(id)!,
        score,
        rank,
      }))
      .filter(r => r.document);
  }

  /* Get by ID */
  get(id: string): VectorDocument | null {
    return this.documents.get(id) ?? null;
  }

  /* Get all documents */
  getAll(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  /* Get by source */
  getBySource(source: string): VectorDocument[] {
    return Array.from(this.documents.values()).filter(d => d.source === source);
  }

  /* Stats */
  stats(): StoreStats {
    const docs = Array.from(this.documents.values());
    const timestamps = docs.map(d => d.createdAt);
    const totalDims = docs.reduce((s, d) => s + d.vector.length, 0);
    const memoryKB = Math.round(
      JSON.stringify(Array.from(this.documents.values())).length / 1024
    );

    return {
      totalDocuments: this.documents.size,
      indexName: this.storageKey,
      avgDimensions: docs.length > 0 ? Math.round(totalDims / docs.length) : 0,
      memoryEstimateKB: memoryKB,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /* Clear all */
  clear(): void {
    this.documents.clear();
    this.index.clear();
    try { localStorage.removeItem(this.storageKey); } catch { /* ignore */ }
  }

  /* Persistence */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.documents.entries()));
      localStorage.setItem(this.storageKey, data);
    } catch { /* storage full — skip */ }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const entries: Array<[string, VectorDocument]> = JSON.parse(raw);
      for (const [id, doc] of entries) {
        this.documents.set(id, doc);
        this.index.insert(id, doc.vector);
      }
    } catch { /* corrupt data — skip */ }
  }
}

/* ── Singleton instances ─────────────────────────────────────── */
export const knowledgeStore = new VectorStore("knowledge_v1");
export const conversationStore = new VectorStore("conversations_v1");
export const documentStore = new VectorStore("documents_v1");
