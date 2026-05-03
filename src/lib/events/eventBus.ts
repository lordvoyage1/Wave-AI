/* ═══════════════════════════════════════════════════════════════
   Wave AI — Event Bus
   Pub/sub system for inter-module communication. Decouples
   components: pipeline, UI, metrics, feedback all communicate
   through typed events.
═══════════════════════════════════════════════════════════════ */

export type WaveEventType =
  | "message:sent"
  | "message:received"
  | "message:error"
  | "stream:start"
  | "stream:chunk"
  | "stream:end"
  | "tool:called"
  | "tool:result"
  | "memory:stored"
  | "memory:retrieved"
  | "rag:retrieved"
  | "safety:blocked"
  | "safety:flagged"
  | "feedback:submitted"
  | "session:started"
  | "session:ended"
  | "model:switched"
  | "cache:hit"
  | "cache:miss"
  | "error:critical"
  | "error:warning";

export interface WaveEvent<T = unknown> {
  type: WaveEventType;
  payload: T;
  timestamp: number;
  sessionId?: string;
  source?: string;
}

type EventHandler<T = unknown> = (event: WaveEvent<T>) => void | Promise<void>;

/* ── Event Bus implementation ────────────────────────────────── */
class EventBus {
  private handlers = new Map<WaveEventType, Set<EventHandler>>();
  private history: WaveEvent[] = [];
  private maxHistory = 1000;

  on<T = unknown>(type: WaveEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler as EventHandler);
    return () => this.off(type, handler);
  }

  once<T = unknown>(type: WaveEventType, handler: EventHandler<T>): () => void {
    const wrapped: EventHandler<T> = (event) => {
      handler(event);
      this.off(type, wrapped);
    };
    return this.on(type, wrapped);
  }

  off<T = unknown>(type: WaveEventType, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler as EventHandler);
  }

  emit<T = unknown>(type: WaveEventType, payload: T, meta: Partial<WaveEvent> = {}): void {
    const event: WaveEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      ...meta,
    };

    this.history.push(event as WaveEvent);
    if (this.history.length > this.maxHistory) this.history.shift();

    const handlers = this.handlers.get(type);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        const result = handler(event as WaveEvent);
        if (result instanceof Promise) result.catch(console.error);
      } catch (e) {
        console.error(`Event handler error for ${type}:`, e);
      }
    }
  }

  getHistory(type?: WaveEventType, limit = 100): WaveEvent[] {
    const filtered = type ? this.history.filter(e => e.type === type) : this.history;
    return filtered.slice(-limit);
  }

  clearHistory(): void {
    this.history = [];
  }

  listenerCount(type: WaveEventType): number {
    return this.handlers.get(type)?.size ?? 0;
  }
}

/* ── Singleton event bus ─────────────────────────────────────── */
export const waveBus = new EventBus();

/* ── Convenience emitters ────────────────────────────────────── */
export const events = {
  messageSent: (content: string, sessionId?: string) =>
    waveBus.emit("message:sent", { content }, { sessionId }),

  messageReceived: (content: string, provider: string, sessionId?: string) =>
    waveBus.emit("message:received", { content, provider }, { sessionId }),

  streamChunk: (chunk: string, index: number, sessionId?: string) =>
    waveBus.emit("stream:chunk", { chunk, index }, { sessionId }),

  toolCalled: (name: string, params: unknown, sessionId?: string) =>
    waveBus.emit("tool:called", { name, params }, { sessionId }),

  safetyBlocked: (reason: string, sessionId?: string) =>
    waveBus.emit("safety:blocked", { reason }, { sessionId }),

  feedbackSubmitted: (type: string, requestId: string) =>
    waveBus.emit("feedback:submitted", { type, requestId }),

  error: (message: string, severity: "warning" | "critical" = "warning", sessionId?: string) =>
    waveBus.emit(`error:${severity}`, { message }, { sessionId }),
};
