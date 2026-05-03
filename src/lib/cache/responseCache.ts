/* ═══════════════════════════════════════════════════════════════
   Wave AI — Multi-Layer Response Cache
   LRU cache with TTL, semantic deduplication, and hit analytics.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";

export interface CacheEntry<T = string> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastHit: number;
  size: number;
  tags: string[];
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalEvictions: number;
  avgEntryAge: number;
}

/* ── LRU Cache implementation ────────────────────────────────── */
export class LRUCache<T = string> {
  private cache = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    private maxSize: number = WAVE_CONFIG.inference.cacheMaxSize,
    private defaultTTL: number = WAVE_CONFIG.inference.cacheTTL
  ) {}

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    entry.hitCount++;
    entry.lastHit = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number, tags: string[] = []): void {
    if (this.cache.has(key)) this.cache.delete(key);
    while (this.cache.size >= this.maxSize) this.evict();

    const now = Date.now();
    const serialized = JSON.stringify(value);
    this.cache.set(key, {
      key,
      value,
      createdAt: now,
      expiresAt: now + (ttl ?? this.defaultTTL),
      hitCount: 0,
      lastHit: now,
      size: serialized.length,
      tags,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return false; }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) { this.cache.delete(key); count++; }
    }
    return count;
  }

  private evict(): void {
    const first = this.cache.keys().next().value;
    if (first) { this.cache.delete(first); this.evictions++; }
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  stats(): CacheStats {
    const total = this.hits + this.misses;
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    const avgAge = entries.length > 0
      ? entries.reduce((s, e) => s + (now - e.createdAt), 0) / entries.length
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalEvictions: this.evictions,
      avgEntryAge: Math.round(avgAge),
    };
  }

  pruneExpired(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) { this.cache.delete(key); count++; }
    }
    return count;
  }
}

/* ── Singleton caches for different use cases ────────────────── */
export const chatCache = new LRUCache<string>(500, 1000 * 60 * 60);
export const codeCache = new LRUCache<string>(200, 1000 * 60 * 60 * 4);
export const embeddingCache = new LRUCache<number[]>(2000, 1000 * 60 * 60 * 24);
export const toolCache = new LRUCache<unknown>(100, 1000 * 60 * 5);

/* ── Semantic cache key builder ──────────────────────────────── */
export function buildCacheKey(parts: string[]): string {
  return parts.map(p => p.slice(0, 200).toLowerCase().trim()).join("::");
}

/* ── Cache warming ───────────────────────────────────────────── */
const WARM_RESPONSES: Array<[string, string]> = [
  ["who are you", "I am Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — the first advanced AI assistant made in East Africa. The CEO and founder is Meddy Mususwa. How can I help you today?"],
  ["what can you do", "I can help you with a wide range of tasks:\n\n- **Chat & Q&A** — Answer questions on any topic\n- **Code Generation** — Write, debug, and explain code in any language\n- **Image Generation** — Create stunning images from text descriptions\n- **Voice Interaction** — Have a full voice conversation with me\n- **File Analysis** — Analyze documents, images, and data files\n- **Creative Writing** — Stories, poems, scripts, and more\n- **Math & Calculations** — Complex equations and problem solving\n\nWhat would you like to do?"],
  ["hello", "Hello! I'm Wave AI. How can I help you today?"],
  ["hi", "Hi there! What can I help you with?"],
  ["help", "I'm Wave AI, here to help! You can ask me anything — coding questions, creative writing, analysis, math, or just a conversation. What's on your mind?"],
];

export function warmCache(): void {
  for (const [query, response] of WARM_RESPONSES) {
    chatCache.set(buildCacheKey([query]), response, 1000 * 60 * 60 * 24 * 7);
  }
}

warmCache();

/* ── Scheduled pruning ───────────────────────────────────────── */
setInterval(() => {
  chatCache.pruneExpired();
  codeCache.pruneExpired();
  embeddingCache.pruneExpired();
  toolCache.pruneExpired();
}, 1000 * 60 * 15);
