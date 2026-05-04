/**
 * Wave AI Recording Engine — Waveform Visualizer
 * Real-time canvas-based audio visualization:
 * waveform, bars, circle, oscilloscope, spectrum.
 */

export class WaveformVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext("2d");
    this.animFrame = null;
    this.mode = "bars"; // bars | waveform | circle | spectrum | oscilloscope
    this.theme = {
      primary: "#4f7fff",
      secondary: "#9b5cff",
      accent: "#f472b6",
      bg: "transparent",
      bars: ["#4f7fff", "#6b8fff", "#9b5cff", "#c084fc", "#f472b6"],
    };
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.isActive = false;
    this.sensitivity = 1.5;
    this.smoothing = 0.8;
    this.barCount = 64;
    this.levelHistory = [];
  }

  connectAnalyser(analyser) {
    this.analyser = analyser;
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = this.smoothing;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  connectFromLevel(levelGetter) {
    this._levelGetter = levelGetter;
  }

  setMode(mode) {
    const modes = ["bars", "waveform", "circle", "spectrum", "oscilloscope", "ripple"];
    if (modes.includes(mode)) this.mode = mode;
  }

  setTheme(theme) { this.theme = { ...this.theme, ...theme }; }
  setSensitivity(s) { this.sensitivity = Math.max(0.1, Math.min(5, s)); }

  start() {
    if (!this.ctx || !this.canvas) return;
    this.isActive = true;
    this._draw();
  }

  stop() {
    this.isActive = false;
    if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
    this.clear();
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _getData() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    if (this._levelGetter) {
      const level = this._levelGetter();
      const len = this.barCount;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = Math.random() < 0.3 ? level * 2.55 * this.sensitivity * (0.3 + Math.random() * 0.7) : 0;
      }
      return arr;
    }
    return new Uint8Array(this.barCount).fill(0);
  }

  _draw() {
    if (!this.isActive) return;
    const data = this._getData();
    this.clear();
    switch (this.mode) {
      case "bars": this._drawBars(data); break;
      case "waveform": this._drawWaveform(data); break;
      case "circle": this._drawCircle(data); break;
      case "spectrum": this._drawSpectrum(data); break;
      case "oscilloscope": this._drawOscilloscope(data); break;
      case "ripple": this._drawRipple(data); break;
    }
    this.animFrame = requestAnimationFrame(() => this._draw());
  }

  _drawBars(data) {
    const { width: W, height: H } = this.canvas;
    const count = Math.min(this.barCount, data.length);
    const barW = W / count;
    const gradient = this.ctx.createLinearGradient(0, H, 0, 0);
    gradient.addColorStop(0, this.theme.primary);
    gradient.addColorStop(0.5, this.theme.secondary);
    gradient.addColorStop(1, this.theme.accent);
    this.ctx.fillStyle = gradient;
    for (let i = 0; i < count; i++) {
      const value = data[i] * this.sensitivity;
      const barH = (value / 255) * H;
      const x = i * barW;
      const gap = Math.max(1, barW * 0.1);
      this.ctx.beginPath();
      this.ctx.roundRect(x + gap / 2, H - barH, barW - gap, Math.max(2, barH), [3, 3, 0, 0]);
      this.ctx.fill();
    }
  }

  _drawWaveform(data) {
    const { width: W, height: H } = this.canvas;
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = this.theme.secondary;
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    const step = W / data.length;
    for (let i = 0; i < data.length; i++) {
      const y = H / 2 + ((data[i] / 128.0 - 1) * (H / 2 * this.sensitivity));
      i === 0 ? this.ctx.moveTo(0, y) : this.ctx.lineTo(i * step, y);
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  _drawCircle(data) {
    const { width: W, height: H } = this.canvas;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.3;
    const count = Math.min(128, data.length);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const amplitude = (data[i] / 255) * radius * this.sensitivity;
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * (radius + amplitude);
      const y2 = cy + Math.sin(angle) * (radius + amplitude);
      const hue = (i / count) * 360;
      this.ctx.strokeStyle = `hsl(${hue}, 80%, 65%)`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  _drawSpectrum(data) {
    const { width: W, height: H } = this.canvas;
    for (let i = 0; i < data.length && i < W; i++) {
      const value = data[i] * this.sensitivity;
      const hue = (i / data.length) * 270;
      const alpha = value / 255;
      this.ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
      this.ctx.fillRect(i * (W / data.length), 0, W / data.length, H);
    }
  }

  _drawOscilloscope(data) {
    const { width: W, height: H } = this.canvas;
    this.ctx.strokeStyle = "#00ff88";
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = "#00ff88";
    this.ctx.shadowBlur = 6;
    this.ctx.beginPath();
    const step = W / data.length;
    for (let i = 0; i < data.length; i++) {
      const y = (data[i] / 255) * H;
      i === 0 ? this.ctx.moveTo(0, y) : this.ctx.lineTo(i * step, y);
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  _drawRipple(data) {
    const { width: W, height: H } = this.canvas;
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const level = (avg / 255) * this.sensitivity;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.45;
    for (let i = 3; i >= 1; i--) {
      const r = maxR * level * (i / 3);
      const alpha = (1 - i / 4) * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(79,127,255,${alpha})`;
      this.ctx.lineWidth = 3 - i * 0.5;
      this.ctx.stroke();
    }
  }
}

export function createMiniWaveform(levels, width = 80, height = 24) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const barW = width / levels.length;
  const grad = ctx.createLinearGradient(0, height, 0, 0);
  grad.addColorStop(0, "#4f7fff");
  grad.addColorStop(1, "#9b5cff");
  ctx.fillStyle = grad;
  levels.forEach((lvl, i) => {
    const h = (lvl / 100) * height;
    ctx.beginPath();
    ctx.roundRect(i * barW + 1, height - h, barW - 2, Math.max(2, h), 1);
    ctx.fill();
  });
  return canvas.toDataURL();
}
