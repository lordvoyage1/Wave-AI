/**
 * Wave AI — Image Generation — Image Mixer
 * Blend and mix multiple images with various blend modes.
 */
export const BLEND_MODES = ["source-over", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"];

export class ImageMixer {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async blend(imageA, imageB, mode = "source-over", opacity = 0.5) {
    const [imgA, imgB] = await Promise.all([this._load(imageA), this._load(imageB)]);
    this.canvas.width = imgA.width; this.canvas.height = imgA.height;
    this.ctx.drawImage(imgA, 0, 0);
    this.ctx.globalCompositeOperation = mode;
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(imgB, 0, 0, imgA.width, imgA.height);
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.globalAlpha = 1;
    const blob = await new Promise(r => this.canvas.toBlob(r, "image/png"));
    return { blob, dataURL: this.canvas.toDataURL("image/png"), url: URL.createObjectURL(blob) };
  }

  async collage(images, layout = "grid", options = {}) {
    const loaded = await Promise.all(images.map(src => this._load(src)));
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const cellW = options.cellWidth || 400, cellH = options.cellHeight || 300;
    const gap = options.gap || 4;
    this.canvas.width = cols * cellW + (cols - 1) * gap;
    this.canvas.height = rows * cellH + (rows - 1) * gap;
    this.ctx.fillStyle = options.background || "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    loaded.forEach((img, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = col * (cellW + gap), y = row * (cellH + gap);
      this.ctx.drawImage(img, x, y, cellW, cellH);
    });
    const blob = await new Promise(r => this.canvas.toBlob(r, "image/jpeg", 0.9));
    return { blob, dataURL: this.canvas.toDataURL("image/jpeg", 0.9), url: URL.createObjectURL(blob) };
  }

  _load(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej;
      img.src = src instanceof Blob ? URL.createObjectURL(src) : src;
    });
  }
}
export const imageMixer = new ImageMixer();
