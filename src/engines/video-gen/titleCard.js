/**
 * Wave AI — Video Generation — Title Card Renderer
 */
export const TITLE_STYLES = {
  minimal: { bg: "#0d1117", titleColor: "#ffffff", subtitleColor: "#4f7fff", font: "Arial" },
  bold: { bg: "#000000", titleColor: "#ffcc00", subtitleColor: "#ffffff", font: "Impact" },
  elegant: { bg: "#1a1a2e", titleColor: "#e0e0e0", subtitleColor: "#9b5cff", font: "Georgia" },
  wave: { bg: "linear", titleColor: "#ffffff", subtitleColor: "#f472b6", font: "Arial" },
  news: { bg: "#003087", titleColor: "#ffffff", subtitleColor: "#ffcc00", font: "Arial" },
};

export class TitleCardRenderer {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  render(W, H, options = {}) {
    const { title = "Wave AI", subtitle = "", style = "wave", author, duration = 3 } = options;
    this.canvas.width = W; this.canvas.height = H;
    const ctx = this.ctx;
    const s = TITLE_STYLES[style] || TITLE_STYLES.wave;
    if (s.bg === "linear") {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#0d1117"); grad.addColorStop(0.5, "#1a0a2e"); grad.addColorStop(1, "#0d1117");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = s.bg;
    }
    ctx.fillRect(0, 0, W, H);
    if (style === "wave") {
      ctx.strokeStyle = "rgba(79,127,255,0.2)"; ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 5) ctx[x === 0 ? "moveTo" : "lineTo"](x, H / 2 + Math.sin((x / W) * Math.PI * 4 + i * 0.5) * (20 + i * 8));
        ctx.stroke();
      }
    }
    const titleSize = Math.min(W * 0.08, 80);
    ctx.font = `bold ${titleSize}px ${s.font}`;
    ctx.fillStyle = s.titleColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(79,127,255,0.5)"; ctx.shadowBlur = 20;
    ctx.fillText(title, W / 2, H / 2 - (subtitle ? titleSize * 0.7 : 0));
    ctx.shadowBlur = 0;
    if (subtitle) {
      ctx.font = `${Math.round(titleSize * 0.45)}px ${s.font}`;
      ctx.fillStyle = s.subtitleColor;
      ctx.fillText(subtitle, W / 2, H / 2 + titleSize * 0.6);
    }
    if (author) {
      ctx.font = `${Math.round(titleSize * 0.35)}px ${s.font}`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`by ${author}`, W / 2, H - 40);
    }
    return { canvas: this.canvas, dataURL: this.canvas.toDataURL() };
  }

  async toVideoSegment(W, H, options = {}) {
    const { duration = 3 } = options;
    this.render(W, H, options);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(this.canvas.captureStream(1), { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start();
    await new Promise(r => setTimeout(r, duration * 1000));
    recorder.stop();
    await new Promise(r => { recorder.onstop = r; });
    const blob = new Blob(chunks, { type: mimeType });
    return { blob, url: URL.createObjectURL(blob), duration };
  }
}
export const titleCardRenderer = new TitleCardRenderer();
