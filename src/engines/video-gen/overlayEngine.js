/**
 * Wave AI — Video Generation — Overlay Engine
 * Add logos, watermarks, progress bars, clocks and other overlays.
 */
export class OverlayEngine {
  constructor() { this.overlays = []; }

  addText(text, options = {}) {
    const id = `overlay_${Date.now()}`;
    this.overlays.push({ id, type: "text", text, x: options.x || 20, y: options.y || 40, fontSize: options.fontSize || 20, color: options.color || "#ffffff", bg: options.bg || null, fadeIn: options.fadeIn || 0, fadeOut: options.fadeOut || Infinity, font: options.font || "Arial", shadow: options.shadow !== false });
    return id;
  }

  addProgressBar(options = {}) {
    const id = `overlay_${Date.now()}`;
    this.overlays.push({ id, type: "progressBar", x: options.x || 0, y: options.y || -8, width: options.width || 1, height: options.height || 4, color: options.color || "#4f7fff", bg: options.bg || "rgba(255,255,255,0.2)" });
    return id;
  }

  addWatermark(text, position = "bottom-right") {
    return this.addText(`⚡ ${text}`, { color: "rgba(255,255,255,0.7)", fontSize: 14, position });
  }

  addClock(options = {}) {
    const id = `overlay_${Date.now()}`;
    this.overlays.push({ id, type: "clock", x: options.x || 20, y: options.y || 30, color: options.color || "#ffffff", fontSize: options.fontSize || 16 });
    return id;
  }

  removeOverlay(id) { this.overlays = this.overlays.filter(o => o.id !== id); }

  renderAll(ctx, W, H, currentTimeMs = 0, totalTimeMs = 1) {
    for (const overlay of this.overlays) {
      if (overlay.type === "text") this._renderText(ctx, overlay, W, H, currentTimeMs);
      else if (overlay.type === "progressBar") this._renderProgressBar(ctx, overlay, W, H, currentTimeMs, totalTimeMs);
      else if (overlay.type === "clock") this._renderClock(ctx, overlay, W, H);
    }
  }

  _renderText(ctx, o, W, H, timeMs) {
    if (timeMs < (o.fadeIn || 0) * 1000 || timeMs > (o.fadeOut || Infinity) * 1000) return;
    ctx.save();
    ctx.font = `bold ${o.fontSize}px ${o.font || "Arial"}`;
    if (o.shadow) { ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 6; }
    if (o.bg) {
      const m = ctx.measureText(o.text);
      ctx.fillStyle = o.bg;
      ctx.fillRect(o.x - 6, o.y - o.fontSize, m.width + 12, o.fontSize + 8);
    }
    ctx.fillStyle = o.color; ctx.fillText(o.text, o.x, o.y);
    ctx.restore();
  }

  _renderProgressBar(ctx, o, W, H, currentMs, totalMs) {
    const progress = Math.min(1, currentMs / totalMs);
    const y = o.y < 0 ? H + o.y : o.y;
    const barW = o.width <= 1 ? W * o.width : o.width;
    ctx.fillStyle = o.bg || "rgba(255,255,255,0.2)";
    ctx.fillRect(o.x || 0, y, barW, o.height);
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x || 0, y, barW * progress, o.height);
  }

  _renderClock(ctx, o, W, H) {
    const now = new Date().toLocaleTimeString();
    ctx.font = `bold ${o.fontSize}px Arial`;
    ctx.fillStyle = o.color; ctx.fillText(now, o.x, o.y);
  }

  clearAll() { this.overlays = []; }
  getAll() { return [...this.overlays]; }
}
export const overlayEngine = new OverlayEngine();
