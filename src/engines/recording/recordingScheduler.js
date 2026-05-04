/**
 * Wave AI Recording Engine — Recording Scheduler
 * Schedule recordings, set max durations, auto-split,
 * and manage recording queues.
 */

export class RecordingScheduler {
  constructor() {
    this.scheduled = new Map();
    this.active = null;
    this.queue = [];
    this.timers = new Map();
  }

  schedule(id, startAt, duration, config = {}) {
    const delay = startAt - Date.now();
    if (delay < 0) return { error: "Start time is in the past" };
    const timer = setTimeout(() => {
      this._startScheduled(id, duration, config);
    }, delay);
    this.scheduled.set(id, { id, startAt, duration, config, timer, status: "scheduled" });
    this.timers.set(id, timer);
    return { scheduled: true, id, startsIn: delay };
  }

  cancel(id) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    const item = this.scheduled.get(id);
    if (item) { item.status = "cancelled"; }
    return { cancelled: true, id };
  }

  _startScheduled(id, durationMs, config) {
    const item = this.scheduled.get(id);
    if (!item) return;
    item.status = "running";
    if (config.onStart) config.onStart(id);
    if (durationMs) {
      const stopTimer = setTimeout(() => {
        item.status = "completed";
        if (config.onStop) config.onStop(id);
        this._processQueue();
      }, durationMs);
      this.timers.set(`${id}_stop`, stopTimer);
    }
  }

  addToQueue(config) {
    const id = `queued_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    this.queue.push({ id, config, status: "queued", addedAt: Date.now() });
    return id;
  }

  _processQueue() {
    if (this.queue.length === 0 || this.active) return;
    const next = this.queue.shift();
    this.active = next;
    next.status = "running";
    if (next.config.onStart) next.config.onStart(next.id);
  }

  setMaxDuration(recorder, maxMs, onMaxReached) {
    const timer = setTimeout(() => {
      recorder.stop?.();
      onMaxReached?.();
    }, maxMs);
    return { cancel: () => clearTimeout(timer) };
  }

  createAutoSplitter(recorder, segmentMs, onSegment) {
    let segmentCount = 0;
    const interval = setInterval(() => {
      segmentCount++;
      recorder.stop?.();
      onSegment?.(segmentCount);
      setTimeout(() => recorder.start?.(), 200);
    }, segmentMs);
    return { stop: () => clearInterval(interval), getSegmentCount: () => segmentCount };
  }

  getScheduled() { return Array.from(this.scheduled.values()); }
  getQueue() { return [...this.queue]; }
  clearAll() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.scheduled.clear();
    this.queue = [];
    this.active = null;
  }
}

export class RecordingCountdown {
  constructor() { this.timer = null; this.callbacks = {}; }

  start(seconds, callbacks = {}) {
    this.callbacks = callbacks;
    let remaining = seconds;
    callbacks.onTick?.(remaining);
    this.timer = setInterval(() => {
      remaining--;
      callbacks.onTick?.(remaining);
      if (remaining <= 0) { clearInterval(this.timer); callbacks.onComplete?.(); }
    }, 1000);
  }

  cancel() { clearInterval(this.timer); this.callbacks.onCancel?.(); }
}

export const recordingScheduler = new RecordingScheduler();
