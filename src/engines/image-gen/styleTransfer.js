/**
 * Wave AI — Image Generation — Style Transfer
 * Apply artistic styles to images using canvas filters,
 * CSS filters, and HuggingFace style transfer models.
 */

export const CANVAS_FILTERS = {
  none: { filter: "none", label: "Original" },
  grayscale: { filter: "grayscale(100%)", label: "Grayscale" },
  sepia: { filter: "sepia(100%)", label: "Vintage Sepia" },
  vivid: { filter: "saturate(200%) contrast(110%)", label: "Vivid" },
  dramatic: { filter: "contrast(150%) brightness(90%)", label: "Dramatic" },
  soft: { filter: "blur(0.5px) brightness(110%) saturate(80%)", label: "Soft" },
  neon: { filter: "saturate(300%) hue-rotate(30deg) brightness(110%)", label: "Neon" },
  cold: { filter: "hue-rotate(200deg) saturate(150%)", label: "Cold Blue" },
  warm: { filter: "hue-rotate(-20deg) saturate(130%) brightness(105%)", label: "Warm" },
  noir: { filter: "grayscale(100%) contrast(150%) brightness(80%)", label: "Film Noir" },
  faded: { filter: "opacity(85%) saturate(60%) brightness(115%)", label: "Faded" },
  instagram: { filter: "brightness(110%) contrast(90%) saturate(130%)", label: "Instagram" },
};

export class StyleTransfer {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  async applyFilter(imageUrl, filterName) {
    const filter = CANVAS_FILTERS[filterName];
    if (!filter) return imageUrl;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.filter = filter.filter;
        this.ctx.drawImage(img, 0, 0);
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async applyVignette(imageUrl, intensity = 0.5) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        const gradient = this.ctx.createRadialGradient(
          img.width / 2, img.height / 2, img.width * 0.3,
          img.width / 2, img.height / 2, img.width * 0.7
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, img.width, img.height);
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async applyGrain(imageUrl, amount = 30) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * amount;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        this.ctx.putImageData(imageData, 0, 0);
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async pixelate(imageUrl, blockSize = 10) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        for (let x = 0; x < img.width; x += blockSize) {
          for (let y = 0; y < img.height; y += blockSize) {
            const pixel = this.ctx.getImageData(x, y, 1, 1).data;
            this.ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            this.ctx.fillRect(x, y, blockSize, blockSize);
          }
        }
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async adjustColors(imageUrl, { brightness = 100, contrast = 100, saturation = 100, hue = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
        this.ctx.drawImage(img, 0, 0);
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async overlayText(imageUrl, text, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        const { x = img.width / 2, y = img.height - 40, fontSize = 32, color = "white", shadow = true, font = "bold Arial" } = options;
        if (shadow) {
          this.ctx.shadowColor = "rgba(0,0,0,0.8)";
          this.ctx.shadowBlur = 8;
        }
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, x, y);
        resolve(this.canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async mergeImages(urls, layout = "horizontal") {
    const images = await Promise.all(urls.map(url => new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = url;
    })));
    if (layout === "horizontal") {
      const totalW = images.reduce((s, i) => s + i.width, 0);
      const maxH = Math.max(...images.map(i => i.height));
      this.canvas.width = totalW; this.canvas.height = maxH;
      let x = 0;
      images.forEach(img => { this.ctx.drawImage(img, x, 0); x += img.width; });
    } else {
      const maxW = Math.max(...images.map(i => i.width));
      const totalH = images.reduce((s, i) => s + i.height, 0);
      this.canvas.width = maxW; this.canvas.height = totalH;
      let y = 0;
      images.forEach(img => { this.ctx.drawImage(img, 0, y); y += img.height; });
    }
    return this.canvas.toDataURL("image/png");
  }
}

export const styleTransfer = new StyleTransfer();
