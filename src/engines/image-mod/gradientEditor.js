/**
 * Wave AI — Image Modification — Gradient Editor
 */
export const GRADIENT_PRESETS = {
  "Wave Signature": ["#4f7fff", "#9b5cff", "#f472b6"],
  "African Sunset": ["#ff6b35", "#f7c59f", "#ffd166"],
  "Ocean": ["#0077b6", "#00b4d8", "#90e0ef"],
  "Forest": ["#2d6a4f", "#40916c", "#95d5b2"],
  "Fire": ["#d62828", "#f77f00", "#fcbf49"],
  "Night Sky": ["#03045e", "#0077b6", "#48cae4"],
  "Gold": ["#d4a017", "#f5d030", "#fff4b2"],
  "Monochrome": ["#000000", "#666666", "#ffffff"],
};

export class GradientEditor {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas?.getContext("2d"); }
  applyLinear(colors, angle = 135) {
    if (!this.ctx || !colors.length) return;
    const rad = (angle * Math.PI) / 180;
    const x1 = this.canvas.width / 2 - Math.cos(rad) * this.canvas.width / 2;
    const y1 = this.canvas.height / 2 - Math.sin(rad) * this.canvas.height / 2;
    const x2 = this.canvas.width / 2 + Math.cos(rad) * this.canvas.width / 2;
    const y2 = this.canvas.height / 2 + Math.sin(rad) * this.canvas.height / 2;
    const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((c, i) => grad.addColorStop(i / Math.max(1, colors.length - 1), c));
    this.ctx.fillStyle = grad; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  applyRadial(colors) {
    if (!this.ctx || !colors.length) return;
    const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
    const r = Math.min(cx, cy);
    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    colors.forEach((c, i) => grad.addColorStop(i / Math.max(1, colors.length - 1), c));
    this.ctx.fillStyle = grad; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  applyPreset(presetName, type = "linear", angle = 135) {
    const colors = GRADIENT_PRESETS[presetName];
    if (!colors) return false;
    if (type === "radial") this.applyRadial(colors);
    else this.applyLinear(colors, angle);
    return true;
  }
  overlayGradient(colors, angle = 135, opacity = 0.5) {
    if (!this.ctx) return;
    const prev = this.ctx.globalAlpha; this.ctx.globalAlpha = opacity;
    this.applyLinear(colors, angle); this.ctx.globalAlpha = prev;
  }
  getPresets() { return Object.keys(GRADIENT_PRESETS); }
}
