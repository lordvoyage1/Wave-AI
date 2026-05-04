/**
 * Wave AI — Video Generation — Video Metadata
 */
export async function getVideoMetadata(blob) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(blob);
    video.onloadeddata = () => {
      const meta = {
        duration: video.duration,
        durationFormatted: formatDuration(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth && video.videoHeight ? `${video.videoWidth}:${video.videoHeight}` : "unknown",
        size: blob.size,
        sizeFormatted: formatSize(blob.size),
        mimeType: blob.type,
        bitrate: blob.size && video.duration ? Math.round((blob.size * 8) / video.duration) : 0,
      };
      URL.revokeObjectURL(video.src);
      resolve(meta);
    };
    video.onerror = () => { URL.revokeObjectURL(video.src); resolve({ error: "Could not read metadata" }); };
  });
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function estimateVideoQuality(width, height, bitrate) {
  const pixels = width * height;
  const bitsPerPixel = bitrate / pixels;
  if (bitsPerPixel > 0.1) return "Excellent";
  if (bitsPerPixel > 0.05) return "Good";
  if (bitsPerPixel > 0.02) return "Fair";
  return "Low";
}
