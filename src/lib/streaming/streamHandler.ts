/* ═══════════════════════════════════════════════════════════════
   Wave AI — Streaming Handler
   Server-sent events and chunked streaming for real-time
   token-by-token response delivery.
═══════════════════════════════════════════════════════════════ */

export type StreamChunk = {
  type: "token" | "done" | "error" | "metadata";
  content: string;
  index: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

export type StreamCallback = (chunk: StreamChunk) => void;

export interface StreamSession {
  id: string;
  active: boolean;
  chunks: StreamChunk[];
  startTime: number;
  totalTokens: number;
  cancel: () => void;
}

/* ── Active stream registry ──────────────────────────────────── */
const activeStreams = new Map<string, StreamSession>();

/* ── Create a streaming session ──────────────────────────────── */
export function createStream(onChunk: StreamCallback): StreamSession {
  const id = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ctrl = new AbortController();

  const session: StreamSession = {
    id,
    active: true,
    chunks: [],
    startTime: Date.now(),
    totalTokens: 0,
    cancel: () => {
      ctrl.abort();
      session.active = false;
      activeStreams.delete(id);
    },
  };

  activeStreams.set(id, session);
  return session;
}

/* ── Simulate streaming from a complete response ─────────────── */
export async function simulateStream(
  fullText: string,
  session: StreamSession,
  onChunk: StreamCallback,
  chunkSize = 3,
  delayMs = 18
): Promise<void> {
  const words = fullText.split(/(\s+)/);
  let index = 0;
  let buffer = "";

  for (let i = 0; i < words.length; i += chunkSize) {
    if (!session.active) break;

    const wordGroup = words.slice(i, i + chunkSize).join("");
    buffer += wordGroup;

    if (buffer.length >= 8 || i + chunkSize >= words.length) {
      const chunk: StreamChunk = {
        type: "token",
        content: buffer,
        index: index++,
        timestamp: Date.now(),
      };

      session.chunks.push(chunk);
      session.totalTokens++;
      onChunk(chunk);
      buffer = "";

      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  if (buffer && session.active) {
    const chunk: StreamChunk = { type: "token", content: buffer, index: index++, timestamp: Date.now() };
    session.chunks.push(chunk);
    onChunk(chunk);
  }

  const doneChunk: StreamChunk = {
    type: "done",
    content: "",
    index: index,
    timestamp: Date.now(),
    metadata: { totalTokens: session.totalTokens, durationMs: Date.now() - session.startTime },
  };

  session.chunks.push(doneChunk);
  session.active = false;
  onChunk(doneChunk);
  activeStreams.delete(session.id);
}

/* ── Reconstruct full text from chunks ───────────────────────── */
export function reconstructFromChunks(chunks: StreamChunk[]): string {
  return chunks.filter(c => c.type === "token").map(c => c.content).join("");
}

/* ── Stream stats ────────────────────────────────────────────── */
export function getStreamStats(session: StreamSession) {
  const elapsed = Date.now() - session.startTime;
  const tokensPerSec = elapsed > 0 ? (session.totalTokens / elapsed) * 1000 : 0;
  return {
    id: session.id,
    active: session.active,
    chunks: session.chunks.length,
    totalTokens: session.totalTokens,
    elapsedMs: elapsed,
    tokensPerSecond: Math.round(tokensPerSec),
  };
}

export function cancelAllStreams(): void {
  for (const session of activeStreams.values()) session.cancel();
  activeStreams.clear();
}

export function getActiveStreamCount(): number {
  return activeStreams.size;
}
