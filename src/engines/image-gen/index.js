/**
 * Wave AI — Image Generation Engine Index
 */
export * from "./core.js";
export * from "./promptEnhancer.js";
export * from "./gallery.js";
export * from "./styleTransfer.js";
export * from "./imageSearch.js";

export async function generateImage(prompt, options = {}) {
  const { generateImageHuggingFace, generateImageFallback } = await import("./core.js");
  const { enhancePrompt } = await import("./promptEnhancer.js");
  const enhanced = options.enhance !== false ? enhancePrompt(prompt, options) : prompt;
  const hfResult = await generateImageHuggingFace(enhanced, { ...options, prompt: enhanced });
  if (hfResult.success) return hfResult;
  return generateImageFallback(prompt);
}
