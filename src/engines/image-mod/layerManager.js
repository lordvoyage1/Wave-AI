/**
 * Wave AI — Image Modification — Layer Manager
 */
export class LayerManager {
  constructor() { this.layers = []; this.activeLayer = null; this.canvas = null; this.ctx = null; }
  init(width, height) { this.canvas = document.createElement("canvas"); this.canvas.width = width; this.canvas.height = height; this.ctx = this.canvas.getContext("2d"); return this.canvas; }
  addLayer(name, options = {}) {
    const id = `layer_${Date.now()}`; const canvas = document.createElement("canvas");
    canvas.width = this.canvas?.width || 800; canvas.height = this.canvas?.height || 600;
    const layer = { id, name, canvas, ctx: canvas.getContext("2d"), visible: true, opacity: 1, blendMode: "source-over", locked: false, ...options };
    this.layers.push(layer); this.activeLayer = id; return layer;
  }
  getLayer(id) { return this.layers.find(l => l.id === id); }
  removeLayer(id) { this.layers = this.layers.filter(l => l.id !== id); if (this.activeLayer === id) this.activeLayer = this.layers[this.layers.length - 1]?.id || null; }
  setActive(id) { if (this.layers.find(l => l.id === id)) this.activeLayer = id; }
  setOpacity(id, opacity) { const l = this.getLayer(id); if (l) l.opacity = Math.max(0, Math.min(1, opacity)); }
  setVisible(id, visible) { const l = this.getLayer(id); if (l) l.visible = visible; }
  setBlendMode(id, mode) { const l = this.getLayer(id); if (l) l.blendMode = mode; }
  moveLayer(id, direction) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? Math.max(0, idx - 1) : Math.min(this.layers.length - 1, idx + 1);
    [this.layers[idx], this.layers[newIdx]] = [this.layers[newIdx], this.layers[idx]];
  }
  flatten() {
    if (!this.ctx) return null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      this.ctx.save(); this.ctx.globalAlpha = layer.opacity; this.ctx.globalCompositeOperation = layer.blendMode;
      this.ctx.drawImage(layer.canvas, 0, 0); this.ctx.restore();
    }
    return this.canvas.toDataURL("image/png");
  }
  getLayers() { return this.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, blendMode: l.blendMode, locked: l.locked, isActive: l.id === this.activeLayer })); }
  getActiveLayerCtx() { const l = this.getLayer(this.activeLayer); return l?.ctx || null; }
  duplicateLayer(id) {
    const src = this.getLayer(id); if (!src) return null;
    const dup = this.addLayer(`${src.name} (copy)`);
    dup.ctx.drawImage(src.canvas, 0, 0); return dup;
  }
  merge(id1, id2) {
    const l1 = this.getLayer(id1), l2 = this.getLayer(id2); if (!l1 || !l2) return null;
    const merged = this.addLayer(`${l1.name} + ${l2.name}`);
    merged.ctx.drawImage(l1.canvas, 0, 0); merged.ctx.drawImage(l2.canvas, 0, 0);
    this.removeLayer(id1); this.removeLayer(id2); return merged;
  }
}
export const layerManager = new LayerManager();
