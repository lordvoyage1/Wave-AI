/**
 * Wave AI — Image Generation — Sketch to Image
 * Convert rough sketches to polished images using HuggingFace ControlNet.
 */
export async function sketchToImage(sketchBlob, prompt, apiKey) {
  if (!apiKey) return { success: false, error: "No API key required for HuggingFace models" };
  try {
    const arrayBuffer = await sketchBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/lllyasviel/sd-controlnet-scribble", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: { image: arrayBuffer, prompt } }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return { success: true, blob, url: URL.createObjectURL(blob), prompt };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export class SketchCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isDrawing = false;
    this.strokeColor = "#000000";
    this.strokeWidth = 3;
    this.history = [];
    this._setup();
  }

  _setup() {
    this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.addEventListener("mousedown", (e) => { this.isDrawing = true; this._startStroke(e); });
    this.canvas.addEventListener("mousemove", (e) => { if (this.isDrawing) this._continueStroke(e); });
    this.canvas.addEventListener("mouseup", () => { this.isDrawing = false; this._endStroke(); });
    this.canvas.addEventListener("touchstart", (e) => { e.preventDefault(); this.isDrawing = true; this._startStroke(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener("touchmove", (e) => { e.preventDefault(); if (this.isDrawing) this._continueStroke(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener("touchend", () => { this.isDrawing = false; this._endStroke(); });
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (this.canvas.width / rect.width), y: (e.clientY - rect.top) * (this.canvas.height / rect.height) };
  }

  _startStroke(e) {
    const pos = this._getPos(e);
    this.ctx.beginPath(); this.ctx.moveTo(pos.x, pos.y);
    this.ctx.strokeStyle = this.strokeColor; this.ctx.lineWidth = this.strokeWidth;
    this.ctx.lineCap = "round"; this.ctx.lineJoin = "round";
  }

  _continueStroke(e) {
    const pos = this._getPos(e);
    this.ctx.lineTo(pos.x, pos.y); this.ctx.stroke();
  }

  _endStroke() { this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)); }

  undo() {
    if (this.history.length > 1) { this.history.pop(); this.ctx.putImageData(this.history[this.history.length - 1], 0, 0); }
    else { this.clear(); }
  }

  clear() { this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.history = []; }
  setColor(color) { this.strokeColor = color; }
  setWidth(width) { this.strokeWidth = width; }
  setEraser() { this.strokeColor = "#ffffff"; this.strokeWidth = 20; }
  getBlob() { return new Promise(r => this.canvas.toBlob(r, "image/png")); }
  getDataURL() { return this.canvas.toDataURL("image/png"); }
}
