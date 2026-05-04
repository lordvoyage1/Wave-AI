/**
 * Wave AI — Video Generation — Video Compressor
 * Re-encode video at lower bitrate through canvas.
 */
export async function compressVideo(blob, quality = "medium") {
  const qualityMap = {
    low: { videoBitsPerSecond: 500000, scale: 0.5 },
    medium: { videoBitsPerSecond: 1500000, scale: 0.75 },
    high: { videoBitsPerSecond: 4000000, scale: 1 },
  };
  const { videoBitsPerSecond, scale } = qualityMap[quality] || qualityMap.medium;
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(blob);
    video.muted = true;
    video.onloadeddata = () => {
      const W = Math.round(video.videoWidth * scale), H = Math.round(video.videoHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = W || 854; canvas.height = H || 480;
      const ctx = canvas.getContext("2d");
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const chunks = [];
      const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType, videoBitsPerSecond });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const compressed = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(video.src);
        resolve({ blob: compressed, url: URL.createObjectURL(compressed), originalSize: blob.size, compressedSize: compressed.size, ratio: (compressed.size / blob.size).toFixed(2) });
      };
      recorder.start(100);
      video.play();
      const draw = () => {
        if (video.ended || video.paused) { recorder.stop(); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);
      };
      draw();
    };
    video.onerror = reject;
  });
}

export function getCompressionRecommendation(sizeBytes, durationSeconds) {
  const bitrate = (sizeBytes * 8) / durationSeconds;
  if (bitrate > 8000000) return { recommendation: "high-compression", quality: "medium", reason: "Very high bitrate — significant size reduction possible" };
  if (bitrate > 4000000) return { recommendation: "moderate-compression", quality: "high", reason: "Above average bitrate — some compression recommended" };
  return { recommendation: "minimal-compression", quality: "high", reason: "Already reasonably compressed" };
}
