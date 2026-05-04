/**
 * Wave AI — Video Generation — Timeline Manager
 */
export class TimelineManager {
  constructor() { this.clips = []; this.currentTime = 0; this.duration = 0; this.playing = false; this.listeners = new Map(); this.interval = null; }

  on(event, cb) { if (!this.listeners.has(event)) this.listeners.set(event, []); this.listeners.get(event).push(cb); }
  emit(event, data) { (this.listeners.get(event) || []).forEach(cb => { try { cb(data); } catch {} }); }

  addClip(clip) {
    const id = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const c = { id, startTime: clip.startTime || this.duration, duration: clip.duration || 5, ...clip };
    this.clips.push(c);
    this.clips.sort((a, b) => a.startTime - b.startTime);
    this.duration = Math.max(...this.clips.map(c => c.startTime + c.duration));
    this.emit("clip-added", c);
    return id;
  }

  removeClip(id) { this.clips = this.clips.filter(c => c.id !== id); this._recalcDuration(); this.emit("clip-removed", { id }); }

  moveClip(id, newStart) {
    const clip = this.clips.find(c => c.id === id);
    if (clip) { clip.startTime = Math.max(0, newStart); this._recalcDuration(); }
  }

  getClipsAtTime(time) { return this.clips.filter(c => time >= c.startTime && time <= c.startTime + c.duration); }

  play() {
    if (this.playing) return;
    this.playing = true;
    const step = 1000 / 30;
    this.interval = setInterval(() => {
      this.currentTime += step / 1000;
      if (this.currentTime >= this.duration) { this.currentTime = this.duration; this.pause(); this.emit("ended", {}); return; }
      this.emit("timeupdate", { currentTime: this.currentTime, duration: this.duration, progress: this.currentTime / this.duration });
    }, step);
    this.emit("play", {});
  }

  pause() { this.playing = false; clearInterval(this.interval); this.emit("pause", {}); }
  seek(time) { this.currentTime = Math.max(0, Math.min(this.duration, time)); this.emit("seek", { time: this.currentTime }); }
  _recalcDuration() { this.duration = this.clips.length ? Math.max(...this.clips.map(c => c.startTime + c.duration)) : 0; }
  getClips() { return [...this.clips]; }
  getDuration() { return this.duration; }
  getCurrentTime() { return this.currentTime; }
  clear() { this.clips = []; this.duration = 0; this.currentTime = 0; }
}
export const timelineManager = new TimelineManager();
