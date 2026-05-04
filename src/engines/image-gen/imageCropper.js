/**
 * Wave AI — Image Generation — Smart Image Cropper
 */
export const CROP_PRESETS = {
  square: { ratio: 1, label: "1:1 Square" },
  portrait: { ratio: 3 / 4, label: "3:4 Portrait" },
  landscape: { ratio: 16 / 9, label: "16:9 Landscape" },
  instagram: { ratio: 4 / 5, label: "4:5 Instagram" },
  twitter: { ratio: 2 / 1, label: "2:1 Twitter" },
  thumbnail: { ratio: 16 / 9, label: "16:9 Thumbnail" },
  banner: { ratio: 4 / 1, label: "4:1 Banner" },
};

export class ImageCropper {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async crop(imageSource, x, y, width, height) {
    const img = await this._load(imageSource);
    this.canvas.width = width; this.canvas.height = height;
    this.ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    const blob = await new Promise(r => this.canvas.toBlob(r, "image/png"));
    return { blob, dataURL: this.canvas.toDataURL(), url: URL.createObjectURL(blob), width, height };
  }

  async cropToRatio(imageSource, ratio) {
    const img = await this._load(imageSource);
    const { width: W, height: H } = img;
    let cropW, cropH, x = 0, y = 0;
    if (W / H > ratio) { cropH = H; cropW = Math.round(H * ratio); x = Math.round((W - cropW) / 2); }
    else { cropW = W; cropH = Math.round(W / ratio); y = Math.round((H - cropH) / 2); }
    return this.crop(imageSource, x, y, cropW, cropH);
  }

  async cropToPreset(imageSource, preset) {
    const p = CROP_PRESETS[preset];
    if (!p) throw new Error(`Unknown preset: ${preset}`);
    return this.cropToRatio(imageSource, p.ratio);
  }

  async smartCrop(imageSource, targetW, targetH) {
    const img = await this._load(imageSource);
    const scale = Math.max(targetW / img.width, targetH / img.height);
    const scaledW = Math.round(img.width * scale), scaledH = Math.round(img.height * scale);
    const x = Math.round((scaledW - targetW) / 2), y = Math.round((scaledH - targetH) / 2);
    const temp = document.createElement("canvas");
    temp.width = scaledW; temp.height = scaledH;
    temp.getContext("2d").drawImage(img, 0, 0, scaledW, scaledH);
    return this.crop(temp.toDataURL(), x, y, targetW, targetH);
  }

  _load(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej;
      img.src = src instanceof Blob ? URL.createObjectURL(src) : src;
    });
  }
}
export const imageCropper = new ImageCropper();
