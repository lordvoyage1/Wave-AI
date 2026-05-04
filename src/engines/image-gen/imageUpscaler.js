/**
 * Wave AI — Image Generation — Image Upscaler
 * Canvas-based bicubic upscaling with sharpening.
 */
export class ImageUpscaler {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async upscale(imageSource, factor = 2) {
    const img = await this._loadImage(imageSource);
    const newW = Math.round(img.width * factor), newH = Math.round(img.height * factor);
    this.canvas.width = newW; this.canvas.height = newH;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(img, 0, 0, newW, newH);
    this._applySharpen();
    return { dataURL: this.canvas.toDataURL("image/png"), width: newW, height: newH };
  }

  _applySharpen() {
    const { width: W, height: H } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, W, H);
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;
    const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let r = 0, g = 0, b = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * W + (x + kx)) * 4;
            const k = kernel[(ky + 1) * 3 + (kx + 1)];
            r += src[idx] * k; g += src[idx + 1] * k; b += src[idx + 2] * k;
          }
        }
        const i = (y * W + x) * 4;
        dst[i] = Math.max(0, Math.min(255, r));
        dst[i + 1] = Math.max(0, Math.min(255, g));
        dst[i + 2] = Math.max(0, Math.min(255, b));
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  _loadImage(source) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej;
      img.src = source instanceof Blob ? URL.createObjectURL(source) : source;
    });
  }

  async upscaleWithHuggingFace(imageBlob, apiKey) {
    if (!apiKey) return { success: false, error: "No API key" };
    try {
      const arrayBuffer = await imageBlob.arrayBuffer();
      const response = await fetch("https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x4-64", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/png" },
        body: arrayBuffer,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return { success: true, blob, url: URL.createObjectURL(blob) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
export const imageUpscaler = new ImageUpscaler();
