/**
 * Wave AI — Image Generation — Image Compressor
 */
export class ImageCompressor {
  async compress(imageSource, options = {}) {
    const { quality = 0.85, maxWidth = 1920, maxHeight = 1080, format = "image/jpeg" } = options;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = await this._loadImage(imageSource);
    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio); height = Math.round(height * ratio);
    }
    canvas.width = width; canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise(r => canvas.toBlob(r, format, quality));
    return { blob, dataURL: canvas.toDataURL(format, quality), width, height, size: blob.size, compressionRatio: img.src.length ? blob.size / img.src.length : 1 };
  }

  async compressToSizeKB(imageSource, targetKB = 100) {
    let quality = 0.9;
    while (quality > 0.1) {
      const result = await this.compress(imageSource, { quality });
      if (result.size <= targetKB * 1024) return result;
      quality -= 0.1;
    }
    return this.compress(imageSource, { quality: 0.1 });
  }

  _loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej;
      img.src = src instanceof Blob ? URL.createObjectURL(src) : src;
    });
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
export const imageCompressor = new ImageCompressor();
