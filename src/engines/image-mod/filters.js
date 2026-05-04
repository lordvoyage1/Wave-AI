/**
 * Wave AI — Image Modification — Filters & Effects
 * Advanced canvas-based filters: sharpen, blur, emboss,
 * edge detection, color matrices, and artistic effects.
 */

export class ImageFilters {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  _getImageData() { return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); }
  _putImageData(data) { this.ctx.putImageData(data, 0, 0); }

  _applyConvolution(kernel, divisor = 1) {
    const imageData = this._getImageData();
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;
    const kSize = Math.sqrt(kernel.length);
    const half = Math.floor(kSize / 2);
    const { width, height } = this.canvas;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
        for (let ky = 0; ky < kSize; ky++) {
          for (let kx = 0; kx < kSize; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx - half));
            const py = Math.min(height - 1, Math.max(0, y + ky - half));
            const idx = (py * width + px) * 4;
            const k = kernel[ky * kSize + kx];
            r += src[idx] * k;
            g += src[idx + 1] * k;
            b += src[idx + 2] * k;
          }
        }
        const idx = (y * width + x) * 4;
        dst[idx] = Math.max(0, Math.min(255, r / divisor));
        dst[idx + 1] = Math.max(0, Math.min(255, g / divisor));
        dst[idx + 2] = Math.max(0, Math.min(255, b / divisor));
      }
    }
    this._putImageData(imageData);
  }

  sharpen() {
    this._applyConvolution([0, -1, 0, -1, 5, -1, 0, -1, 0]);
  }

  blur(radius = 1) {
    const size = radius * 2 + 1;
    const kernel = new Array(size * size).fill(1);
    this._applyConvolution(kernel, size * size);
  }

  emboss() {
    this._applyConvolution([-2, -1, 0, -1, 1, 1, 0, 1, 2]);
  }

  edgeDetect() {
    this._applyConvolution([-1, -1, -1, -1, 8, -1, -1, -1, -1]);
  }

  grayscale() {
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    this._putImageData(imageData);
  }

  sepia() {
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    this._putImageData(imageData);
  }

  invert() {
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    this._putImageData(imageData);
  }

  posterize(levels = 4) {
    const step = 255 / levels;
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
    this._putImageData(imageData);
  }

  threshold(level = 128) {
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const val = avg >= level ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
    this._putImageData(imageData);
  }

  hueRotate(degrees) {
    const imageData = this._getImageData();
    const data = imageData.data;
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.max(0, Math.min(255, r * (cos + (1 - cos) / 3) + g * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin) + b * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin)));
      data[i + 1] = Math.max(0, Math.min(255, r * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin) + g * (cos + (1 - cos) / 3) + b * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin)));
      data[i + 2] = Math.max(0, Math.min(255, r * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin) + g * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin) + b * (cos + (1 - cos) / 3)));
    }
    this._putImageData(imageData);
  }

  saturate(amount) {
    const imageData = this._getImageData();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = Math.max(0, Math.min(255, gray + (data[i] - gray) * amount));
      data[i + 1] = Math.max(0, Math.min(255, gray + (data[i + 1] - gray) * amount));
      data[i + 2] = Math.max(0, Math.min(255, gray + (data[i + 2] - gray) * amount));
    }
    this._putImageData(imageData);
  }

  applyFilter(filterName, value = null) {
    const map = {
      sharpen: () => this.sharpen(),
      blur: () => this.blur(value || 1),
      emboss: () => this.emboss(),
      edge: () => this.edgeDetect(),
      grayscale: () => this.grayscale(),
      sepia: () => this.sepia(),
      invert: () => this.invert(),
      posterize: () => this.posterize(value || 4),
      threshold: () => this.threshold(value || 128),
      saturate: () => this.saturate(value || 1.5),
      hueRotate: () => this.hueRotate(value || 90),
    };
    const fn = map[filterName];
    if (fn) fn();
  }
}
