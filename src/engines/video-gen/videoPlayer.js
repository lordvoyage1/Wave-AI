/**
 * Wave AI — Video Generation — Custom Video Player
 */
export class WaveVideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = null;
    this.controls = null;
    this.isFullscreen = false;
    this.callbacks = new Map();
    this._build();
  }

  _build() {
    this.video = document.createElement("video");
    this.video.className = "wave-video";
    this.video.style.cssText = "width:100%;border-radius:12px;background:#000;";
    this.video.playsInline = true;
    this.video.preload = "metadata";
    const events = ["play", "pause", "ended", "timeupdate", "loadeddata", "error", "waiting", "canplay"];
    events.forEach(e => this.video.addEventListener(e, (ev) => { this.callbacks.get(e)?.forEach(cb => cb(ev)); }));
    if (this.container) this.container.appendChild(this.video);
  }

  on(event, callback) { if (!this.callbacks.has(event)) this.callbacks.set(event, []); this.callbacks.get(event).push(callback); }

  load(src) {
    if (src instanceof Blob || src instanceof File) { this.video.src = URL.createObjectURL(src); }
    else { this.video.src = src; }
    this.video.load();
    return this;
  }

  play() { return this.video.play(); }
  pause() { this.video.pause(); }
  seek(time) { this.video.currentTime = Math.max(0, Math.min(this.video.duration || 0, time)); }
  setVolume(v) { this.video.volume = Math.max(0, Math.min(1, v)); }
  mute() { this.video.muted = true; }
  unmute() { this.video.muted = false; }
  setPlaybackRate(rate) { this.video.playbackRate = Math.max(0.25, Math.min(4, rate)); }

  toggleFullscreen() {
    if (!this.isFullscreen) { this.video.requestFullscreen?.(); this.isFullscreen = true; }
    else { document.exitFullscreen?.(); this.isFullscreen = false; }
  }

  takeScreenshot() {
    const canvas = document.createElement("canvas");
    canvas.width = this.video.videoWidth; canvas.height = this.video.videoHeight;
    canvas.getContext("2d").drawImage(this.video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.95);
  }

  getState() {
    return { currentTime: this.video.currentTime, duration: this.video.duration, paused: this.video.paused, ended: this.video.ended, volume: this.video.volume, muted: this.video.muted, readyState: this.video.readyState };
  }

  destroy() { this.video.pause(); this.video.src = ""; this.video.remove(); }
}
