/**
 * Wave AI — Image Modification — Image Info Analyzer
 */
export class ImageInfoAnalyzer {
  analyze(canvas) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
    let rSum = 0, gSum = 0, bSum = 0, aSum = 0, pixels = 0;
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; aSum += data[i + 3]; pixels++;
      minR = Math.min(minR, data[i]); maxR = Math.max(maxR, data[i]);
      minG = Math.min(minG, data[i + 1]); maxG = Math.max(maxG, data[i + 1]);
      minB = Math.min(minB, data[i + 2]); maxB = Math.max(maxB, data[i + 2]);
    }
    const avgR = Math.round(rSum / pixels), avgG = Math.round(gSum / pixels), avgB = Math.round(bSum / pixels);
    const avgBrightness = Math.round((avgR + avgG + avgB) / 3);
    return { width: W, height: H, pixels: W * H, aspectRatio: (W / H).toFixed(2), avgColor: { r: avgR, g: avgG, b: avgB, hex: `#${[avgR, avgG, avgB].map(v => v.toString(16).padStart(2, "0")).join("")}` }, avgBrightness, brightness: avgBrightness < 85 ? "dark" : avgBrightness > 170 ? "bright" : "normal", avgAlpha: Math.round(aSum / pixels), colorRange: { r: [minR, maxR], g: [minG, maxG], b: [minB, maxB] }, contrast: Math.round((maxR + maxG + maxB - minR - minG - minB) / 3) };
  }
  getHistogram(canvas) {
    const ctx = canvas.getContext("2d"); const { width: W, height: H } = canvas;
    const data = ctx.getImageData(0, 0, W, H).data;
    const hist = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0), luminance: new Array(256).fill(0) };
    for (let i = 0; i < data.length; i += 4) { hist.r[data[i]]++; hist.g[data[i + 1]]++; hist.b[data[i + 2]]++; hist.luminance[Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])]++; }
    return hist;
  }
}
export const imageInfoAnalyzer = new ImageInfoAnalyzer();
