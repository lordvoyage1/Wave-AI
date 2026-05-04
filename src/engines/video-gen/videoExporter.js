/**
 * Wave AI — Video Generation — Video Exporter
 */
export const EXPORT_QUALITY = {
  low: { videoBitsPerSecond: 500000, audioBitsPerSecond: 64000, label: "Low (500kbps)" },
  medium: { videoBitsPerSecond: 1500000, audioBitsPerSecond: 96000, label: "Medium (1.5Mbps)" },
  high: { videoBitsPerSecond: 4000000, audioBitsPerSecond: 128000, label: "High (4Mbps)" },
  ultra: { videoBitsPerSecond: 8000000, audioBitsPerSecond: 192000, label: "Ultra (8Mbps)" },
};

export class VideoExporter {
  download(blob, filename = "wave-ai-video.webm") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return filename;
  }

  async share(blob, title = "Wave AI Video") {
    if (!navigator.share) return { success: false, error: "Web Share API not supported" };
    try {
      const file = new File([blob], "wave-video.webm", { type: blob.type });
      await navigator.share({ title, files: [file] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getFileSize(blob) {
    const bytes = blob.size;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  estimateDuration(blob, quality = "medium") {
    const q = EXPORT_QUALITY[quality];
    return blob.size / (q.videoBitsPerSecond / 8);
  }

  generateFilename(title = "recording", format = "webm") {
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
    return `wave-${slug}-${date}.${format}`;
  }
}
export const videoExporter = new VideoExporter();
