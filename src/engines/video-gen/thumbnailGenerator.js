/**
 * Wave AI — Video Generation — Thumbnail Generator
 */
export class ThumbnailGenerator {
  async fromVideo(videoElement, timeSeconds = 0) {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    videoElement.currentTime = timeSeconds;
    await new Promise(r => { videoElement.onseeked = r; });
    canvas.getContext("2d").drawImage(videoElement, 0, 0);
    return { dataURL: canvas.toDataURL("image/jpeg", 0.9), canvas };
  }

  async fromVideoBlob(blob, timeSeconds = 0) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(blob);
      video.muted = true;
      video.onloadeddata = async () => {
        const result = await this.fromVideo(video, Math.min(timeSeconds, video.duration || 0));
        URL.revokeObjectURL(video.src);
        resolve(result);
      };
      video.onerror = reject;
    });
  }

  async createCustomThumbnail(title, imageUrl, options = {}) {
    const { width = 1280, height = 720, titleColor = "#ffffff", bg = "#0d1117" } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (imageUrl) {
      const img = await new Promise((res, rej) => {
        const i = new Image(); i.crossOrigin = "anonymous";
        i.onload = () => res(i); i.onerror = rej; i.src = imageUrl;
      }).catch(() => null);
      if (img) {
        ctx.drawImage(img, 0, 0, width, height);
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, width, height);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0d1117"); grad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
    }
    ctx.font = `bold ${Math.round(height * 0.1)}px Arial`;
    ctx.fillStyle = titleColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 15;
    ctx.fillText(title, width / 2, height / 2);
    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(height * 0.045)}px Arial`;
    ctx.fillStyle = "#4f7fff";
    ctx.fillText("Wave AI", width / 2, height - 40);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.95));
    return { blob, dataURL: canvas.toDataURL("image/jpeg", 0.95), url: URL.createObjectURL(blob) };
  }

  async generateStrip(videoBlob, count = 5) {
    const thumbnails = [];
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    await new Promise(r => { video.onloadeddata = r; });
    const step = (video.duration || 10) / (count + 1);
    for (let i = 1; i <= count; i++) {
      const thumb = await this.fromVideo(video, step * i);
      thumbnails.push(thumb);
    }
    URL.revokeObjectURL(video.src);
    return thumbnails;
  }
}
export const thumbnailGenerator = new ThumbnailGenerator();
