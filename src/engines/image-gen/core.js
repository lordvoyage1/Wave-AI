/**
 * Wave AI — Image Generation Engine Core
 * HuggingFace Inference API + free public image services.
 * Supports text-to-image, style transfer, and prompt enhancement.
 */

export const IMAGE_MODELS = {
  "stable-diffusion-xl": { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "SDXL", quality: "★★★★★", speed: "slow", free: true },
  "stable-diffusion-2": { id: "stabilityai/stable-diffusion-2-1", name: "SD 2.1", quality: "★★★★", speed: "medium", free: true },
  "dreamshaper": { id: "Lykon/dreamshaper-8", name: "DreamShaper", quality: "★★★★★", speed: "medium", free: true },
  "anything-v5": { id: "stablediffusionapi/anything-v5", name: "Anything v5", quality: "★★★★", speed: "fast", free: true },
  "openjourney": { id: "prompthero/openjourney", name: "OpenJourney", quality: "★★★★", speed: "medium", free: true },
  "realistic-vision": { id: "SG161222/Realistic_Vision_V6.0_B1_noVAE", name: "Realistic Vision", quality: "★★★★★", speed: "medium", free: true },
  "midjourney-v4": { id: "prompthero/openjourney-v4", name: "MJ Style", quality: "★★★★", speed: "medium", free: true },
  "anime": { id: "hakurei/waifu-diffusion", name: "Anime Style", quality: "★★★★", speed: "fast", free: true },
};

export const SIZES = {
  square: { width: 512, height: 512, label: "Square (512×512)" },
  portrait: { width: 512, height: 768, label: "Portrait (512×768)" },
  landscape: { width: 768, height: 512, label: "Landscape (768×512)" },
  wide: { width: 1024, height: 576, label: "Widescreen (1024×576)" },
  xlSquare: { width: 1024, height: 1024, label: "XL Square (1024×1024)" },
  xlPortrait: { width: 832, height: 1216, label: "XL Portrait (832×1216)" },
};

export const STYLES = {
  photorealistic: "photorealistic, ultra detailed, 8k, professional photography, DSLR, sharp focus",
  artistic: "digital art, artstation, concept art, highly detailed, vibrant colors",
  anime: "anime style, manga art, detailed, vibrant, studio quality",
  cinematic: "cinematic lighting, movie still, dramatic, film grain, shallow depth of field",
  oilPainting: "oil painting, impasto, painterly, rich textures, masterpiece",
  watercolor: "watercolor painting, soft edges, delicate, flowing colors, artistic",
  sketch: "pencil sketch, charcoal drawing, detailed lines, monochrome",
  pixelArt: "pixel art, 16-bit, retro game style, crisp pixels",
  "3d": "3D render, octane render, blender, photorealistic, ray traced",
  fantasy: "fantasy art, epic, magical, ethereal, highly detailed",
};

export const NEGATIVE_PROMPTS = {
  default: "blurry, distorted, deformed, ugly, low quality, pixelated, watermark, text, signature, cropped",
  portrait: "blurry face, distorted face, deformed, extra limbs, bad anatomy, extra fingers, watermark",
  landscape: "blurry, distorted, oversaturated, ugly, low quality",
  anime: "realistic, photo, 3d render, blurry, deformed, extra limbs",
};

export async function generateImageHuggingFace(prompt, options = {}) {
  const apiKey = options.apiKey || import.meta?.env?.VITE_HF_API_KEY;
  if (!apiKey) return { success: false, error: "No HuggingFace API key", useFallback: true };
  const modelId = options.modelId || IMAGE_MODELS["stable-diffusion-xl"].id;
  const negativePrompt = options.negativePrompt || NEGATIVE_PROMPTS.default;
  const fullPrompt = options.style ? `${prompt}, ${STYLES[options.style] || ""}` : prompt;
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          negative_prompt: negativePrompt,
          num_inference_steps: options.steps || 30,
          guidance_scale: options.guidanceScale || 7.5,
          width: options.width || 512,
          height: options.height || 512,
          seed: options.seed || Math.floor(Math.random() * 2147483647),
        },
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (err.error?.includes("loading")) return { success: false, error: "Model is loading, please retry in 20s", loading: true };
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { success: true, url, blob, prompt: fullPrompt, model: modelId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function generateImageFallback(prompt, style = "") {
  const sources = await Promise.allSettled([
    fetchUnsplashImage(prompt),
    fetchPexelsImage(prompt),
  ]);
  for (const result of sources) {
    if (result.status === "fulfilled" && result.value.success) return result.value;
  }
  return { success: false, error: "Could not generate image from any source" };
}

export async function fetchUnsplashImage(query) {
  try {
    const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
    return { success: true, url, source: "Unsplash", query };
  } catch { return { success: false }; }
}

export async function fetchPexelsImage(query) {
  try {
    const url = `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(query)}&sig=${Date.now()}`;
    return { success: true, url, source: "Unsplash Featured", query };
  } catch { return { success: false }; }
}
