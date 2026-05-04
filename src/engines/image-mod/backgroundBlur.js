/**
 * Wave AI — Image Modification — Background Blur (Bokeh Effect)
 */
export class BackgroundBlurEngine {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async applyPortraitBlur(imageUrl, blurRadius = 10, focalCenter = null) {
    const img = await this._load(imageUrl);
    this.canvas.width = img.width; this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    const cx = focalCenter?.x || img.width / 2, cy = focalCenter?.y || img.height * 0.35;
    const focalR = Math.min(img.width, img.height) * 0.3;
    const blurred = await this._blurImage(imageUrl, blurRadius);
    const blurImg = await this._load(blurred);
    const imgData = this.ctx.getImageData(0, 0, img.width, img.height);
    const blurData = (() => { const tc = document.createElement("canvas"); tc.width = img.width; tc.height = img.height; const tc2 = tc.getContext("2d"); tc2.drawImage(blurImg, 0, 0, img.width, img.height); return tc2.getImageData(0, 0, img.width, img.height); })();
    const result = this.ctx.createImageData(img.width, img.height);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const t = Math.max(0, Math.min(1, (dist - focalR) / (focalR * 1.5)));
        const i = (y * img.width + x) * 4;
        for (let c = 0; c < 4; c++) result.data[i + c] = imgData.data[i + c] * (1 - t) + blurData.data[i + c] * t;
      }
    }
    this.ctx.putImageData(result, 0, 0);
    const blob = await new Promise(r => this.canvas.toBlob(r, "image/jpeg", 0.92));
    return { blob, url: URL.createObjectURL(blob), dataURL: this.canvas.toDataURL("image/jpeg", 0.92) };
  }

  async _blurImage(src, radius) {
    const img = await this._load(src);
    const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext("2d"); ctx.filter = `blur(${radius}px)`; ctx.drawImage(img, 0, 0);
    return canvas.toDataURL();
  }

  _load(src) {
    return new Promise((res, rej) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.onerror = rej; img.src = src; });
  }

  async tiltShift(imageUrl, horizontal = true, blurAmount = 15) {
    const img = await this._load(imageUrl); this.canvas.width = img.width; this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    const grad = horizontal ? this.ctx.createLinearGradient(0, 0, 0, img.height) : this.ctx.createLinearGradient(0, 0, img.width, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.8)"); grad.addColorStop(0.3, "rgba(0,0,0,0)"); grad.addColorStop(0.7, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.8)");
    this.ctx.fillStyle = grad; this.ctx.globalCompositeOperation = "destination-out"; this.ctx.fillRect(0, 0, img.width, img.height);
    this.ctx.globalCompositeOperation = "source-over";
    return this.canvas.toDataURL();
  }
}
export const backgroundBlurEngine = new BackgroundBlurEngine();
