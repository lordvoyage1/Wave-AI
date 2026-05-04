/**
 * Wave AI — Video Generation — Audio Visualizer for Video
 */
export class VideoAudioVisualizer {
  constructor() { this.analyser = null; this.audioCtx = null; this.source = null; this.dataArray = null; this.style = "bars"; this.color = "#4f7fff"; }

  async connectAudio(stream) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  render(ctx, x, y, W, H) {
    if (!this.analyser || !this.dataArray) return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const barW = W / this.dataArray.length;
    const grad = ctx.createLinearGradient(x, y + H, x, y);
    grad.addColorStop(0, "#4f7fff"); grad.addColorStop(0.5, "#9b5cff"); grad.addColorStop(1, "#f472b6");
    ctx.fillStyle = grad;
    for (let i = 0; i < this.dataArray.length; i++) {
      const barH = (this.dataArray[i] / 255) * H;
      ctx.fillRect(x + i * barW, y + H - barH, Math.max(1, barW - 1), barH);
    }
  }

  renderCircle(ctx, cx, cy, radius) {
    if (!this.analyser || !this.dataArray) return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const count = Math.min(64, this.dataArray.length);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const amp = (this.dataArray[i] / 255) * radius;
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * (radius + amp);
      const y2 = cy + Math.sin(angle) * (radius + amp);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsl(${(i / count) * 360}, 80%, 60%)`;
      ctx.lineWidth = 2; ctx.stroke();
    }
  }

  getAverageLevel() {
    if (!this.analyser || !this.dataArray) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
  }

  destroy() { this.audioCtx?.close(); }
}
export const videoAudioVisualizer = new VideoAudioVisualizer();
