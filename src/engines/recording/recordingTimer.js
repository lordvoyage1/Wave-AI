/**
 * Wave AI Recording Engine — Recording Timer
 * Precision timer with lap tracking, countdown, and formatting.
 */

export class RecordingTimer {
  constructor() {
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.laps = [];
    this.state = "idle";
    this.interval = null;
    this.callbacks = new Map();
    this.maxDurationMs = null;
    this.countdownMs = null;
  }

  on(event, cb) { this.callbacks.set(event, [...(this.callbacks.get(event) || []), cb]); }
  emit(event, data) { (this.callbacks.get(event) || []).forEach(cb => { try { cb(data); } catch {} }); }

  start(options = {}) {
    if (this.state === "running") return;
    this.startTime = Date.now();
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.laps = [];
    this.state = "running";
    this.maxDurationMs = options.maxDurationMs || null;
    this.countdownMs = options.countdownMs || null;
    this.interval = setInterval(() => this._tick(), 100);
    this.emit("start", { elapsed: 0 });
  }

  _tick() {
    const elapsed = this.getElapsedMs();
    this.emit("tick", { elapsed, formatted: this.formatMs(elapsed) });
    if (this.maxDurationMs && elapsed >= this.maxDurationMs) {
      this.emit("max-reached", { elapsed });
      this.stop();
    }
    if (this.countdownMs) {
      const remaining = Math.max(0, this.countdownMs - elapsed);
      this.emit("countdown", { remaining, formatted: this.formatMs(remaining) });
      if (remaining === 0) { this.emit("countdown-done", {}); this.stop(); }
    }
  }

  pause() {
    if (this.state !== "running") return;
    this.pausedAt = Date.now();
    this.state = "paused";
    clearInterval(this.interval);
    this.emit("pause", { elapsed: this.getElapsedMs() });
  }

  resume() {
    if (this.state !== "paused") return;
    this.totalPausedMs += Date.now() - this.pausedAt;
    this.pausedAt = null;
    this.state = "running";
    this.interval = setInterval(() => this._tick(), 100);
    this.emit("resume", { elapsed: this.getElapsedMs() });
  }

  stop() {
    clearInterval(this.interval);
    this.state = "stopped";
    this.emit("stop", { elapsed: this.getElapsedMs(), laps: this.laps });
  }

  lap() {
    const elapsed = this.getElapsedMs();
    const lap = { index: this.laps.length + 1, elapsed, formatted: this.formatMs(elapsed), split: this.laps.length > 0 ? elapsed - this.laps[this.laps.length - 1].elapsed : elapsed };
    this.laps.push(lap);
    this.emit("lap", lap);
    return lap;
  }

  reset() {
    clearInterval(this.interval);
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.laps = [];
    this.state = "idle";
    this.emit("reset", {});
  }

  getElapsedMs() {
    if (!this.startTime) return 0;
    const paused = this.pausedAt ? Date.now() - this.pausedAt : 0;
    return Date.now() - this.startTime - this.totalPausedMs - paused;
  }

  formatMs(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const cents = Math.floor((ms % 1000) / 10);
    if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cents).padStart(2, "0")}`;
  }

  getState() { return this.state; }
  getLaps() { return [...this.laps]; }
}

export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function estimateFileSizeKB(durationMs, bitrateBps = 128000) {
  return Math.round((durationMs / 1000) * (bitrateBps / 8) / 1024);
}

export const recordingTimer = new RecordingTimer();
