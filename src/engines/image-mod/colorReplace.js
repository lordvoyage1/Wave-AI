/**
 * Wave AI — Image Modification — Color Replacer
 */
export class ColorReplacer {
  replaceColor(canvas, targetColor, replacementColor, tolerance = 30) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    const [tr, tg, tb] = this._hexToRgb(targetColor); const [rr, rg, rb] = this._hexToRgb(replacementColor);
    let replaced = 0;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - tr, dg = data[i + 1] - tg, db = data[i + 2] - tb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist <= tolerance) { data[i] = rr; data[i + 1] = rg; data[i + 2] = rb; replaced++; }
    }
    ctx.putImageData(imageData, 0, 0);
    return { replaced, percentage: ((replaced / (W * H)) * 100).toFixed(1) };
  }
  shiftHue(canvas, degrees) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    const rad = (degrees * Math.PI) / 180; const cos = Math.cos(rad), sin = Math.sin(rad);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.max(0, Math.min(255, r * (cos + (1 - cos) / 3) + g * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin) + b * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin)));
      data[i + 1] = Math.max(0, Math.min(255, r * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin) + g * (cos + (1 - cos) / 3) + b * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin)));
      data[i + 2] = Math.max(0, Math.min(255, r * ((1 - cos) / 3 - Math.sqrt(1 / 3) * sin) + g * ((1 - cos) / 3 + Math.sqrt(1 / 3) * sin) + b * (cos + (1 - cos) / 3)));
    }
    ctx.putImageData(imageData, 0, 0);
  }
  selectByColor(canvas, targetColor, tolerance = 20) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    const [tr, tg, tb] = this._hexToRgb(targetColor); const selected = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dist = Math.sqrt((data[i] - tr) ** 2 + (data[i + 1] - tg) ** 2 + (data[i + 2] - tb) ** 2);
      if (dist <= tolerance) selected.push({ x, y });
    }
    return selected;
  }
  _hexToRgb(hex) { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0]; }
}
export const colorReplacer = new ColorReplacer();
