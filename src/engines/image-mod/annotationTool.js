/**
 * Wave AI — Image Modification — Annotation Tool
 */
export class AnnotationTool {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas?.getContext("2d"); this.annotations = []; this.color = "#ef4444"; this.size = 3; this.mode = "arrow"; }
  setMode(mode) { this.mode = mode; }
  setColor(color) { this.color = color; }
  setSize(size) { this.size = size; }
  addAnnotation(annotation) { const id = `ann_${Date.now()}`; this.annotations.push({ id, ...annotation }); this._renderAll(); return id; }
  addArrow(x1, y1, x2, y2, label = "") { return this.addAnnotation({ type: "arrow", x1, y1, x2, y2, label, color: this.color, size: this.size }); }
  addCircle(cx, cy, r, label = "") { return this.addAnnotation({ type: "circle", cx, cy, r, label, color: this.color, size: this.size }); }
  addRect(x, y, w, h, label = "") { return this.addAnnotation({ type: "rect", x, y, w, h, label, color: this.color, size: this.size }); }
  addText(x, y, text) { return this.addAnnotation({ type: "text", x, y, text, color: this.color, fontSize: this.size * 6 }); }
  _renderAll() {
    if (!this.ctx) return;
    this.annotations.forEach(ann => {
      this.ctx.strokeStyle = ann.color; this.ctx.fillStyle = ann.color; this.ctx.lineWidth = ann.size || 2;
      if (ann.type === "arrow") {
        const angle = Math.atan2(ann.y2 - ann.y1, ann.x2 - ann.x1);
        this.ctx.beginPath(); this.ctx.moveTo(ann.x1, ann.y1); this.ctx.lineTo(ann.x2, ann.y2); this.ctx.stroke();
        const hw = 12;
        this.ctx.beginPath(); this.ctx.moveTo(ann.x2, ann.y2); this.ctx.lineTo(ann.x2 - hw * Math.cos(angle - Math.PI / 6), ann.y2 - hw * Math.sin(angle - Math.PI / 6)); this.ctx.lineTo(ann.x2 - hw * Math.cos(angle + Math.PI / 6), ann.y2 - hw * Math.sin(angle + Math.PI / 6)); this.ctx.closePath(); this.ctx.fill();
        if (ann.label) { this.ctx.font = "14px Arial"; this.ctx.fillText(ann.label, (ann.x1 + ann.x2) / 2, (ann.y1 + ann.y2) / 2 - 8); }
      } else if (ann.type === "circle") {
        this.ctx.beginPath(); this.ctx.arc(ann.cx, ann.cy, ann.r, 0, Math.PI * 2); this.ctx.stroke();
        if (ann.label) { this.ctx.font = "14px Arial"; this.ctx.fillText(ann.label, ann.cx - ann.r, ann.cy - ann.r - 5); }
      } else if (ann.type === "rect") {
        this.ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
        if (ann.label) { this.ctx.font = "14px Arial"; this.ctx.fillText(ann.label, ann.x, ann.y - 5); }
      } else if (ann.type === "text") {
        this.ctx.font = `bold ${ann.fontSize || 18}px Arial`; this.ctx.fillText(ann.text, ann.x, ann.y);
      }
    });
  }
  removeAnnotation(id) { this.annotations = this.annotations.filter(a => a.id !== id); }
  clearAll() { this.annotations = []; }
  getAnnotations() { return [...this.annotations]; }
  exportJSON() { return JSON.stringify(this.annotations, null, 2); }
}
