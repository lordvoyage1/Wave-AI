/**
 * Wave AI — Image Generation — Image Animator
 * Add subtle animations to static images (ken burns, zoom, pan).
 */
export class ImageAnimator {
  async kenBurns(imageUrl, options = {}) {
    const { duration = 5, direction = "zoom-in", width = 800, height = 500 } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    const img = await this._load(imageUrl);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(100);
    await new Promise(resolve => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(1, elapsed / (duration * 1000));
        const scale = direction === "zoom-in" ? 1 + p * 0.2 : 1.2 - p * 0.2;
        const offsetX = direction === "pan-right" ? p * 50 : 0;
        const offsetY = direction === "pan-down" ? p * 30 : 0;
        const sw = img.width / scale, sh = img.height / scale;
        ctx.drawImage(img, offsetX, offsetY, sw, sh, 0, 0, width, height);
        if (elapsed < duration * 1000) requestAnimationFrame(animate);
        else { recorder.stop(); setTimeout(resolve, 200); }
      };
      requestAnimationFrame(animate);
    });
    const blob = new Blob(chunks, { type: mimeType });
    return { blob, url: URL.createObjectURL(blob), duration };
  }

  _load(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
  }

  async createGIF(frames, delay = 100) {
    return { note: "GIF creation requires gifshot or gif.js library", frames: frames.length, delay };
  }
}
export const imageAnimator = new ImageAnimator();
