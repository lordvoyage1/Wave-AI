/**
 * Wave AI — Image Modification — Sticker Engine
 */
export const EMOJI_STICKERS = ["😀","🎉","🌟","❤️","🔥","✨","👍","🎨","📸","🌈","🦁","🌺","🎵","🏆","🌍","⚡","💫","🎯","🦋","🌙","☀️","🌊","🏔️","🦅","💎","🎭","🚀","🌸","🍀","⭐"];
export const TEXT_STICKERS = ["Wave AI", "Powered by AI", "Made in Africa", "#WaveAI", "✓ Verified", "New!", "Hot 🔥", "Trending", "Exclusive"];

export class StickerEngine {
  constructor() { this.stickers = []; this.canvas = null; this.ctx = null; }
  init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); }
  addEmoji(emoji, x, y, size = 48) {
    const id = `stk_${Date.now()}`; this.stickers.push({ id, type: "emoji", emoji, x, y, size, rotation: 0 });
    this._renderAll(); return id;
  }
  addText(text, x, y, options = {}) {
    const { fontSize = 28, color = "#ffffff", bg = "rgba(0,0,0,0.7)", fontFamily = "Arial", padding = 8, borderRadius = 8 } = options;
    const id = `stk_${Date.now()}`; this.stickers.push({ id, type: "text", text, x, y, fontSize, color, bg, fontFamily, padding, borderRadius, rotation: 0 });
    this._renderAll(); return id;
  }
  _renderAll() {
    if (!this.ctx) return;
    for (const s of this.stickers) {
      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      if (s.rotation) this.ctx.rotate((s.rotation * Math.PI) / 180);
      if (s.type === "emoji") { this.ctx.font = `${s.size}px serif`; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText(s.emoji, 0, 0); }
      else if (s.type === "text") {
        this.ctx.font = `bold ${s.fontSize}px ${s.fontFamily}`;
        const m = this.ctx.measureText(s.text); const tw = m.width + s.padding * 2, th = s.fontSize + s.padding * 2;
        if (s.bg) { this.ctx.fillStyle = s.bg; this.ctx.beginPath(); if (this.ctx.roundRect) this.ctx.roundRect(-tw / 2, -th / 2, tw, th, s.borderRadius); else this.ctx.rect(-tw / 2, -th / 2, tw, th); this.ctx.fill(); }
        this.ctx.fillStyle = s.color; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText(s.text, 0, 0);
      }
      this.ctx.restore();
    }
  }
  moveSticker(id, x, y) { const s = this.stickers.find(s => s.id === id); if (s) { s.x = x; s.y = y; this._renderAll(); } }
  rotateSticker(id, deg) { const s = this.stickers.find(s => s.id === id); if (s) { s.rotation = deg; this._renderAll(); } }
  removeSticker(id) { this.stickers = this.stickers.filter(s => s.id !== id); }
  clearAll() { this.stickers = []; }
  getStickers() { return [...this.stickers]; }
}
export const stickerEngine = new StickerEngine();
