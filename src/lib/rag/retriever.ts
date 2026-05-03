/* ═══════════════════════════════════════════════════════════════
   Wave AI — RAG Retriever
   Retrieval-Augmented Generation pipeline. Indexes documents,
   retrieves relevant chunks for query augmentation.
═══════════════════════════════════════════════════════════════ */

import { embed, embedBatch } from "@/lib/embeddings";
import { knowledgeStore, documentStore, VectorDocument, SearchResult } from "@/lib/vector/store";
import { chunkDocument, chunkMarkdown, ChunkOptions } from "./chunker";
import WAVE_CONFIG from "@/lib/config";

export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  type: "text" | "markdown" | "code" | "pdf" | "web" | "qa";
  metadata: Record<string, unknown>;
  addedAt: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  queryTokens: number;
  retrievalTimeMs: number;
  totalCandidates: number;
  augmentedContext: string;
}

export interface RetrievedChunk {
  text: string;
  score: number;
  source: string;
  title: string;
  chunkIndex: number;
  documentId: string;
}

const HF_API_KEY = () => import.meta.env.VITE_HF_API_KEY as string | undefined;

/* ── Document registry ───────────────────────────────────────── */
const docRegistry = new Map<string, Document>();

/* ── Index a document ────────────────────────────────────────── */
export async function indexDocument(
  doc: Document,
  options: ChunkOptions = {}
): Promise<number> {
  docRegistry.set(doc.id, doc);

  const chunks = doc.type === "markdown"
    ? chunkMarkdown(doc.content)
    : chunkDocument(doc.content, { ...options, strategy: doc.type === "code" ? "code" : "paragraph" });

  if (chunks.length === 0) return 0;

  const texts = chunks.map(c => c.text);
  const apiKey = HF_API_KEY();
  const embedResults = await embedBatch(texts, apiKey);

  const vectorDocs: VectorDocument[] = chunks.map((chunk, i) => ({
    id: `${doc.id}_chunk_${i}`,
    text: chunk.text,
    vector: embedResults[i].vector,
    metadata: {
      documentId: doc.id,
      documentTitle: doc.title,
      source: doc.source,
      type: doc.type,
      chunkIndex: chunk.index,
      totalChunks: chunk.total,
      ...chunk.metadata,
      ...doc.metadata,
    },
    createdAt: Date.now(),
    source: doc.source,
    chunkIndex: chunk.index,
    totalChunks: chunk.total,
  }));

  const store = doc.type === "qa" ? knowledgeStore : documentStore;
  store.upsertBatch(vectorDocs);

  return chunks.length;
}

/* ── Index built-in knowledge ────────────────────────────────── */
export async function indexKnowledgeBase(items: Array<{
  question: string;
  answer: string;
  tags?: string[];
}>): Promise<number> {
  let total = 0;
  for (const item of items) {
    const doc: Document = {
      id: `kb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: item.question,
      content: `Q: ${item.question}\nA: ${item.answer}`,
      source: "wave_knowledge_base",
      type: "qa",
      metadata: { tags: item.tags ?? [], question: item.question },
      addedAt: Date.now(),
    };
    const count = await indexDocument(doc);
    total += count;
  }
  return total;
}

/* ── Retrieve relevant chunks ────────────────────────────────── */
export async function retrieve(
  query: string,
  topK = WAVE_CONFIG.rag.topK,
  threshold = WAVE_CONFIG.rag.minSimilarity
): Promise<RetrievalResult> {
  const start = performance.now();
  const apiKey = HF_API_KEY();
  const queryEmb = await embed(query, apiKey);

  const kbResults = knowledgeStore.search(queryEmb.vector, topK, threshold);
  const docResults = documentStore.search(queryEmb.vector, topK, threshold);

  const allResults: SearchResult[] = [...kbResults, ...docResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const chunks: RetrievedChunk[] = allResults.map(r => ({
    text: r.document.text,
    score: r.score,
    source: r.document.source ?? "unknown",
    title: String(r.document.metadata.documentTitle ?? "Document"),
    chunkIndex: r.document.chunkIndex ?? 0,
    documentId: String(r.document.metadata.documentId ?? r.document.id),
  }));

  const augmentedContext = buildAugmentedContext(query, chunks);

  return {
    chunks,
    queryTokens: queryEmb.vector.length,
    retrievalTimeMs: Math.round(performance.now() - start),
    totalCandidates: kbResults.length + docResults.length,
    augmentedContext,
  };
}

/* ── Build context string for LLM ────────────────────────────── */
function buildAugmentedContext(query: string, chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const contextParts = chunks.map((chunk, i) =>
    `[Source ${i + 1}: ${chunk.title}]\n${chunk.text}`
  );

  return [
    "Relevant information retrieved from knowledge base:",
    ...contextParts,
    "\nUse the above information to answer the user's question when relevant.",
  ].join("\n\n");
}

/* ── Delete a document and its chunks ────────────────────────── */
export function deleteDocument(docId: string): number {
  docRegistry.delete(docId);
  let deleted = 0;
  const kbDocs = knowledgeStore.getAll().filter(d =>
    String(d.metadata.documentId) === docId
  );
  const docDocs = documentStore.getAll().filter(d =>
    String(d.metadata.documentId) === docId
  );
  for (const d of kbDocs) { knowledgeStore.delete(d.id); deleted++; }
  for (const d of docDocs) { documentStore.delete(d.id); deleted++; }
  return deleted;
}

/* ── List indexed documents ──────────────────────────────────── */
export function listDocuments(): Document[] {
  return Array.from(docRegistry.values());
}

/* ── RAG stats ───────────────────────────────────────────────── */
export function ragStats() {
  return {
    indexedDocuments: docRegistry.size,
    knowledgeChunks: knowledgeStore.stats().totalDocuments,
    documentChunks: documentStore.stats().totalDocuments,
    totalChunks: knowledgeStore.stats().totalDocuments + documentStore.stats().totalDocuments,
  };
}
