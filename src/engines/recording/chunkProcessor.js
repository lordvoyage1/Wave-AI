/**
 * Wave AI Recording Engine — Chunk Processor
 * Process audio/video chunks in real-time for streaming,
 * analysis, and live transcription pipeline.
 */

export class ChunkProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.handlers = new Map();
    this.stats = { processed: 0, errors: 0, totalBytes: 0, avgProcessingMs: 0 };
    this.maxQueueSize = 100;
  }

  register(name, handler) { this.handlers.set(name, handler); }
  unregister(name) { this.handlers.delete(name); }

  enqueue(chunk, metadata = {}) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }
    this.queue.push({ chunk, metadata, enqueuedAt: Date.now() });
    if (!this.processing) this._processQueue();
  }

  async _processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      const start = performance.now();
      for (const [name, handler] of this.handlers) {
        try {
          await handler(item.chunk, item.metadata);
        } catch (err) {
          this.stats.errors++;
          console.warn(`ChunkProcessor handler "${name}" error:`, err);
        }
      }
      const elapsed = performance.now() - start;
      this.stats.processed++;
      this.stats.totalBytes += item.chunk.size || 0;
      this.stats.avgProcessingMs = (this.stats.avgProcessingMs * (this.stats.processed - 1) + elapsed) / this.stats.processed;
    }
    this.processing = false;
  }

  getStats() { return { ...this.stats, queueSize: this.queue.length }; }
  clear() { this.queue = []; }
}

export class StreamingBuffer {
  constructor(targetDurationMs = 5000) {
    this.chunks = [];
    this.targetDurationMs = targetDurationMs;
    this.startTime = null;
    this.callbacks = [];
  }

  add(chunk) {
    if (!this.startTime) this.startTime = Date.now();
    this.chunks.push({ chunk, time: Date.now() });
    if (Date.now() - this.startTime >= this.targetDurationMs) {
      this._flush();
    }
  }

  _flush() {
    if (this.chunks.length === 0) return;
    const blob = new Blob(this.chunks.map(c => c.chunk), { type: this.chunks[0].chunk.type });
    this.callbacks.forEach(cb => { try { cb(blob); } catch {} });
    this.chunks = [];
    this.startTime = null;
  }

  onFlush(callback) { this.callbacks.push(callback); }
  forceFlush() { this._flush(); }

  getTotalSize() { return this.chunks.reduce((s, c) => s + (c.chunk.size || 0), 0); }
  getCount() { return this.chunks.length; }
  getElapsedMs() { return this.startTime ? Date.now() - this.startTime : 0; }
}

export async function mergeAudioChunks(chunks, mimeType) {
  const merged = new Blob(chunks, { type: mimeType });
  return merged;
}

export function calculateChunkStats(chunks) {
  const totalSize = chunks.reduce((s, c) => s + (c.size || 0), 0);
  return {
    count: chunks.length,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(1),
    avgSize: chunks.length > 0 ? Math.round(totalSize / chunks.length) : 0,
  };
}

export const chunkProcessor = new ChunkProcessor();
