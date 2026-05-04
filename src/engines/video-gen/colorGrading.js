/**
 * Wave AI — Video Generation — Color Grading Engine
 */
export const LUT_PRESETS = {
  cinematic: { contrast: 1.15, saturation: 0.85, lift: [5, 0, -5], gain: [1, 1, 0.95], gamma: [1, 1, 0.98] },
  warm: { contrast: 1.05, saturation: 1.1, lift: [8, 2, -10], gain: [1.05, 1, 0.9], gamma: [1, 1, 1] },
  cool: { contrast: 1.08, saturation: 0.95, lift: [-5, 0, 8], gain: [0.95, 1, 1.1], gamma: [1, 1, 1.05] },
  vibrant: { contrast: 1.2, saturation: 1.4, lift: [0, 0, 0], gain: [1, 1, 1], gamma: [1, 1, 1] },
  noir: { contrast: 1.5, saturation: 0, lift: [0, 0, 0], gain: [1, 1, 1], gamma: [1, 1, 1] },
  golden: { contrast: 1.1, saturation: 1.2, lift: [10, 5, -15], gain: [1.1, 1, 0.8], gamma: [1, 1, 1] },
  teal_orange: { contrast: 1.1, saturation: 1.15, lift: [-5, 5, 10], gain: [1.1, 1, 0.8], gamma: [1, 1, 1] },
};

export class ColorGradingEngine {
  constructor() { this.currentLUT = "cinematic"; this.enabled = true; }

  applyLUT(ctx, W, H, lutName) {
    if (!this.enabled) return;
    const lut = LUT_PRESETS[lutName || this.currentLUT];
    if (!lut) return;
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      r = Math.max(0, Math.min(255, (r + lut.lift[0]) * lut.gain[0] * lut.gamma[0]));
      g = Math.max(0, Math.min(255, (g + lut.lift[1]) * lut.gain[1] * lut.gamma[1]));
      b = Math.max(0, Math.min(255, (b + lut.lift[2]) * lut.gain[2] * lut.gamma[2]));
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.round(gray + (r - gray) * lut.saturation);
      g = Math.round(gray + (g - gray) * lut.saturation);
      b = Math.round(gray + (b - gray) * lut.saturation);
      const mid = 128;
      r = Math.max(0, Math.min(255, Math.round(mid + (r - mid) * lut.contrast)));
      g = Math.max(0, Math.min(255, Math.round(mid + (g - mid) * lut.contrast)));
      b = Math.max(0, Math.min(255, Math.round(mid + (b - mid) * lut.contrast)));
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  setLUT(name) { if (LUT_PRESETS[name]) this.currentLUT = name; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  toggle() { this.enabled = !this.enabled; }
  getPresets() { return Object.keys(LUT_PRESETS); }
}
export const colorGradingEngine = new ColorGradingEngine();
