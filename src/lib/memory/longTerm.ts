/* ═══════════════════════════════════════════════════════════════
   Wave AI — Long-Term Memory
   Persistent episodic and semantic memory using vector embeddings.
   Retrieves relevant memories based on semantic similarity.
═══════════════════════════════════════════════════════════════ */

import { embed, cosineSimilarity, EmbeddingVector } from "@/lib/embeddings";
import WAVE_CONFIG from "@/lib/config";

export type MemoryType = "episodic" | "semantic" | "procedural" | "preference";

export interface LongTermMemoryEntry {
  id: string;
  content: string;
  summary: string;
  vector: EmbeddingVector;
  type: MemoryType;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  importance: number;
  tags: string[];
  relatedIds: string[];
}

export interface MemorySearchResult {
  entry: LongTermMemoryEntry;
  relevance: number;
  recencyScore: number;
  finalScore: number;
}

const STORAGE_KEY = "wave_ltm_v2";
const MAX_ENTRIES = WAVE_CONFIG.memory.maxLongTermEntries;

/* ── Persistence helpers ─────────────────────────────────────── */
function saveMemories(memories: Map<string, LongTermMemoryEntry>): void {
  try {
    const data = Array.from(memories.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

function loadMemories(): Map<string, LongTermMemoryEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw));
  } catch { return new Map(); }
}

/* ── Recency scoring ─────────────────────────────────────────── */
function recencyScore(timestamp: number): number {
  const ageMs = Date.now() - timestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays / 30);
}

/* ── LongTermMemory class ────────────────────────────────────── */
export class LongTermMemory {
  private memories: Map<string, LongTermMemoryEntry>;

  constructor() {
    this.memories = loadMemories();
  }

  async store(
    content: string,
    summary: string,
    type: MemoryType = "episodic",
    options: {
      userId?: string;
      sessionId?: string;
      importance?: number;
      tags?: string[];
    } = {}
  ): Promise<LongTermMemoryEntry> {
    const apiKey = import.meta.env.VITE_HF_API_KEY;
    const embResult = await embed(summary, apiKey);

    const id = `ltm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const entry: LongTermMemoryEntry = {
      id,
      content,
      summary,
      vector: embResult.vector,
      type,
      userId: options.userId,
      sessionId: options.sessionId,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      importance: options.importance ?? 0.5,
      tags: options.tags ?? [],
      relatedIds: [],
    };

    if (this.memories.size >= MAX_ENTRIES) {
      this.evictLeastImportant();
    }

    this.memories.set(id, entry);
    this.linkRelated(entry);
    saveMemories(this.memories);

    return entry;
  }

  async search(
    query: string,
    topK = 5,
    filters: { type?: MemoryType; userId?: string; tags?: string[] } = {}
  ): Promise<MemorySearchResult[]> {
    const apiKey = import.meta.env.VITE_HF_API_KEY;
    const queryEmb = await embed(query, apiKey);

    const candidates = Array.from(this.memories.values()).filter(m => {
      if (filters.type && m.type !== filters.type) return false;
      if (filters.userId && m.userId !== filters.userId) return false;
      if (filters.tags?.length && !filters.tags.some(t => m.tags.includes(t))) return false;
      return true;
    });

    const results: MemorySearchResult[] = candidates.map(entry => {
      const relevance = cosineSimilarity(queryEmb.vector, entry.vector);
      const recency = recencyScore(entry.timestamp);
      const accessBonus = Math.min(0.1, entry.accessCount * 0.01);
      const finalScore = relevance * 0.6 + recency * 0.3 + entry.importance * 0.1 + accessBonus;

      return { entry, relevance, recencyScore: recency, finalScore };
    });

    const sorted = results
      .filter(r => r.relevance >= WAVE_CONFIG.memory.similarityThreshold * 0.8)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK);

    for (const r of sorted) {
      r.entry.accessCount++;
      r.entry.lastAccessed = Date.now();
    }

    if (sorted.length > 0) saveMemories(this.memories);
    return sorted;
  }

  private linkRelated(newEntry: LongTermMemoryEntry): void {
    const threshold = 0.8;
    for (const [id, existing] of this.memories) {
      if (id === newEntry.id) continue;
      const sim = cosineSimilarity(newEntry.vector, existing.vector);
      if (sim >= threshold) {
        newEntry.relatedIds.push(id);
        existing.relatedIds.push(newEntry.id);
      }
    }
  }

  private evictLeastImportant(): void {
    let minScore = Infinity;
    let minId: string | null = null;

    for (const [id, entry] of this.memories) {
      const score = entry.importance * 0.5 + recencyScore(entry.timestamp) * 0.3
        + Math.min(1, entry.accessCount / 10) * 0.2;
      if (score < minScore) { minScore = score; minId = id; }
    }

    if (minId) this.memories.delete(minId);
  }

  get(id: string): LongTermMemoryEntry | null {
    return this.memories.get(id) ?? null;
  }

  delete(id: string): boolean {
    const deleted = this.memories.delete(id);
    if (deleted) saveMemories(this.memories);
    return deleted;
  }

  getByType(type: MemoryType): LongTermMemoryEntry[] {
    return Array.from(this.memories.values()).filter(m => m.type === type);
  }

  getAll(): LongTermMemoryEntry[] {
    return Array.from(this.memories.values());
  }

  stats() {
    const all = this.getAll();
    const byType = Object.fromEntries(
      ["episodic", "semantic", "procedural", "preference"].map(t => [
        t, all.filter(m => m.type === t).length
      ])
    );
    return {
      total: all.length,
      byType,
      oldestEntry: all.length > 0 ? Math.min(...all.map(m => m.timestamp)) : null,
      avgImportance: all.length > 0 ? all.reduce((s, m) => s + m.importance, 0) / all.length : 0,
      totalAccesses: all.reduce((s, m) => s + m.accessCount, 0),
    };
  }

  clear(userId?: string): void {
    if (userId) {
      for (const [id, entry] of this.memories) {
        if (entry.userId === userId) this.memories.delete(id);
      }
    } else {
      this.memories.clear();
      localStorage.removeItem(STORAGE_KEY);
    }
    saveMemories(this.memories);
  }
}

export const longTermMemory = new LongTermMemory();
