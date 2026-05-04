/**
 * Wave AI — Video Generation — Video Merger
 * Concatenate video blobs sequentially using canvas recording.
 */
export class VideoMerger {
  async merge(videoBlobs, options = {}) {
    const { width = 854, height = 480, fps = 30 } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(canvas.captureStream(fps), { mimeType, videoBitsPerSecond: 4000000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(100);
    for (const blob of videoBlobs) {
      await this._playBlobToCanvas(blob, canvas, ctx);
    }
    recorder.stop();
    await new Promise(r => { recorder.onstop = r; });
    const merged = new Blob(chunks, { type: mimeType });
    return { blob: merged, url: URL.createObjectURL(merged), count: videoBlobs.length };
  }

  async _playBlobToCanvas(blob, canvas, ctx) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(blob);
      video.muted = true;
      video.onloadeddata = () => {
        video.play();
        const drawFrame = () => {
          if (video.ended || video.paused) { URL.revokeObjectURL(video.src); resolve(); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      };
      video.onerror = resolve;
    });
  }

  async split(blob, segmentDurationS = 10) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(blob);
      video.onloadeddata = async () => {
        const total = video.duration;
        const segments = [];
        for (let start = 0; start < total; start += segmentDurationS) {
          segments.push({ start, end: Math.min(start + segmentDurationS, total), duration: Math.min(segmentDurationS, total - start) });
        }
        URL.revokeObjectURL(video.src);
        resolve({ segments, totalDuration: total, segmentCount: segments.length });
      };
      video.onerror = () => resolve({ segments: [], totalDuration: 0 });
    });
  }
}
export const videoMerger = new VideoMerger();
