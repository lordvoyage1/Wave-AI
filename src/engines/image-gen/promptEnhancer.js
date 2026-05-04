/**
 * Wave AI — Image Generation — Prompt Enhancer
 * Transforms basic user prompts into detailed SD-optimized prompts
 * with style keywords, quality boosters, and artistic direction.
 */

export const QUALITY_BOOSTERS = [
  "masterpiece", "best quality", "ultra detailed", "sharp focus",
  "high resolution", "professional", "award winning", "stunning",
];

export const LIGHTING_KEYWORDS = {
  natural: "natural lighting, golden hour, soft light",
  studio: "studio lighting, professional studio, rim light, key light",
  dramatic: "dramatic lighting, chiaroscuro, deep shadows, high contrast",
  neon: "neon lighting, cyberpunk, colorful ambient lighting",
  sunset: "sunset lighting, warm golden tones, long shadows",
  midnight: "moonlight, dark atmosphere, subtle highlights",
  underwater: "underwater caustics, blue-green light, depth",
};

export const SUBJECT_ENHANCERS = {
  person: "beautiful detailed eyes, perfect anatomy, detailed skin texture, realistic hair",
  landscape: "wide angle, vast landscape, atmospheric perspective, detailed foreground",
  architecture: "architectural detail, geometric precision, structural beauty",
  food: "food photography, close-up, bokeh background, appetizing, delicious",
  animal: "wildlife photography, detailed fur/feathers, expressive eyes, natural habitat",
  abstract: "abstract art, flowing forms, color harmony, visual rhythm",
  technology: "sci-fi, futuristic, sleek design, glowing elements, high-tech",
};

export const ARTIST_STYLES = {
  "greg rutkowski": "epic fantasy, detailed, vibrant, atmospheric",
  "artgerm": "stylized, beautiful, polished, character art",
  "wlop": "ethereal, glowing, intricate, soft",
  "van gogh": "post-impressionist, swirling, expressive, colorful",
  "monet": "impressionist, soft colors, light effects, painterly",
  "rembrandt": "baroque, dramatic lighting, rich detail",
  "studio ghibli": "anime, magical, soft colors, detailed backgrounds",
  "banksy": "street art, political, bold, stencil style",
};

export const AFRICAN_SUBJECTS = {
  landscape: "African savanna, acacia trees, Mount Kilimanjaro, Victoria Falls, Nile River, Sahara Desert",
  culture: "African traditional dress, Maasai warriors, Zulu beadwork, Ankara fabric, tribal art",
  wildlife: "African elephant, lion pride, giraffe, zebra herd, flamingos Lake Nakuru",
  cities: "Nairobi skyline, Lagos at night, Cape Town, Cairo, Addis Ababa",
  people: "East African woman, Maasai elder, West African market, Ethiopian runner",
};

export function enhancePrompt(basicPrompt, options = {}) {
  const { style = "photorealistic", lighting = "natural", subject = "general", quality = "high", includeArtist = false, forAfrica = false } = options;
  const parts = [basicPrompt];
  if (forAfrica && detectAfricanContext(basicPrompt)) {
    const context = getAfricanEnhancement(basicPrompt);
    if (context) parts.push(context);
  }
  const subjectKey = detectSubjectType(basicPrompt);
  if (SUBJECT_ENHANCERS[subjectKey]) parts.push(SUBJECT_ENHANCERS[subjectKey]);
  if (LIGHTING_KEYWORDS[lighting]) parts.push(LIGHTING_KEYWORDS[lighting]);
  if (style === "photorealistic") parts.push("photorealistic, RAW photo, DSLR, 85mm lens");
  else if (style === "artistic") parts.push("digital art, artstation, concept art");
  else if (style === "anime") parts.push("anime style, key visual, vibrant");
  else if (style === "cinematic") parts.push("cinematic, movie still, 35mm film");
  if (quality === "high") parts.push(...QUALITY_BOOSTERS.slice(0, 4));
  if (quality === "ultra") parts.push(...QUALITY_BOOSTERS);
  if (includeArtist) {
    const artists = Object.keys(ARTIST_STYLES);
    const artist = artists[Math.floor(Math.random() * artists.length)];
    parts.push(`by ${artist}`);
  }
  return parts.filter(Boolean).join(", ");
}

export function detectSubjectType(prompt) {
  const lower = prompt.toLowerCase();
  if (/person|man|woman|girl|boy|human|face|portrait/.test(lower)) return "person";
  if (/mountain|forest|ocean|beach|river|lake|valley|desert/.test(lower)) return "landscape";
  if (/building|house|city|bridge|tower|palace|castle/.test(lower)) return "architecture";
  if (/food|dish|meal|pizza|burger|cake|coffee/.test(lower)) return "food";
  if (/dog|cat|lion|tiger|bird|elephant|horse/.test(lower)) return "animal";
  if (/robot|computer|phone|tech|cyber|future/.test(lower)) return "technology";
  return "general";
}

export function detectAfricanContext(prompt) {
  const keywords = /africa|kenya|nigeria|ethiopia|tanzania|ghana|zulu|maasai|savanna|kilimanjaro|safari|nairobi|lagos/i;
  return keywords.test(prompt);
}

export function getAfricanEnhancement(prompt) {
  const lower = prompt.toLowerCase();
  if (/safari|wildlife|animal/.test(lower)) return AFRICAN_SUBJECTS.wildlife;
  if (/city|urban|skyline/.test(lower)) return AFRICAN_SUBJECTS.cities;
  if (/culture|tradition|dance|dress/.test(lower)) return AFRICAN_SUBJECTS.culture;
  if (/landscape|nature|scenery/.test(lower)) return AFRICAN_SUBJECTS.landscape;
  return AFRICAN_SUBJECTS.people;
}

export function generateVariations(prompt, count = 4) {
  const styles = Object.keys(LIGHTING_KEYWORDS);
  return Array.from({ length: count }, (_, i) => ({
    prompt: enhancePrompt(prompt, { lighting: styles[i % styles.length], quality: "high" }),
    seed: Math.floor(Math.random() * 2147483647),
    variant: i + 1,
  }));
}

export function buildNegativePrompt(type = "default", extra = "") {
  const base = {
    default: "blurry, distorted, deformed, ugly, low quality, watermark, text, signature, duplicate, bad anatomy",
    portrait: "blurry face, cross-eyed, bad teeth, distorted face, extra limbs, deformed hands, watermark",
    landscape: "blurry, oversaturated, washed out, low detail, ugly sky, poor composition",
    art: "photo, photorealistic, ugly, low quality, boring, dull",
  };
  return [base[type] || base.default, extra].filter(Boolean).join(", ");
}

export function estimateGenerationTime(model, steps = 30) {
  const baseTimes = {
    "stable-diffusion-xl": 45,
    "stable-diffusion-2": 25,
    "dreamshaper": 20,
    "realistic-vision": 22,
    "anything-v5": 18,
  };
  const base = baseTimes[model] || 30;
  return Math.round(base * (steps / 30));
}
