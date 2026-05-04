/**
 * Wave AI Recording Engine — Core
 * MediaRecorder API wrapper with multi-format support,
 * real-time level monitoring, and chunk management.
 */

export const RECORDING_FORMATS = {
  audio: [
    { mime: "audio/webm;codecs=opus", ext: "webm", quality: "high", support: "Chrome/Firefox/Edge" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg", quality: "high", support: "Firefox" },
    { mime: "audio/mp4", ext: "m4a", quality: "high", support: "Safari/iOS" },
    { mime: "audio/wav", ext: "wav", quality: "lossless", support: "All" },
  ],
  video: [
    { mime: "video/webm;codecs=vp9,opus", ext: "webm", quality: "excellent", support: "Chrome/Firefox" },
    { mime: "video/webm;codecs=vp8,opus", ext: "webm", quality: "good", support: "Chrome/Firefox/Edge" },
    { mime: "video/mp4", ext: "mp4", quality: "high", support: "Safari" },
    { mime: "video/webm", ext: "webm", quality: "high", support: "Most browsers" },
  ],
};

export function getSupportedMimeType(type = "audio") {
  const formats = RECORDING_FORMATS[type] || RECORDING_FORMATS.audio;
  for (const fmt of formats) {
    if (MediaRecorder.isTypeSupported(fmt.mime)) return fmt;
  }
  return formats[formats.length - 1];
}

export class RecordingCore {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedMs = 0;
    this.state = "idle";
    this.listeners = new Map();
    this.analyser = null;
    this.audioCtx = null;
    this.levelInterval = null;
    this.currentBlob = null;
    this.metadata = {};
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
    return () => {
      const handlers = this.listeners.get(event) || [];
      this.listeners.set(event, handlers.filter(h => h !== handler));
    };
  }

  emit(event, data) {
    (this.listeners.get(event) || []).forEach(h => { try { h(data); } catch {} });
  }

  async requestPermissions(constraints = { audio: true }) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.emit("permissions-granted", { stream: this.stream });
      return { success: true, stream: this.stream };
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Microphone permission denied. Please allow access in your browser settings."
        : err.name === "NotFoundError"
        ? "No microphone found. Please connect a microphone."
        : `Could not access microphone: ${err.message}`;
      this.emit("permissions-denied", { error: msg });
      return { success: false, error: msg };
    }
  }

  setupAnalyser() {
    if (!this.stream || !window.AudioContext) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
    } catch {}
  }

  getAudioLevel() {
    if (!this.analyser) return 0;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
    return Math.min(100, Math.round((avg / 255) * 100));
  }

  startLevelMonitoring(callback, intervalMs = 50) {
    this.stopLevelMonitoring();
    this.levelInterval = setInterval(() => {
      callback(this.getAudioLevel());
    }, intervalMs);
  }

  stopLevelMonitoring() {
    if (this.levelInterval) { clearInterval(this.levelInterval); this.levelInterval = null; }
  }

  async start(options = {}) {
    if (this.state !== "idle") return { success: false, error: "Already recording" };
    const constraints = options.video
      ? { audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }, video: { width: 1280, height: 720, frameRate: 30 } }
      : { audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } };
    const permResult = await this.requestPermissions(constraints);
    if (!permResult.success) return permResult;
    this.setupAnalyser();
    const format = getSupportedMimeType(options.video ? "video" : "audio");
    const recOptions = { mimeType: format.mime, audioBitsPerSecond: 128000 };
    if (options.video) recOptions.videoBitsPerSecond = 2500000;
    try {
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, recOptions);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
          this.emit("chunk", { chunk: e.data, total: this.chunks.length });
        }
      };
      this.mediaRecorder.onstop = () => this._onStop(format);
      this.mediaRecorder.onerror = (e) => this.emit("error", { error: e.error?.message || "Recording error" });
      this.mediaRecorder.start(options.timeslice || 100);
      this.startTime = Date.now();
      this.state = "recording";
      this.metadata = { format, startedAt: new Date().toISOString(), constraints, ...options.metadata };
      this.emit("start", { format, metadata: this.metadata });
      return { success: true, format };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  pause() {
    if (this.state !== "recording" || !this.mediaRecorder) return false;
    this.mediaRecorder.pause();
    this.pauseTime = Date.now();
    this.state = "paused";
    this.emit("pause", { duration: this.getDuration() });
    return true;
  }

  resume() {
    if (this.state !== "paused" || !this.mediaRecorder) return false;
    if (this.pauseTime) { this.totalPausedMs += Date.now() - this.pauseTime; this.pauseTime = null; }
    this.mediaRecorder.resume();
    this.state = "recording";
    this.emit("resume", { duration: this.getDuration() });
    return true;
  }

  stop() {
    if (!["recording", "paused"].includes(this.state) || !this.mediaRecorder) return false;
    this.stopLevelMonitoring();
    this.mediaRecorder.stop();
    this.state = "idle";
    return true;
  }

  _onStop(format) {
    const blob = new Blob(this.chunks, { type: format.mime });
    this.currentBlob = blob;
    const duration = this.getDuration();
    this.emit("stop", { blob, format, duration, size: blob.size, url: URL.createObjectURL(blob) });
    this.stream?.getTracks().forEach(t => t.stop());
    if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
  }

  getDuration() {
    if (!this.startTime) return 0;
    const paused = this.pauseTime ? Date.now() - this.pauseTime : 0;
    return Date.now() - this.startTime - this.totalPausedMs - paused;
  }

  reset() {
    this.stop();
    this.chunks = [];
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedMs = 0;
    this.currentBlob = null;
    this.metadata = {};
  }
}

export const recordingCore = new RecordingCore();
