/**
 * Wave AI — Video Generation — Animation Engine
 * Tweening, keyframes, and animation curves for video generation.
 */
export const EASING = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  elastic: (t) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  bounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
    if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    t -= 2.625 / d1; return n1 * t * t + 0.984375;
  },
  spring: (t) => Math.sin(t * Math.PI * (0.2 + 2.5 * t * t * t)) * Math.pow(1 - t, 2.2) + t,
};

export class AnimationTimeline {
  constructor() { this.keyframes = []; this.startTime = null; this.duration = 1000; this.loop = false; this.callbacks = new Map(); }

  addKeyframe(time, properties, easing = "easeInOut") {
    this.keyframes.push({ time: Math.max(0, Math.min(1, time)), properties, easing });
    this.keyframes.sort((a, b) => a.time - b.time);
    return this;
  }

  getValuesAt(progress) {
    if (!this.keyframes.length) return {};
    const p = this.loop ? progress % 1 : Math.max(0, Math.min(1, progress));
    let prevFrame = this.keyframes[0];
    let nextFrame = this.keyframes[this.keyframes.length - 1];
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].time <= p) prevFrame = this.keyframes[i];
      if (this.keyframes[i].time >= p && (nextFrame === prevFrame || this.keyframes[i].time < nextFrame.time)) nextFrame = this.keyframes[i];
    }
    if (prevFrame === nextFrame) return { ...prevFrame.properties };
    const t01 = (p - prevFrame.time) / (nextFrame.time - prevFrame.time);
    const eased = (EASING[nextFrame.easing] || EASING.linear)(t01);
    const result = {};
    for (const key of new Set([...Object.keys(prevFrame.properties), ...Object.keys(nextFrame.properties)])) {
      const from = prevFrame.properties[key] ?? 0;
      const to = nextFrame.properties[key] ?? 0;
      result[key] = from + (to - from) * eased;
    }
    return result;
  }

  start() { this.startTime = Date.now(); }
  getProgress() { if (!this.startTime) return 0; return (Date.now() - this.startTime) / this.duration; }
  isComplete() { return !this.loop && this.getProgress() >= 1; }
  reset() { this.startTime = null; }
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

export function createShakeAnimation(intensity = 5, duration = 300) {
  const frames = [];
  const count = Math.floor(duration / 16);
  for (let i = 0; i < count; i++) {
    const decay = 1 - i / count;
    frames.push({ offsetX: (Math.random() - 0.5) * intensity * 2 * decay, offsetY: (Math.random() - 0.5) * intensity * decay });
  }
  return frames;
}
