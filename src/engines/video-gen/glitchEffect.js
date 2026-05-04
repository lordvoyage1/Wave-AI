/**
 * Wave AI — Video Generation — Glitch Effect Engine
 */
export class GlitchEffect {
  constructor() { this.intensity = 0.5; this.enabled = false; this.seed = 0; }

  apply(ctx, W, H) {
    if (!this.enabled) return;
    this.seed += 0.1;
    const n = 3 + Math.floor(this.intensity * 7);
    for (let i = 0; i < n; i++) {
      if (Math.random() > this.intensity) continue;
      const y = Math.floor(Math.random() * H);
      const h = Math.floor(Math.random() * 20 + 5);
      const shift = (Math.random() - 0.5) * 40 * this.intensity;
      const slice = ctx.getImageData(0, y, W, Math.min(h, H - y));
      ctx.putImageData(slice, shift, y);
    }
    if (Math.random() < this.intensity * 0.3) {
      const hue = Math.floor(Math.random() * 360);
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  trigger(intensityOverride) {
    const prev = this.intensity;
    this.intensity = intensityOverride || 1;
    this.enabled = true;
    setTimeout(() => { this.intensity = prev; this.enabled = false; }, 200 + Math.random() * 300);
  }

  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
}

export class PixelSortEffect {
  apply(ctx, W, H) {
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    const threshold = 180;
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        row.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3], brightness });
      }
      const sortStart = row.findIndex(p => p.brightness > threshold);
      const sortEnd = row.length - row.slice().reverse().findIndex(p => p.brightness > threshold);
      if (sortStart !== -1 && sortEnd > sortStart) {
        const segment = row.slice(sortStart, sortEnd).sort((a, b) => a.brightness - b.brightness);
        for (let x = sortStart; x < sortEnd; x++) {
          const i = (y * W + x) * 4;
          const p = segment[x - sortStart];
          data[i] = p.r; data[i + 1] = p.g; data[i + 2] = p.b; data[i + 3] = p.a;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

export const glitchEffect = new GlitchEffect();
export const pixelSortEffect = new PixelSortEffect();
