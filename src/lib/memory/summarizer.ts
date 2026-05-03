/* ═══════════════════════════════════════════════════════════════
   Wave AI — Conversation Summarizer
   Compresses long conversations into dense summaries to extend
   effective context window beyond the model's token limit.
═══════════════════════════════════════════════════════════════ */

import { MemoryEntry } from "./shortTerm";
import { approximateTokenCount } from "@/lib/tokenizer";

export interface SummaryResult {
  summary: string;
  tokens: number;
  turnsCovered: number;
  keyPoints: string[];
  entities: string[];
  topics: string[];
  compressionRatio: number;
}

/* ── Extract key sentences (extractive summary) ──────────────── */
function sentenceScore(sentence: string, allSentences: string[]): number {
  const words = sentence.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();

  for (const s of allSentences) {
    for (const w of s.toLowerCase().split(/\s+/)) {
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
  }

  let score = 0;
  for (const word of words) {
    score += (wordFreq.get(word) || 0);
  }

  if (sentence.includes("?")) score += 5;
  if (/\d/.test(sentence)) score += 3;
  if (/^(I |We |You )/.test(sentence)) score += 2;
  if (sentence.length > 50 && sentence.length < 200) score += 2;

  return score;
}

function extractiveSummarize(text: string, maxSentences = 5): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  if (sentences.length <= maxSentences) return text;

  const scored = sentences.map(s => ({ s, score: sentenceScore(s, sentences) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxSentences).map(x => x.s);

  return sentences.filter(s => top.includes(s)).join(" ").trim();
}

/* ── Progressive summary of entries ─────────────────────────── */
export function summarizeEntries(entries: MemoryEntry[]): SummaryResult {
  if (entries.length === 0) {
    return {
      summary: "",
      tokens: 0,
      turnsCovered: 0,
      keyPoints: [],
      entities: [],
      topics: [],
      compressionRatio: 1,
    };
  }

  const originalText = entries.map(e =>
    `${e.role === "user" ? "User" : "Wave AI"}: ${e.content}`
  ).join("\n");

  const originalTokens = approximateTokenCount(originalText);

  const userMessages = entries.filter(e => e.role === "user");
  const aiMessages = entries.filter(e => e.role === "assistant");

  const keyPoints: string[] = [];

  for (const msg of userMessages.slice(-5)) {
    const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences[0]) keyPoints.push(`User asked: ${sentences[0].trim()}`);
  }

  for (const msg of aiMessages.slice(-3)) {
    const point = extractiveSummarize(msg.content, 2);
    if (point) keyPoints.push(`Wave AI: ${point}`);
  }

  const allEntities = [...new Set(entries.flatMap(e => e.entities))].slice(0, 15);
  const allTopics = [...new Set(entries.flatMap(e => e.topics))];

  const summary = [
    `Conversation of ${entries.length} turns covering: ${allTopics.join(", ")}.`,
    ...keyPoints.slice(0, 6),
  ].join(" ");

  const summaryTokens = approximateTokenCount(summary);

  return {
    summary,
    tokens: summaryTokens,
    turnsCovered: entries.length,
    keyPoints,
    entities: allEntities,
    topics: allTopics,
    compressionRatio: originalTokens > 0 ? summaryTokens / originalTokens : 1,
  };
}

/* ── Rolling summarizer ──────────────────────────────────────── */
export class RollingSummarizer {
  private summaries: string[] = [];
  private maxSummaries = 5;

  add(summary: SummaryResult): void {
    this.summaries.push(summary.summary);
    if (this.summaries.length > this.maxSummaries) {
      this.summaries.shift();
    }
  }

  getCombinedSummary(): string {
    return this.summaries.join(" ").trim();
  }

  clear(): void {
    this.summaries = [];
  }
}

/* ── Format context with summary prefix ─────────────────────── */
export function buildContextWithSummary(
  summary: string,
  recentEntries: MemoryEntry[],
  maxTokens = 2048
): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`[Earlier in this conversation: ${summary}]`);
  }

  let tokenBudget = maxTokens - approximateTokenCount(parts.join(""));

  for (const entry of [...recentEntries].reverse()) {
    const line = `${entry.role === "user" ? "User" : "Wave AI"}: ${entry.content}`;
    const lineTokens = approximateTokenCount(line);
    if (tokenBudget - lineTokens < 0) break;
    parts.unshift(line);
    tokenBudget -= lineTokens;
  }

  return parts.join("\n");
}
