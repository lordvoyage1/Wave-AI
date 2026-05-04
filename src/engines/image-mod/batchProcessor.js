/**
 * Wave AI — Image Modification — Batch Processor
 */
export class ImageBatchProcessor {
  constructor() { this.queue = []; this.results = []; this.progress = 0; this.callbacks = {}; }
  addJob(imageBlob, operations = [], metadata = {}) { const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; this.queue.push({ id, blob: imageBlob, operations, metadata }); return id; }
  async processAll(callbacks = {}) {
    this.callbacks = callbacks;
    this.results = []; this.progress = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const job = this.queue[i];
      callbacks.onStart?.(job.id, i, this.queue.length);
      try {
        const result = await this._processJob(job);
        this.results.push({ id: job.id, success: true, result, metadata: job.metadata });
        this.progress = ((i + 1) / this.queue.length) * 100;
        callbacks.onComplete?.(job.id, result, this.progress);
      } catch (err) {
        this.results.push({ id: job.id, success: false, error: err.message });
        callbacks.onError?.(job.id, err.message);
      }
    }
    this.queue = [];
    callbacks.onAllDone?.(this.results);
    return this.results;
  }
  async _processJob(job) {
    const { modifyImage } = await import("./index.js").catch(() => ({ modifyImage: async (blob) => ({ dataURL: URL.createObjectURL(blob) }) }));
    return modifyImage ? modifyImage(URL.createObjectURL(job.blob), job.operations) : { dataURL: URL.createObjectURL(job.blob) };
  }
  getProgress() { return this.progress; }
  getResults() { return [...this.results]; }
  clear() { this.queue = []; this.results = []; this.progress = 0; }
  getQueueSize() { return this.queue.length; }
}
export const imageBatchProcessor = new ImageBatchProcessor();
