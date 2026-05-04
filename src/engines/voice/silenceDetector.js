/**
 * Wave AI — Voice Chat — Silence Detector
 * Real-time voice activity detection using audio analysis.
 */
export class SilenceDetector {
  constructor() { this.threshold = 10; this.silenceDuration = 1500; this.silenceStart = null; this.callbacks = {}; this.active = false; this.analyser = null; this.levelHistory = []; this.interval = null; }

  connect(stream) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    audioCtx.createMediaStreamSource(stream).connect(this.analyser);
    return this;
  }

  start(options = {}) {
    this.threshold = options.threshold || this.threshold;
    this.silenceDuration = options.silenceDuration || this.silenceDuration;
    this.callbacks = options;
    this.active = true;
    this.interval = setInterval(() => this._check(), 50);
    return this;
  }

  stop() { this.active = false; clearInterval(this.interval); }

  _check() {
    if (!this.active || !this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const level = data.reduce((a, b) => a + b, 0) / data.length;
    this.levelHistory.push(level);
    if (this.levelHistory.length > 20) this.levelHistory.shift();
    const isSilent = level < this.threshold;
    if (isSilent) {
      if (!this.silenceStart) { this.silenceStart = Date.now(); this.callbacks.onSilenceStart?.(); }
      else if (Date.now() - this.silenceStart >= this.silenceDuration) {
        this.callbacks.onSilenceDurationReached?.({ duration: Date.now() - this.silenceStart, level });
        this.silenceStart = null;
      }
    } else {
      if (this.silenceStart) { this.callbacks.onSpeechStart?.(); this.silenceStart = null; }
    }
    this.callbacks.onLevel?.(level);
  }

  setThreshold(t) { this.threshold = t; }
  setSilenceDuration(ms) { this.silenceDuration = ms; }
  getAverageLevel() { return this.levelHistory.reduce((a, b) => a + b, 0) / Math.max(1, this.levelHistory.length); }
  isCurrentlySilent() { return this.levelHistory[this.levelHistory.length - 1] < this.threshold; }
}

export const silenceDetector = new SilenceDetector();
