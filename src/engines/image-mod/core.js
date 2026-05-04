/**
 * Wave AI — Image Modification Engine Core
 * Canvas-based image editing: crop, resize, rotate, flip,
 * color adjustments, filters, and AI-powered enhancements.
 */

export class ImageModificationCore {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 20;
    this.originalImage = null;
    this.currentImage = null;
  }

  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        this.originalImage = img;
        this.currentImage = img;
        this._saveHistory("Original");
        resolve({ width: img.width, height: img.height, img });
      };
      img.onerror = reject;
      if (source instanceof File || source instanceof Blob) {
        img.src = URL.createObjectURL(source);
      } else {
        img.src = source;
      }
    });
  }

  _saveHistory(operation) {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push({ imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height), operation, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    const { imageData } = this.history[this.historyIndex];
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
    return true;
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    const { imageData } = this.history[this.historyIndex];
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
    return true;
  }

  reset() {
    if (this.originalImage) {
      this.canvas.width = this.originalImage.width;
      this.canvas.height = this.originalImage.height;
      this.ctx.drawImage(this.originalImage, 0, 0);
      this.historyIndex = 0;
    }
  }

  resize(width, height, maintainAspect = true) {
    const origW = this.canvas.width;
    const origH = this.canvas.height;
    let newW = width, newH = height;
    if (maintainAspect) {
      const ratio = Math.min(width / origW, height / origH);
      newW = Math.round(origW * ratio);
      newH = Math.round(origH * ratio);
    }
    const imgData = this.ctx.getImageData(0, 0, origW, origH);
    const temp = document.createElement("canvas");
    temp.width = origW; temp.height = origH;
    temp.getContext("2d").putImageData(imgData, 0, 0);
    this.canvas.width = newW; this.canvas.height = newH;
    this.ctx.drawImage(temp, 0, 0, newW, newH);
    this._saveHistory(`Resize to ${newW}×${newH}`);
    return { width: newW, height: newH };
  }

  crop(x, y, width, height) {
    const imageData = this.ctx.getImageData(x, y, width, height);
    this.canvas.width = width; this.canvas.height = height;
    this.ctx.putImageData(imageData, 0, 0);
    this._saveHistory(`Crop ${width}×${height}`);
  }

  rotate(degrees) {
    const { width, height } = this.canvas;
    const rad = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const newW = Math.round(height * sin + width * cos);
    const newH = Math.round(height * cos + width * sin);
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const temp = document.createElement("canvas");
    temp.width = width; temp.height = height;
    temp.getContext("2d").putImageData(imgData, 0, 0);
    this.canvas.width = newW; this.canvas.height = newH;
    this.ctx.translate(newW / 2, newH / 2);
    this.ctx.rotate(rad);
    this.ctx.drawImage(temp, -width / 2, -height / 2);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._saveHistory(`Rotate ${degrees}°`);
  }

  flipHorizontal() {
    const { width, height } = this.canvas;
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const temp = document.createElement("canvas");
    temp.width = width; temp.height = height;
    temp.getContext("2d").putImageData(imgData, 0, 0);
    this.ctx.save();
    this.ctx.translate(width, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(temp, 0, 0);
    this.ctx.restore();
    this._saveHistory("Flip Horizontal");
  }

  flipVertical() {
    const { width, height } = this.canvas;
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const temp = document.createElement("canvas");
    temp.width = width; temp.height = height;
    temp.getContext("2d").putImageData(imgData, 0, 0);
    this.ctx.save();
    this.ctx.translate(0, height);
    this.ctx.scale(1, -1);
    this.ctx.drawImage(temp, 0, 0);
    this.ctx.restore();
    this._saveHistory("Flip Vertical");
  }

  adjustBrightness(amount) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + amount));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
    }
    this.ctx.putImageData(imageData, 0, 0);
    this._saveHistory(`Brightness ${amount > 0 ? "+" : ""}${amount}`);
  }

  adjustContrast(amount) {
    const factor = (259 * (amount + 255)) / (255 * (259 - amount));
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    this.ctx.putImageData(imageData, 0, 0);
    this._saveHistory(`Contrast ${amount}`);
  }

  toDataURL(format = "image/png", quality = 0.92) { return this.canvas.toDataURL(format, quality); }
  toBlob(format = "image/png", quality = 0.92) { return new Promise(r => this.canvas.toBlob(r, format, quality)); }
  getDimensions() { return { width: this.canvas.width, height: this.canvas.height }; }
  getHistoryList() { return this.history.map((h, i) => ({ index: i, operation: h.operation, isCurrent: i === this.historyIndex })); }
}

export const imageModCore = new ImageModificationCore();
