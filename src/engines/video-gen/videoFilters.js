/**
 * Wave AI — Video Generation — Video Filters
 * Real-time canvas video filter pipeline.
 */
export const VIDEO_FILTERS = {
  none: null,
  grayscale: (ctx, W, H) => {
    const d = ctx.getImageData(0, 0, W, H); const data = d.data;
    for (let i = 0; i < data.length; i += 4) { const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; data[i] = data[i + 1] = data[i + 2] = g; }
    ctx.putImageData(d, 0, 0);
  },
  sepia: (ctx, W, H) => {
    const d = ctx.getImageData(0, 0, W, H); const data = d.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    ctx.putImageData(d, 0, 0);
  },
  invert: (ctx, W, H) => {
    const d = ctx.getImageData(0, 0, W, H); const data = d.data;
    for (let i = 0; i < data.length; i += 4) { data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2]; }
    ctx.putImageData(d, 0, 0);
  },
  vignette: (ctx, W, H) => {
    const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  },
  cinematic: (ctx, W, H) => {
    const barH = Math.round(H * 0.1);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, barH); ctx.fillRect(0, H - barH, W, barH);
  },
  glitch: (ctx, W, H) => {
    const offset = Math.random() * 20 - 10;
    const slice = ctx.getImageData(0, Math.floor(Math.random() * H), W, Math.floor(Math.random() * 20));
    ctx.putImageData(slice, offset, Math.floor(Math.random() * H));
  },
};

export class VideoFilterPipeline {
  constructor() { this.activeFilters = new Set(); this.intensity = 1; }

  addFilter(name) { this.activeFilters.add(name); }
  removeFilter(name) { this.activeFilters.delete(name); }
  toggleFilter(name) { if (this.activeFilters.has(name)) this.removeFilter(name); else this.addFilter(name); }
  clearFilters() { this.activeFilters.clear(); }

  apply(ctx, width, height) {
    for (const filterName of this.activeFilters) {
      const fn = VIDEO_FILTERS[filterName];
      if (fn) fn(ctx, width, height);
    }
  }

  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); }
  getActive() { return [...this.activeFilters]; }
}
export const videoFilterPipeline = new VideoFilterPipeline();
