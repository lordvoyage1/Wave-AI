/**
 * Wave AI — Image Modification — Text Overlay Engine
 */
export class TextOverlayEngine {
  constructor() { this.overlays = []; this.canvas = null; this.ctx = null; }
  init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); }
  addText(text, options = {}) {
    const { x = this.canvas?.width / 2 || 400, y = this.canvas?.height / 2 || 300, fontSize = 32, fontFamily = "Arial", color = "#ffffff", bg = null, bold = false, italic = false, shadow = true, align = "center", rotation = 0 } = options;
    const id = `text_${Date.now()}`;
    this.overlays.push({ id, text, x, y, fontSize, fontFamily, color, bg, bold, italic, shadow, align, rotation });
    this._render(); return id;
  }
  updateText(id, updates) { const o = this.overlays.find(o => o.id === id); if (o) { Object.assign(o, updates); this._render(); } }
  removeText(id) { this.overlays = this.overlays.filter(o => o.id !== id); this._render(); }
  _render() {
    if (!this.ctx) return;
    for (const o of this.overlays) {
      this.ctx.save();
      this.ctx.translate(o.x, o.y);
      if (o.rotation) this.ctx.rotate((o.rotation * Math.PI) / 180);
      this.ctx.font = `${o.italic ? "italic " : ""}${o.bold ? "bold " : ""}${o.fontSize}px ${o.fontFamily}`;
      this.ctx.textAlign = o.align; this.ctx.textBaseline = "middle";
      if (o.shadow) { this.ctx.shadowColor = "rgba(0,0,0,0.8)"; this.ctx.shadowBlur = 8; }
      if (o.bg) {
        const m = this.ctx.measureText(o.text);
        this.ctx.fillStyle = o.bg;
        this.ctx.fillRect(-m.width / 2 - 8, -o.fontSize / 2 - 4, m.width + 16, o.fontSize + 8);
      }
      this.ctx.fillStyle = o.color; this.ctx.fillText(o.text, 0, 0);
      this.ctx.restore();
    }
  }
  getOverlays() { return [...this.overlays]; }
  clearAll() { this.overlays = []; }
  getTextAtPoint(x, y) {
    return this.overlays.find(o => { const dist = Math.sqrt((x - o.x) ** 2 + (y - o.y) ** 2); return dist < o.fontSize * 2; });
  }
}
export const textOverlayEngine = new TextOverlayEngine();
