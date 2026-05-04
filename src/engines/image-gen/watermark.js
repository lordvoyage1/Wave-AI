/**
 * Wave AI — Image Generation — Watermark Engine
 */
export class WatermarkEngine {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async addWatermark(imageUrl, text = "Wave AI", options = {}) {
    const img = await this._loadImage(imageUrl);
    this.canvas.width = img.width; this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    const { position = "bottom-right", opacity = 0.6, fontSize = 18, color = "white", padding = 16 } = options;
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.globalAlpha = opacity;
    const metrics = this.ctx.measureText(text);
    const textW = metrics.width + padding * 2, textH = fontSize + padding;
    const positions = {
      "bottom-right": { x: img.width - textW - padding, y: img.height - textH - padding },
      "bottom-left": { x: padding, y: img.height - textH - padding },
      "top-right": { x: img.width - textW - padding, y: padding },
      "top-left": { x: padding, y: padding },
      center: { x: (img.width - textW) / 2, y: (img.height - textH) / 2 },
    };
    const pos = positions[position] || positions["bottom-right"];
    this.ctx.fillStyle = "rgba(0,0,0,0.4)";
    this.ctx.beginPath();
    this.ctx.roundRect(pos.x, pos.y, textW, textH, 6);
    this.ctx.fill();
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, pos.x + padding, pos.y + fontSize);
    this.ctx.globalAlpha = 1;
    return this.canvas.toDataURL("image/png");
  }

  async addLogoWatermark(imageUrl, logoUrl, position = "bottom-right", size = 60, opacity = 0.7) {
    const [img, logo] = await Promise.all([this._loadImage(imageUrl), this._loadImage(logoUrl)]);
    this.canvas.width = img.width; this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    const margin = 16;
    const positions = {
      "bottom-right": { x: img.width - size - margin, y: img.height - size - margin },
      "bottom-left": { x: margin, y: img.height - size - margin },
      "top-right": { x: img.width - size - margin, y: margin },
      "top-left": { x: margin, y: margin },
    };
    const pos = positions[position] || positions["bottom-right"];
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(logo, pos.x, pos.y, size, size);
    this.ctx.globalAlpha = 1;
    return this.canvas.toDataURL("image/png");
  }

  _loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
  }
}
export const watermarkEngine = new WatermarkEngine();
