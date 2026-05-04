/**
 * Wave AI — Image Modification — Canvas History (Extended Undo/Redo)
 */
export class CanvasHistoryManager {
  constructor(maxSteps = 50) { this.history = []; this.index = -1; this.maxSteps = maxSteps; this.canvas = null; this.ctx = null; }
  init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.snapshot("Initial"); }
  snapshot(label = "Action") {
    if (this.index < this.history.length - 1) this.history = this.history.slice(0, this.index + 1);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history.push({ imageData, label, timestamp: Date.now() });
    if (this.history.length > this.maxSteps) this.history.shift();
    else this.index++;
  }
  undo() {
    if (this.index <= 0) return false;
    this.index--;
    const { imageData } = this.history[this.index];
    this.canvas.width = imageData.width; this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0); return true;
  }
  redo() {
    if (this.index >= this.history.length - 1) return false;
    this.index++;
    const { imageData } = this.history[this.index];
    this.ctx.putImageData(imageData, 0, 0); return true;
  }
  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.history.length - 1; }
  reset() { if (this.history.length) { const { imageData } = this.history[0]; this.ctx.putImageData(imageData, 0, 0); this.index = 0; } }
  getHistory() { return this.history.map((h, i) => ({ index: i, label: h.label, timestamp: h.timestamp, isCurrent: i === this.index })); }
  getCurrentLabel() { return this.history[this.index]?.label || ""; }
  clear() { this.history = []; this.index = -1; }
}
export const canvasHistoryManager = new CanvasHistoryManager();
