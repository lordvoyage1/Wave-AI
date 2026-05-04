/**
 * Wave AI — Image Modification — AI Photo Enhancer
 */
export async function enhancePhoto(imageBlob, apiKey, enhancementType = "general") {
  const models = { general: "microsoft/swin2SR-classical-sr-x4-64", face: "sczhou/CodeFormer", upscale: "caidas/swin2SR-classical-sr-x4-64" };
  const modelId = models[enhancementType] || models.general;
  if (!apiKey) return { success: false, error: "No API key", blob: imageBlob };
  try {
    const ab = await imageBlob.arrayBuffer();
    const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, { method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/jpeg" }, body: ab });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return { success: true, blob, url: URL.createObjectURL(blob) };
  } catch (err) { return { success: false, error: err.message, blob: imageBlob }; }
}

export async function autoEnhance(canvas) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const imageData = ctx.getImageData(0, 0, W, H); const data = imageData.data;
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  const avgBrightness = totalBrightness / (data.length / 4);
  const brightnessAdj = avgBrightness < 100 ? 30 : avgBrightness > 180 ? -20 : 10;
  const contrastFactor = (259 * (1.1 * 255)) / (255 * (259 - 1.1 * 255));
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c] + brightnessAdj;
      v = Math.max(0, Math.min(255, contrastFactor * (v - 128) + 128));
      data[i + c] = v;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function getEnhancementSuggestions(imageStats) {
  const suggestions = [];
  if ((imageStats.avgBrightness || 128) < 80) suggestions.push({ type: "brightness", amount: 40, reason: "Image is too dark" });
  if ((imageStats.avgBrightness || 128) > 200) suggestions.push({ type: "brightness", amount: -30, reason: "Image is overexposed" });
  if ((imageStats.contrast || 1) < 0.5) suggestions.push({ type: "contrast", amount: 30, reason: "Low contrast detected" });
  if ((imageStats.saturation || 1) < 0.6) suggestions.push({ type: "saturation", amount: 1.3, reason: "Colors appear faded" });
  return suggestions.length ? suggestions : [{ type: "none", reason: "Image looks well-balanced!" }];
}
