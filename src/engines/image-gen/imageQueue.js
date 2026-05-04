/**
 * Wave AI — Image Generation — Generation Queue Manager
 */
export class ImageGenerationQueue {
  constructor() { this.queue = []; this.active = null; this.processing = false; this.listeners = new Map(); this.maxConcurrent = 1; }

  on(event, cb) { if (!this.listeners.has(event)) this.listeners.set(event, []); this.listeners.get(event).push(cb); }
  emit(event, data) { (this.listeners.get(event) || []).forEach(cb => { try { cb(data); } catch {} }); }

  add(generationFn, metadata = {}) {
    const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const item = { id, generationFn, metadata, status: "queued", addedAt: Date.now() };
    this.queue.push(item);
    this.emit("queued", { id, position: this.queue.length });
    if (!this.processing) this._process();
    return id;
  }

  async _process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      this.active = item;
      item.status = "processing";
      item.startedAt = Date.now();
      this.emit("started", { id: item.id, metadata: item.metadata });
      try {
        const result = await item.generationFn();
        item.status = "completed";
        item.result = result;
        item.completedAt = Date.now();
        item.duration = item.completedAt - item.startedAt;
        this.emit("completed", { id: item.id, result, duration: item.duration });
      } catch (err) {
        item.status = "failed";
        item.error = err.message;
        this.emit("failed", { id: item.id, error: err.message });
      }
      this.active = null;
    }
    this.processing = false;
    this.emit("idle", {});
  }

  cancel(id) {
    const idx = this.queue.findIndex(i => i.id === id);
    if (idx !== -1) { this.queue.splice(idx, 1); this.emit("cancelled", { id }); return true; }
    return false;
  }

  clear() { this.queue = []; }
  getQueue() { return [...this.queue]; }
  getActive() { return this.active; }
  getQueueLength() { return this.queue.length; }
}
export const imageGenerationQueue = new ImageGenerationQueue();
