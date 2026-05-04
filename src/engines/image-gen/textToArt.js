/**
 * Wave AI — Image Generation — Text to Art Generator
 * Create artistic text renders using canvas: gradient text,
 * 3D text, neon glow, shadow, and outline effects.
 */
export class TextToArt {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async create(text, style = "gradient", options = {}) {
    const { width = 800, height = 400, fontSize = 72, fontFamily = "Arial" } = options;
    this.canvas.width = width; this.canvas.height = height;
    switch (style) {
      case "gradient": return this._gradient(text, { width, height, fontSize, fontFamily, ...options });
      case "neon": return this._neon(text, { width, height, fontSize, fontFamily, ...options });
      case "shadow3d": return this._shadow3d(text, { width, height, fontSize, fontFamily, ...options });
      case "outline": return this._outline(text, { width, height, fontSize, fontFamily, ...options });
      case "retro": return this._retro(text, { width, height, fontSize, fontFamily, ...options });
      default: return this._gradient(text, { width, height, fontSize, fontFamily, ...options });
    }
  }

  _gradient(text, opts) {
    const { width: W, height: H, fontSize, fontFamily } = opts;
    const bg = this.ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, opts.bgFrom || "#0d1117"); bg.addColorStop(1, opts.bgTo || "#1a1a2e");
    this.ctx.fillStyle = bg; this.ctx.fillRect(0, 0, W, H);
    const grad = this.ctx.createLinearGradient(0, H * 0.2, W, H * 0.8);
    (opts.colors || ["#4f7fff", "#9b5cff", "#f472b6"]).forEach((c, i, a) => grad.addColorStop(i / (a.length - 1), c));
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = grad;
    this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, W / 2, H / 2);
    return { dataURL: this.canvas.toDataURL(), text, style: "gradient" };
  }

  _neon(text, opts) {
    const { width: W, height: H, fontSize, fontFamily } = opts;
    this.ctx.fillStyle = "#000"; this.ctx.fillRect(0, 0, W, H);
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    const color = opts.color || "#4f7fff";
    [20, 15, 10, 5].forEach(blur => {
      this.ctx.shadowColor = color; this.ctx.shadowBlur = blur;
      this.ctx.fillStyle = color; this.ctx.fillText(text, W / 2, H / 2);
    });
    this.ctx.shadowBlur = 0;
    return { dataURL: this.canvas.toDataURL(), text, style: "neon" };
  }

  _shadow3d(text, opts) {
    const { width: W, height: H, fontSize, fontFamily } = opts;
    this.ctx.fillStyle = opts.bg || "#1a1a2e"; this.ctx.fillRect(0, 0, W, H);
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    for (let i = 8; i >= 0; i--) {
      this.ctx.fillStyle = `rgba(0,0,0,${0.1 + i * 0.05})`;
      this.ctx.fillText(text, W / 2 + i, H / 2 + i);
    }
    this.ctx.fillStyle = opts.color || "#ffffff";
    this.ctx.fillText(text, W / 2, H / 2);
    return { dataURL: this.canvas.toDataURL(), text, style: "shadow3d" };
  }

  _outline(text, opts) {
    const { width: W, height: H, fontSize, fontFamily } = opts;
    this.ctx.fillStyle = opts.bg || "#ffffff"; this.ctx.fillRect(0, 0, W, H);
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = opts.color || "#4f7fff";
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(text, W / 2, H / 2);
    this.ctx.fillStyle = opts.fillColor || "transparent";
    this.ctx.fillText(text, W / 2, H / 2);
    return { dataURL: this.canvas.toDataURL(), text, style: "outline" };
  }

  _retro(text, opts) {
    const { width: W, height: H, fontSize, fontFamily } = opts;
    this.ctx.fillStyle = "#1a0a00"; this.ctx.fillRect(0, 0, W, H);
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "#ff6b00";
    for (let i = 4; i >= 0; i--) {
      this.ctx.globalAlpha = 0.3 + i * 0.1;
      this.ctx.fillText(text, W / 2 + i * 2, H / 2 + i);
    }
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = "#ffcc00";
    this.ctx.fillText(text, W / 2, H / 2);
    return { dataURL: this.canvas.toDataURL(), text, style: "retro" };
  }

  downloadAsImage(dataURL, filename = "wave-text-art.png") {
    const a = document.createElement("a"); a.href = dataURL; a.download = filename; a.click();
  }
}
export const textToArt = new TextToArt();
