/**
 * Wave AI — Image Modification — Border & Frame Effects
 */
export class BorderEffectEngine {
  addSolidBorder(canvas, width = 10, color = "#000000") {
    const ctx = canvas.getContext("2d"); ctx.strokeStyle = color; ctx.lineWidth = width * 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }
  addGradientBorder(canvas, width = 15, colors = ["#4f7fff", "#9b5cff", "#f472b6"]) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    colors.forEach((c, i) => grad.addColorStop(i / Math.max(1, colors.length - 1), c));
    ctx.save(); ctx.strokeStyle = grad; ctx.lineWidth = width * 2; ctx.strokeRect(0, 0, W, H); ctx.restore();
  }
  addRoundedBorder(canvas, radius = 20, color = "#ffffff", width = 8) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(width / 2, width / 2, W - width, H - width, radius); else ctx.rect(width / 2, width / 2, W - width, H - width);
    ctx.stroke(); ctx.restore();
  }
  addShadowBorder(canvas, blur = 20, color = "rgba(0,0,0,0.5)", offsetX = 0, offsetY = 4) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = offsetX; ctx.shadowOffsetY = offsetY;
    ctx.strokeStyle = "transparent"; ctx.strokeRect(blur, blur, W - blur * 2, H - blur * 2); ctx.restore();
  }
  addPolaroidFrame(canvas) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, Math.round(H * 0.04)); ctx.fillRect(0, 0, Math.round(W * 0.04), H); ctx.fillRect(W - Math.round(W * 0.04), 0, Math.round(W * 0.04), H); ctx.fillRect(0, H - Math.round(H * 0.12), W, Math.round(H * 0.12));
    ctx.fillStyle = "#e8e8e8"; ctx.fillRect(Math.round(W * 0.04), Math.round(H * 0.04), W - Math.round(W * 0.08), H - Math.round(H * 0.16));
  }
  addFilmBorder(canvas) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = "#333";
    for (let x = 10; x < W - 20; x += 30) { ctx.fillRect(x, 8, 18, 24); ctx.fillRect(x, H - 32, 18, 24); }
  }
}
export const borderEffectEngine = new BorderEffectEngine();
