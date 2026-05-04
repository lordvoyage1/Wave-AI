/**
 * Wave AI — Video Generation — Particle System
 */
export class ParticleSystem {
  constructor() { this.particles = []; this.maxParticles = 200; this.gravity = 0.05; this.wind = 0; }

  spawn(count = 1, options = {}) {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      this.particles.push({
        x: options.x ?? Math.random() * (options.width || 800),
        y: options.y ?? Math.random() * (options.height || 480),
        vx: (Math.random() - 0.5) * (options.speed || 2),
        vy: (Math.random() - 0.5) * (options.speed || 2) - (options.upward ? 2 : 0),
        size: options.size || (Math.random() * 4 + 1),
        color: options.color || `hsl(${Math.random() * 360}, 80%, 60%)`,
        alpha: 1,
        life: 1,
        decay: options.decay || (0.005 + Math.random() * 0.01),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        shape: options.shape || "circle",
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx + this.wind;
      p.y += p.vy + this.gravity;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life -= p.decay;
      p.alpha = p.life;
      p.rotation += p.rotSpeed;
      p.size = Math.max(0.1, p.size * 0.995);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === "star") { this._drawStar(ctx, 0, 0, p.size * 0.4, p.size, 5); }
      else if (p.shape === "square") { ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  _drawStar(ctx, cx, cy, innerR, outerR, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle)) : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath(); ctx.fill();
  }

  spawnExplosion(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 2 + Math.random() * 4, color: `hsl(${30 + Math.random() * 60}, 90%, 60%)`, alpha: 1, life: 1, decay: 0.02, rotation: 0, rotSpeed: 0, shape: "circle" });
    }
  }

  spawnFirework(x, y) { this.spawnExplosion(x, y, 50); }
  setGravity(g) { this.gravity = g; }
  setWind(w) { this.wind = w; }
  clear() { this.particles = []; }
  getCount() { return this.particles.length; }
}
export const particleSystem = new ParticleSystem();
