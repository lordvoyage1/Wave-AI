/**
 * Wave AI — Video Generation — Transitions Engine
 */
export const TRANSITIONS = {
  fade: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.drawImage(frameA, 0, 0, W, H);
    ctx.globalAlpha = progress; ctx.drawImage(frameB, 0, 0, W, H);
    ctx.globalAlpha = 1;
  },
  slide_left: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(frameA, -W * progress, 0, W, H);
    ctx.drawImage(frameB, W * (1 - progress), 0, W, H);
  },
  slide_right: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(frameA, W * progress, 0, W, H);
    ctx.drawImage(frameB, -W * (1 - progress), 0, W, H);
  },
  zoom_in: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const scale = 1 + progress * 0.5;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(scale, scale); ctx.drawImage(frameA, -W / 2, -H / 2, W, H); ctx.restore();
    ctx.globalAlpha = progress; ctx.drawImage(frameB, 0, 0, W, H); ctx.globalAlpha = 1;
  },
  wipe: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(frameA, 0, 0, W, H);
    ctx.drawImage(frameB, 0, 0, W * progress, H, 0, 0, W * progress, H);
  },
  dissolve: (ctx, frameA, frameB, progress, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(frameA, 0, 0, W, H);
    ctx.globalAlpha = progress;
    for (let x = 0; x < W; x += 4) for (let y = 0; y < H; y += 4) if (Math.random() < progress) ctx.fillRect(x, y, 4, 4);
    ctx.globalAlpha = 1;
  },
};

export function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
export function easeIn(t) { return t * t; }
export function easeOut(t) { return t * (2 - t); }

export class TransitionEngine {
  constructor() { this.current = "fade"; this.duration = 0.5; this.easing = easeInOut; }
  set(name) { if (TRANSITIONS[name]) this.current = name; }
  setDuration(s) { this.duration = s; }
  apply(ctx, frameA, frameB, progress, W, H) {
    const fn = TRANSITIONS[this.current] || TRANSITIONS.fade;
    fn(ctx, frameA, frameB, this.easing(progress), W, H);
  }
  getAll() { return Object.keys(TRANSITIONS); }
}
export const transitionEngine = new TransitionEngine();
