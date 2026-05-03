/* ═══════════════════════════════════════════════════════════════
   Wave AI — Request Scheduler
   Priority queue for managing concurrent AI requests. Prevents
   overload, manages backpressure, and schedules retries.
═══════════════════════════════════════════════════════════════ */

export type RequestPriority = "critical" | "high" | "normal" | "low";

export interface ScheduledRequest<T = unknown> {
  id: string;
  priority: RequestPriority;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
  maxWaitMs: number;
  retries: number;
  maxRetries: number;
}

const PRIORITY_SCORES: Record<RequestPriority, number> = {
  critical: 4, high: 3, normal: 2, low: 1,
};

/* ── Priority Queue ──────────────────────────────────────────── */
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | null {
    return this.items.shift()?.item ?? null;
  }

  peek(): T | null {
    return this.items[0]?.item ?? null;
  }

  get size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }

  removeExpired(maxWaitMs: number): T[] {
    const now = Date.now();
    const expired: T[] = [];
    this.items = this.items.filter(({ item }) => {
      const req = item as unknown as ScheduledRequest;
      if (now - req.enqueuedAt > maxWaitMs) { expired.push(item); return false; }
      return true;
    });
    return expired;
  }
}

/* ── Request Scheduler ───────────────────────────────────────── */
export class RequestScheduler {
  private queue = new PriorityQueue<ScheduledRequest>();
  private running = 0;
  private totalProcessed = 0;
  private totalFailed = 0;

  constructor(
    private maxConcurrent: number = 5,
    private defaultMaxWaitMs: number = 30000
  ) {}

  schedule<T>(
    fn: () => Promise<T>,
    options: { priority?: RequestPriority; maxWaitMs?: number; maxRetries?: number } = {}
  ): Promise<T> {
    const { priority = "normal", maxWaitMs = this.defaultMaxWaitMs, maxRetries = 2 } = options;

    return new Promise<T>((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const request: ScheduledRequest<T> = {
        id, priority, fn,
        resolve: resolve as (v: unknown) => void,
        reject,
        enqueuedAt: Date.now(),
        maxWaitMs,
        retries: 0,
        maxRetries,
      };
      this.queue.enqueue(request, PRIORITY_SCORES[priority]);
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.isEmpty()) return;

    const expired = this.queue.removeExpired(this.defaultMaxWaitMs);
    for (const req of expired) {
      req.reject(new Error("Request timed out in queue"));
      this.totalFailed++;
    }

    const request = this.queue.dequeue();
    if (!request) return;

    this.running++;
    try {
      const result = await request.fn();
      request.resolve(result);
      this.totalProcessed++;
    } catch (e) {
      if (request.retries < request.maxRetries) {
        request.retries++;
        const delay = 1000 * Math.pow(2, request.retries - 1);
        setTimeout(() => {
          this.queue.enqueue(request, PRIORITY_SCORES[request.priority]);
          this.processNext();
        }, delay);
      } else {
        request.reject(e instanceof Error ? e : new Error(String(e)));
        this.totalFailed++;
      }
    } finally {
      this.running--;
      this.processNext();
    }
  }

  getStats() {
    return {
      queueSize: this.queue.size,
      running: this.running,
      maxConcurrent: this.maxConcurrent,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      successRate: this.totalProcessed / Math.max(1, this.totalProcessed + this.totalFailed),
    };
  }

  drain(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this.queue.isEmpty() && this.running === 0) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
  }
}

export const globalScheduler = new RequestScheduler(5, 30000);
