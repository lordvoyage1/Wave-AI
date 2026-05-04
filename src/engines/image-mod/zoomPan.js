/**
 * Wave AI — Image Modification — Zoom & Pan Controller
 */
export class ZoomPanController {
  constructor(canvas, imageCanvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.imageCanvas = imageCanvas; this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.isPanning = false; this.lastX = 0; this.lastY = 0; this._setup(); }
  _setup() {
    this.canvas.addEventListener("wheel", (e) => { e.preventDefault(); const delta = e.deltaY > 0 ? 0.9 : 1.1; this.zoomAt(e.offsetX, e.offsetY, delta); }, { passive: false });
    this.canvas.addEventListener("mousedown", (e) => { if (e.button === 1 || e.altKey) { this.isPanning = true; this.lastX = e.clientX; this.lastY = e.clientY; e.preventDefault(); } });
    this.canvas.addEventListener("mousemove", (e) => { if (this.isPanning) { this.offsetX += e.clientX - this.lastX; this.offsetY += e.clientY - this.lastY; this.lastX = e.clientX; this.lastY = e.clientY; this.render(); } });
    this.canvas.addEventListener("mouseup", () => { this.isPanning = false; });
  }
  zoomAt(x, y, factor) {
    const prev = this.scale; this.scale = Math.max(0.1, Math.min(10, this.scale * factor));
    this.offsetX = x - (x - this.offsetX) * (this.scale / prev);
    this.offsetY = y - (y - this.offsetY) * (this.scale / prev);
    this.render();
  }
  zoomIn() { this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1.2); }
  zoomOut() { this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 0.8); }
  fitToCanvas() { const sw = this.canvas.width / this.imageCanvas.width, sh = this.canvas.height / this.imageCanvas.height; this.scale = Math.min(sw, sh); this.offsetX = (this.canvas.width - this.imageCanvas.width * this.scale) / 2; this.offsetY = (this.canvas.height - this.imageCanvas.height * this.scale) / 2; this.render(); }
  resetView() { this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.render(); }
  render() { if (!this.ctx || !this.imageCanvas) return; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.save(); this.ctx.translate(this.offsetX, this.offsetY); this.ctx.scale(this.scale, this.scale); this.ctx.drawImage(this.imageCanvas, 0, 0); this.ctx.restore(); }
  getTransform() { return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY }; }
  canvasToImage(x, y) { return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale }; }
}
