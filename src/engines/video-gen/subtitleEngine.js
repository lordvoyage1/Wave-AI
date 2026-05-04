/**
 * Wave AI — Video Generation — Subtitle Engine
 * Render subtitles onto video canvas with positioning and styling.
 */
export const SUBTITLE_POSITIONS = { bottom: "bottom", top: "top", center: "center" };

export class SubtitleEngine {
  constructor() {
    this.subtitles = [];
    this.currentIndex = -1;
    this.style = { fontSize: 24, color: "#ffffff", bg: "rgba(0,0,0,0.6)", fontFamily: "Arial", position: "bottom", padding: 8 };
  }

  loadSRT(srtText) {
    const blocks = srtText.trim().split(/\n\n+/);
    this.subtitles = blocks.map(block => {
      const lines = block.split("\n");
      const timing = lines[1]?.match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
      if (!timing) return null;
      return { text: lines.slice(2).join(" "), startMs: this._srtToMs(timing[1]), endMs: this._srtToMs(timing[2]) };
    }).filter(Boolean);
  }

  loadFromTranscript(transcript, durationMs) {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
    const msPerSentence = durationMs / sentences.length;
    this.subtitles = sentences.map((text, i) => ({ text: text.trim(), startMs: i * msPerSentence, endMs: (i + 1) * msPerSentence }));
  }

  getAtTime(ms) {
    return this.subtitles.find(s => ms >= s.startMs && ms <= s.endMs) || null;
  }

  render(ctx, currentMs, canvasWidth, canvasHeight) {
    const sub = this.getAtTime(currentMs);
    if (!sub) return;
    const { fontSize, color, bg, fontFamily, position, padding } = this.style;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textW = ctx.measureText(sub.text).width + padding * 2;
    const textH = fontSize + padding * 2;
    let x = (canvasWidth - textW) / 2;
    let y = position === "top" ? padding : position === "center" ? (canvasHeight - textH) / 2 : canvasHeight - textH - padding * 2;
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, textW, textH, 6);
    else ctx.rect(x, y, textW, textH);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(sub.text, canvasWidth / 2, y + fontSize + padding / 2);
    ctx.textAlign = "left";
  }

  _srtToMs(timeStr) {
    const [h, m, s, ms] = timeStr.split(/[:,]/);
    return parseInt(h) * 3600000 + parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms);
  }

  setStyle(style) { this.style = { ...this.style, ...style }; }
  getSubtitles() { return [...this.subtitles]; }
  clear() { this.subtitles = []; }
  exportSRT() {
    return this.subtitles.map((s, i) => `${i + 1}\n${this._msToSRT(s.startMs)} --> ${this._msToSRT(s.endMs)}\n${s.text}\n`).join("\n");
  }
  _msToSRT(ms) {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), cs = ms % 1000;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(cs).padStart(3, "0")}`;
  }
}
export const subtitleEngine = new SubtitleEngine();
