/**
 * Wave AI — Video Generation — Credits Roll Renderer
 */
export class CreditsRollRenderer {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async generate(credits = [], options = {}) {
    const { W = 854, H = 480, duration = 10, bg = "#0d1117", titleColor = "#4f7fff", textColor = "#e0e0e0", fontFamily = "Arial" } = options;
    this.canvas.width = W; this.canvas.height = H;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(this.canvas.captureStream(30), { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(100);
    const lineH = 36, padding = 20;
    const totalContent = credits.reduce((h, c) => h + (c.section ? lineH * 1.5 : lineH), lineH) + H;
    const msPerPixel = (duration * 1000) / totalContent;
    await new Promise(resolve => {
      let scrollY = H;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration * 1000) { recorder.stop(); setTimeout(resolve, 200); return; }
        scrollY -= 1;
        this.ctx.fillStyle = bg; this.ctx.fillRect(0, 0, W, H);
        let y = scrollY;
        for (const line of credits) {
          if (y > H + lineH) { y += line.section ? lineH * 1.5 : lineH; continue; }
          if (y < -lineH) { y += line.section ? lineH * 1.5 : lineH; continue; }
          if (line.section) {
            this.ctx.font = `bold 22px ${fontFamily}`;
            this.ctx.fillStyle = titleColor;
            this.ctx.textAlign = "center";
            this.ctx.fillText(line.section, W / 2, y + 20);
            y += lineH * 1.5;
          } else {
            this.ctx.font = `16px ${fontFamily}`;
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = "center";
            this.ctx.fillText(line.text || line, W / 2, y + 16);
            y += lineH;
          }
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
    const blob = new Blob(chunks, { type: mimeType });
    return { blob, url: URL.createObjectURL(blob), duration };
  }
}
export const creditsRollRenderer = new CreditsRollRenderer();
