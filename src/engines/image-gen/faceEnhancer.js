/**
 * Wave AI — Image Generation — Face Enhancer
 * Portrait enhancement using HuggingFace CodeFormer/GFPGAN.
 */
export async function enhanceFace(imageBlob, apiKey) {
  if (!apiKey) return { success: false, error: "No API key" };
  try {
    const ab = await imageBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/sczhou/CodeFormer", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/png" },
      body: ab,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return { success: true, blob, url: URL.createObjectURL(blob) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function beautifyPortrait(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.filter = "brightness(105%) contrast(95%) saturate(110%)";
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imageData, 0, 0);
  ctx.filter = "none";
  return canvas.toDataURL("image/png");
}
