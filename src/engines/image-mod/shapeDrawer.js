/**
 * Wave AI — Image Modification — Shape Drawer
 */
export class ShapeDrawer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas?.getContext("2d"); this.shapes = []; this.currentTool = "rect"; this.strokeColor = "#4f7fff"; this.fillColor = "transparent"; this.lineWidth = 2; this.isDrawing = false; this.startX = 0; this.startY = 0; }
  setTool(tool) { this.currentTool = tool; }
  setStroke(color) { this.strokeColor = color; }
  setFill(color) { this.fillColor = color; }
  setLineWidth(w) { this.lineWidth = w; }
  drawRect(x, y, w, h) { if (!this.ctx) return; this.ctx.beginPath(); this.ctx.rect(x, y, w, h); this._applyStyle(); this.shapes.push({ type: "rect", x, y, w, h, stroke: this.strokeColor, fill: this.fillColor, lw: this.lineWidth }); }
  drawCircle(cx, cy, r) { if (!this.ctx) return; this.ctx.beginPath(); this.ctx.arc(cx, cy, r, 0, Math.PI * 2); this._applyStyle(); this.shapes.push({ type: "circle", cx, cy, r, stroke: this.strokeColor, fill: this.fillColor, lw: this.lineWidth }); }
  drawLine(x1, y1, x2, y2) { if (!this.ctx) return; this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.strokeStyle = this.strokeColor; this.ctx.lineWidth = this.lineWidth; this.ctx.stroke(); }
  drawArrow(x1, y1, x2, y2) {
    if (!this.ctx) return;
    const angle = Math.atan2(y2 - y1, x2 - x1); const len = 15;
    this.drawLine(x1, y1, x2, y2);
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x2 - len * Math.cos(angle - Math.PI / 6), y2 - len * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(x2 - len * Math.cos(angle + Math.PI / 6), y2 - len * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath(); this.ctx.fillStyle = this.strokeColor; this.ctx.fill();
  }
  drawPolygon(points) {
    if (!this.ctx || !points.length) return;
    this.ctx.beginPath(); this.ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => this.ctx.lineTo(x, y));
    this.ctx.closePath(); this._applyStyle();
  }
  _applyStyle() { if (!this.ctx) return; this.ctx.strokeStyle = this.strokeColor; this.ctx.fillStyle = this.fillColor; this.ctx.lineWidth = this.lineWidth; if (this.fillColor && this.fillColor !== "transparent") this.ctx.fill(); this.ctx.stroke(); }
  clear() { this.shapes = []; }
  getShapes() { return [...this.shapes]; }
}
