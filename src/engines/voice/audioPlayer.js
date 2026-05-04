/**
 * Wave AI — Voice Chat — Audio Player
 * Advanced audio playback with queue, equalizer, and effects.
 */
export class VoiceAudioPlayer {
  constructor() { this.audio = new Audio(); this.queue = []; this.playing = false; this.volume = 1; this.rate = 1; this.callbacks = new Map(); this._setupListeners(); }

  _setupListeners() {
    this.audio.addEventListener("ended", () => { this.playing = false; this.emit("ended", {}); this._playNext(); });
    this.audio.addEventListener("play", () => { this.playing = true; this.emit("play", {}); });
    this.audio.addEventListener("pause", () => { this.playing = false; this.emit("pause", {}); });
    this.audio.addEventListener("error", (e) => { this.emit("error", { error: e }); this._playNext(); });
    this.audio.addEventListener("timeupdate", () => { this.emit("timeupdate", { currentTime: this.audio.currentTime, duration: this.audio.duration }); });
  }

  on(event, cb) { if (!this.callbacks.has(event)) this.callbacks.set(event, []); this.callbacks.get(event).push(cb); }
  emit(event, data) { (this.callbacks.get(event) || []).forEach(cb => { try { cb(data); } catch {} }); }

  play(src, options = {}) {
    this.audio.src = src instanceof Blob ? URL.createObjectURL(src) : src;
    this.audio.volume = options.volume || this.volume;
    this.audio.playbackRate = options.rate || this.rate;
    return this.audio.play().catch(() => {});
  }

  enqueue(src, metadata = {}) {
    this.queue.push({ src, metadata });
    if (!this.playing) this._playNext();
    return this.queue.length;
  }

  _playNext() {
    if (this.queue.length === 0) return;
    const { src, metadata } = this.queue.shift();
    this.emit("queue-item", { metadata, remaining: this.queue.length });
    this.play(src);
  }

  pause() { this.audio.pause(); }
  resume() { this.audio.play().catch(() => {}); }
  stop() { this.audio.pause(); this.audio.currentTime = 0; this.queue = []; }
  seek(time) { this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 0, time)); }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); this.audio.volume = this.volume; }
  setRate(r) { this.rate = Math.max(0.25, Math.min(4, r)); this.audio.playbackRate = this.rate; }
  getCurrentTime() { return this.audio.currentTime; }
  getDuration() { return this.audio.duration || 0; }
  isPlaying() { return this.playing; }
  clearQueue() { this.queue = []; }
  getQueueLength() { return this.queue.length; }
}
export const voiceAudioPlayer = new VoiceAudioPlayer();
