/**
 * Wave AI — Image Generation — Background Remover
 * Canvas-based background removal using color threshold,
 * edge detection, and HuggingFace segmentation models.
 */
export class BackgroundRemover {
  async removeByColor(imageUrl, targetColor = [255, 255, 255], tolerance = 30) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = await this._loadImage(imageUrl);
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const diff = Math.sqrt((r - targetColor[0]) ** 2 + (g - targetColor[1]) ** 2 + (b - targetColor[2]) ** 2);
      if (diff < tolerance) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    return { blob, dataURL: canvas.toDataURL("image/png"), url: URL.createObjectURL(blob) };
  }

  async removeWithHuggingFace(imageBlob, apiKey) {
    if (!apiKey) return { success: false, error: "No API key" };
    try {
      const arrayBuffer = await imageBlob.arrayBuffer();
      const response = await fetch("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", {
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

  _loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
  }

  async addBackground(foregroundUrl, backgroundUrl) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const [fg, bg] = await Promise.all([this._loadImage(foregroundUrl), this._loadImage(backgroundUrl)]);
    canvas.width = bg.width; canvas.height = bg.height;
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(fg, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
}
export const backgroundRemover = new BackgroundRemover();
