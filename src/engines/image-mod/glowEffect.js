/**
 * Wave AI — Image Modification — Glow & Light Effects
 */
export class GlowEffectEngine {
  addGlow(canvas, color = "#4f7fff", blur = 20, intensity = 0.8) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur;
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = intensity * (1 - i * 0.2); ctx.drawImage(canvas, 0, 0, W, H); }
    ctx.globalAlpha = 1; ctx.restore();
  }
  addNeonGlow(canvas, edges = true) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 150) { data[i] = Math.min(255, data[i] * 1.2); data[i + 2] = Math.min(255, data[i + 2] * 1.4); }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.shadowColor = "#4f7fff"; ctx.shadowBlur = 15;
    ctx.drawImage(canvas, 0, 0, W, H); ctx.globalCompositeOperation = "source-over"; ctx.restore();
  }
  addLensFlare(canvas, x, y, intensity = 0.7) {
    const ctx = canvas.getContext("2d"); ctx.save();
    const mainFlare = ctx.createRadialGradient(x, y, 0, x, y, 80);
    mainFlare.addColorStop(0, `rgba(255,255,220,${intensity})`); mainFlare.addColorStop(0.2, `rgba(255,200,100,${intensity * 0.5})`); mainFlare.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = mainFlare; ctx.globalCompositeOperation = "screen";
    ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fill();
    const streaks = 6;
    for (let i = 0; i < streaks; i++) {
      const angle = (i / streaks) * Math.PI * 2;
      const len = 120 + i * 20;
      const grad = ctx.createLinearGradient(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      grad.addColorStop(0, `rgba(255,255,200,${intensity * 0.5})`); grad.addColorStop(1, "rgba(255,255,200,0)");
      ctx.strokeStyle = grad; ctx.lineWidth = 2 - i * 0.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over"; ctx.restore();
  }
  addDuotone(canvas, color1 = "#4f7fff", color2 = "#f472b6") {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    const [r1, g1, b1] = this._hex2rgb(color1); const [r2, g2, b2] = this._hex2rgb(color2);
    for (let i = 0; i < data.length; i += 4) {
      const t = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      data[i] = r1 + (r2 - r1) * t; data[i + 1] = g1 + (g2 - g1) * t; data[i + 2] = b1 + (b2 - b1) * t;
    }
    ctx.putImageData(imageData, 0, 0);
  }
  _hex2rgb(hex) { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0]; }
}
export const glowEffectEngine = new GlowEffectEngine();
