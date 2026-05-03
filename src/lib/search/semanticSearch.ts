/* ═══════════════════════════════════════════════════════════════
   Wave AI — Semantic Search Engine
   Full-text + semantic search over conversation history,
   knowledge base, and indexed documents.
═══════════════════════════════════════════════════════════════ */

import { embed, cosineSimilarity } from "@/lib/embeddings";
import { knowledgeStore, documentStore } from "@/lib/vector/store";
import { searchKnowledge } from "@/lib/knowledge/waveKnowledge";

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  source: "knowledge" | "document" | "conversation" | "tool";
  title: string;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  topK?: number;
  threshold?: number;
  sources?: Array<"knowledge" | "document" | "conversation">;
  filters?: Record<string, unknown>;
  useSemantics?: boolean;
  useLexical?: boolean;
}

/* ── Lexical search (BM25-inspired) ─────────────────────────── */
function termFrequency(term: string, text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const count = words.filter(w => w === term.toLowerCase()).length;
  return count / words.length;
}

function inverseDocFrequency(term: string, docs: string[]): number {
  const docsWithTerm = docs.filter(d => d.toLowerCase().includes(term.toLowerCase())).length;
  return Math.log((docs.length + 1) / (docsWithTerm + 1)) + 1;
}

function bm25Score(query: string, doc: string, avgDocLength: number, k1 = 1.5, b = 0.75): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const docWords = doc.toLowerCase().split(/\s+/);
  let score = 0;

  for (const term of terms) {
    const tf = docWords.filter(w => w === term).length;
    const docLength = docWords.length;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
    score += (numerator / denominator);
  }

  return score;
}

/* ── Hybrid search (semantic + lexical) ─────────────────────── */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    topK = 10,
    threshold = 0.3,
    sources = ["knowledge", "document"],
    useSemantics = true,
    useLexical = true,
  } = options;

  const results: SearchResult[] = [];

  /* Lexical match in built-in knowledge */
  if (useLexical) {
    const lexicalHits = searchKnowledge(query);
    for (const hit of lexicalHits) {
      const combinedText = `${hit.question} ${hit.answer}`;
      const queryWords = query.toLowerCase().split(/\s+/);
      const matchScore = queryWords.filter(w =>
        combinedText.toLowerCase().includes(w)
      ).length / queryWords.length;

      if (matchScore >= 0.3) {
        results.push({
          id: hit.id,
          text: `Q: ${hit.question}\nA: ${hit.answer}`,
          score: matchScore * 0.8,
          source: "knowledge",
          title: hit.question,
          metadata: { category: hit.category, tags: hit.tags, confidence: hit.confidence },
        });
      }
    }
  }

  /* Semantic search */
  if (useSemantics) {
    try {
      const apiKey = import.meta.env.VITE_HF_API_KEY as string | undefined;
      const queryEmb = await embed(query, apiKey);

      if (sources.includes("knowledge")) {
        const kbResults = knowledgeStore.search(queryEmb.vector, topK, threshold);
        for (const r of kbResults) {
          const existing = results.find(x => x.id === r.document.id);
          if (existing) {
            existing.score = Math.max(existing.score, r.score);
          } else {
            results.push({
              id: r.document.id,
              text: r.document.text,
              score: r.score,
              source: "knowledge",
              title: String(r.document.metadata.documentTitle ?? "Knowledge Base"),
              metadata: r.document.metadata,
            });
          }
        }
      }

      if (sources.includes("document")) {
        const docResults = documentStore.search(queryEmb.vector, topK, threshold);
        for (const r of docResults) {
          results.push({
            id: r.document.id,
            text: r.document.text,
            score: r.score,
            source: "document",
            title: String(r.document.metadata.documentTitle ?? "Document"),
            metadata: r.document.metadata,
          });
        }
      }
    } catch { /* semantic search failed, fall through to lexical */ }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/* ── Conversation search ─────────────────────────────────────── */
export function searchConversation(
  query: string,
  messages: Array<{ role: string; content: string }>,
  topK = 5
): Array<{ content: string; role: string; score: number; index: number }> {
  const avgLength = messages.reduce((s, m) => s + m.content.split(/\s+/).length, 0) / Math.max(1, messages.length);
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  return messages
    .map((msg, index) => {
      const lexical = bm25Score(query, msg.content, avgLength);
      const wordMatch = queryWords.filter(w => msg.content.toLowerCase().includes(w)).length / queryWords.length;
      const recencyBonus = (index / messages.length) * 0.2;
      return { ...msg, score: lexical * 0.4 + wordMatch * 0.4 + recencyBonus, index };
    })
    .filter(r => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/* ── Suggest related queries ─────────────────────────────────── */
export function suggestRelatedQueries(query: string): string[] {
  const lower = query.toLowerCase();
  const suggestions: string[] = [];

  if (/what is|what are/.test(lower)) {
    suggestions.push(query.replace(/what is|what are/i, "how does"));
    suggestions.push(query.replace(/what is|what are/i, "why is"));
    suggestions.push(`examples of ${lower.replace(/what is|what are/i, "").trim()}`);
  }

  if (/how (to|do|does)/.test(lower)) {
    suggestions.push(`best practices for ${lower.replace(/how (to|do|does)/i, "").trim()}`);
    suggestions.push(query.replace(/how (to|do|does)/i, "why should I"));
  }

  if (/python|javascript|typescript|react|node/.test(lower)) {
    const lang = lower.match(/python|javascript|typescript|react|node/)?.[0] ?? "";
    suggestions.push(`${lang} best practices`);
    suggestions.push(`${lang} tutorial for beginners`);
    suggestions.push(`common ${lang} mistakes to avoid`);
  }

  return suggestions.slice(0, 3);
}

/* ── Auto-complete suggestions ───────────────────────────────── */
const COMMON_PREFIXES = [
  "How do I", "What is", "Explain", "Write a", "Create a", "Generate", "Help me",
  "What are the", "How does", "Can you", "Show me how to", "What's the difference between",
  "Debug this", "Fix this", "Optimize", "Summarize",
];

export function getAutocompleteSuggestions(partial: string): string[] {
  if (!partial || partial.length < 2) return [];
  const lower = partial.toLowerCase();
  return COMMON_PREFIXES.filter(p => p.toLowerCase().startsWith(lower)).slice(0, 5);
}
