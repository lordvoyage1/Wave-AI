/* ═══════════════════════════════════════════════════════════════
   Wave AI — Short-Term Memory (Working Memory)
   Sliding window context with attention-weighted importance scoring.
   Keeps the most relevant recent messages in active context.
═══════════════════════════════════════════════════════════════ */

import { approximateTokenCount } from "@/lib/tokenizer";
import WAVE_CONFIG from "@/lib/config";

export interface MemoryEntry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokens: number;
  importance: number;
  turnIndex: number;
  entities: string[];
  topics: string[];
}

export interface WorkingMemory {
  sessionId: string;
  entries: MemoryEntry[];
  totalTokens: number;
  turnCount: number;
  startTime: number;
  lastActivity: number;
  summary?: string;
}

/* ── Entity extraction (lightweight) ────────────────────────── */
const ENTITY_PATTERNS = [
  /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
  /\b(https?:\/\/[^\s]+)\b/g,
  /\b(\d{4}-\d{2}-\d{2})\b/g,
  /\b([A-Z]{2,})\b/g,
];

function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  for (const pattern of ENTITY_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      if (match[1]) entities.add(match[1]);
    }
  }
  return Array.from(entities).slice(0, 10);
}

/* ── Topic extraction ────────────────────────────────────────── */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  code: ["code", "function", "class", "variable", "debug", "error", "api", "database", "algorithm"],
  math: ["calculate", "equation", "formula", "algebra", "geometry", "statistics", "number"],
  creative: ["story", "poem", "write", "creative", "fiction", "character", "narrative"],
  science: ["biology", "chemistry", "physics", "medicine", "research", "experiment"],
  history: ["history", "ancient", "century", "war", "civilization", "historical"],
  technology: ["ai", "machine learning", "technology", "software", "hardware", "internet"],
  general: [],
};

function extractTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) topics.push(topic);
  }
  return topics.length > 0 ? topics : ["general"];
}

/* ── Importance scoring ──────────────────────────────────────── */
function scoreImportance(content: string, role: string, turnIndex: number, totalTurns: number): number {
  let score = 0.5;

  if (role === "user") score += 0.1;

  const recency = turnIndex / Math.max(totalTurns, 1);
  score += recency * 0.3;

  const length = content.length;
  if (length > 200) score += 0.1;
  if (length > 500) score += 0.05;

  const hasQuestion = /\?/.test(content);
  if (hasQuestion) score += 0.1;

  const hasCode = /```/.test(content);
  if (hasCode) score += 0.15;

  const hasNumbers = /\d+/.test(content);
  if (hasNumbers) score += 0.05;

  return Math.min(1, score);
}

/* ── ShortTermMemory class ───────────────────────────────────── */
export class ShortTermMemory {
  private memory: WorkingMemory;
  private maxTokens: number;
  private maxEntries: number;

  constructor(sessionId: string) {
    this.maxTokens = WAVE_CONFIG.memory.contextWindow * 0.6;
    this.maxEntries = WAVE_CONFIG.memory.maxShortTermMessages;
    this.memory = {
      sessionId,
      entries: [],
      totalTokens: 0,
      turnCount: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
    };
  }

  add(role: "user" | "assistant" | "system", content: string): MemoryEntry {
    const tokens = approximateTokenCount(content);
    const turnIndex = this.memory.turnCount++;

    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      timestamp: Date.now(),
      tokens,
      importance: scoreImportance(content, role, turnIndex, this.memory.turnCount),
      turnIndex,
      entities: extractEntities(content),
      topics: extractTopics(content),
    };

    this.memory.entries.push(entry);
    this.memory.totalTokens += tokens;
    this.memory.lastActivity = Date.now();

    this.evictIfNeeded();
    return entry;
  }

  private evictIfNeeded(): void {
    while (
      this.memory.entries.length > this.maxEntries ||
      this.memory.totalTokens > this.maxTokens
    ) {
      const evictIdx = this.findLowestImportanceIndex();
      if (evictIdx === -1) break;
      const evicted = this.memory.entries.splice(evictIdx, 1)[0];
      this.memory.totalTokens -= evicted.tokens;
    }
  }

  private findLowestImportanceIndex(): number {
    if (this.memory.entries.length === 0) return -1;
    let minScore = Infinity;
    let minIdx = -1;
    for (let i = 0; i < this.memory.entries.length - 2; i++) {
      const e = this.memory.entries[i];
      if (e.importance < minScore) {
        minScore = e.importance;
        minIdx = i;
      }
    }
    return minIdx;
  }

  getEntries(limit?: number): MemoryEntry[] {
    const entries = this.memory.entries;
    return limit ? entries.slice(-limit) : entries;
  }

  getContext(maxTokens?: number): string {
    const budget = maxTokens ?? 2048;
    const entries = [...this.memory.entries].reverse();
    const selected: MemoryEntry[] = [];
    let tokenCount = 0;

    for (const entry of entries) {
      if (tokenCount + entry.tokens > budget) break;
      selected.unshift(entry);
      tokenCount += entry.tokens;
    }

    return selected
      .map(e => `${e.role === "user" ? "User" : "Wave AI"}: ${e.content}`)
      .join("\n");
  }

  toMessages(): Array<{ role: string; content: string }> {
    return this.memory.entries.map(e => ({
      role: e.role,
      content: e.content,
    }));
  }

  getSummary(): string | undefined {
    return this.memory.summary;
  }

  setSummary(summary: string): void {
    this.memory.summary = summary;
  }

  getStats() {
    return {
      entryCount: this.memory.entries.length,
      totalTokens: this.memory.totalTokens,
      turnCount: this.memory.turnCount,
      sessionAge: Date.now() - this.memory.startTime,
      lastActivity: this.memory.lastActivity,
      topics: [...new Set(this.memory.entries.flatMap(e => e.topics))],
      entities: [...new Set(this.memory.entries.flatMap(e => e.entities))],
    };
  }

  clear(): void {
    this.memory.entries = [];
    this.memory.totalTokens = 0;
    this.memory.summary = undefined;
  }
}
