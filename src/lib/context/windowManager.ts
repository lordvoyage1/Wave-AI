/* ═══════════════════════════════════════════════════════════════
   Wave AI — Context Window Manager
   Manages the effective context window across conversations,
   handling compression, truncation, and priority scheduling.
═══════════════════════════════════════════════════════════════ */

import { approximateTokenCount, truncateToTokens, TokenBudget } from "@/lib/tokenizer";
import { summarizeEntries } from "@/lib/memory/summarizer";

export interface ContextSlot {
  id: string;
  priority: number;
  content: string;
  tokens: number;
  type: "system" | "history" | "rag" | "memory" | "tool" | "user" | "assistant";
  required: boolean;
}

export interface ContextWindow {
  slots: ContextSlot[];
  totalTokens: number;
  maxTokens: number;
  utilization: number;
  truncated: boolean;
}

/* ── Context Window Manager class ────────────────────────────── */
export class ContextWindowManager {
  private slots: ContextSlot[] = [];
  private budget: TokenBudget;

  constructor(private maxTokens: number = 4096) {
    this.budget = new TokenBudget(maxTokens);
  }

  addSlot(
    id: string,
    content: string,
    type: ContextSlot["type"],
    priority: number = 5,
    required: boolean = false
  ): boolean {
    const tokens = approximateTokenCount(content);
    const slot: ContextSlot = { id, priority, content, tokens, type, required };

    const existing = this.slots.findIndex(s => s.id === id);
    if (existing >= 0) this.slots[existing] = slot;
    else this.slots.push(slot);

    return true;
  }

  removeSlot(id: string): void {
    this.slots = this.slots.filter(s => s.id !== id);
  }

  build(): ContextWindow {
    const sorted = [...this.slots].sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return b.priority - a.priority;
    });

    const selected: ContextSlot[] = [];
    let totalTokens = 0;
    let truncated = false;

    for (const slot of sorted) {
      if (totalTokens + slot.tokens <= this.maxTokens) {
        selected.push(slot);
        totalTokens += slot.tokens;
      } else if (slot.required) {
        const truncated_content = truncateToTokens(slot.content, this.maxTokens - totalTokens);
        selected.push({ ...slot, content: truncated_content, tokens: approximateTokenCount(truncated_content) });
        totalTokens += approximateTokenCount(truncated_content);
        truncated = true;
      } else {
        truncated = true;
      }
    }

    return {
      slots: selected.sort((a, b) => this.typeOrder(a.type) - this.typeOrder(b.type)),
      totalTokens,
      maxTokens: this.maxTokens,
      utilization: totalTokens / this.maxTokens,
      truncated,
    };
  }

  private typeOrder(type: ContextSlot["type"]): number {
    const order = { system: 0, memory: 1, rag: 2, history: 3, tool: 4, user: 5, assistant: 6 };
    return order[type] ?? 99;
  }

  buildPrompt(): string {
    const window = this.build();
    const parts: string[] = [];

    const byType = new Map<string, ContextSlot[]>();
    for (const slot of window.slots) {
      const list = byType.get(slot.type) ?? [];
      list.push(slot);
      byType.set(slot.type, list);
    }

    const system = byType.get("system") ?? [];
    const memories = byType.get("memory") ?? [];
    const rag = byType.get("rag") ?? [];
    const history = byType.get("history") ?? [];

    if (system.length > 0) parts.push(system.map(s => s.content).join("\n"));
    if (memories.length > 0) parts.push(`[Memory: ${memories.map(s => s.content).join("; ")}]`);
    if (rag.length > 0) parts.push(rag.map(s => s.content).join("\n\n"));
    if (history.length > 0) parts.push(history.map(s => s.content).join("\n"));

    return parts.join("\n\n");
  }

  getStats() {
    const window = this.build();
    return {
      slots: window.slots.length,
      totalTokens: window.totalTokens,
      maxTokens: this.maxTokens,
      utilization: Math.round(window.utilization * 100),
      truncated: window.truncated,
      byType: Object.fromEntries(
        window.slots.reduce((map, slot) => {
          map.set(slot.type, (map.get(slot.type) ?? 0) + slot.tokens);
          return map;
        }, new Map<string, number>())
      ),
    };
  }

  reset(): void {
    this.slots = [];
    this.budget.reset();
  }
}

/* ── Conversation compressor ─────────────────────────────────── */
export function compressHistory(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): Array<{ role: string; content: string }> {
  const currentTokens = messages.reduce((s, m) => s + approximateTokenCount(m.content), 0);
  if (currentTokens <= maxTokens) return messages;

  const keepLast = Math.min(6, messages.length);
  const recent = messages.slice(-keepLast);
  const older = messages.slice(0, -keepLast);

  if (older.length === 0) return recent;

  const entries = older.map(m => ({
    id: `ctx_${Math.random().toString(36).slice(2, 7)}`,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    timestamp: Date.now(),
    tokens: approximateTokenCount(m.content),
    importance: 0.5,
    turnIndex: 0,
    entities: [],
    topics: [],
  }));

  const summary = summarizeEntries(entries);
  const summaryMsg = { role: "system", content: `[Earlier conversation summary: ${summary.summary}]` };

  return [summaryMsg, ...recent];
}
