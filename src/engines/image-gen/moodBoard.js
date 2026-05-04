/**
 * Wave AI — Image Generation — Mood Board Creator
 * Create mood boards from internet images based on themes.
 */
import { searchImages } from "./imageSearch.js";

export const MOOD_THEMES = {
  "Motivation": ["success", "achievement", "mountain top", "sunrise", "determination"],
  "African Pride": ["Africa landscape", "African culture", "savanna", "African art", "Nairobi"],
  "Technology": ["artificial intelligence", "futuristic city", "circuit board", "robot", "code"],
  "Nature": ["forest", "ocean", "mountain", "waterfall", "wildlife"],
  "Fashion": ["style", "elegant fashion", "street fashion", "design", "couture"],
  "Food": ["gourmet food", "street food", "fresh vegetables", "coffee", "dessert"],
  "Travel": ["travel", "adventure", "landmark", "culture", "explore"],
  "Wellness": ["meditation", "yoga", "nature walk", "healthy food", "peace"],
};

export async function createMoodBoard(theme, imageCount = 6) {
  const keywords = MOOD_THEMES[theme] || [theme];
  const images = [];
  for (const keyword of keywords.slice(0, imageCount)) {
    const results = await searchImages(keyword, "unsplash", 1);
    if (results[0]) images.push({ ...results[0], keyword });
  }
  return { theme, images, count: images.length, createdAt: new Date().toISOString() };
}

export async function generateMoodBoardCanvas(images, options = {}) {
  const { width = 900, height = 600, cols = 3 } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, width, height);
  const rows = Math.ceil(images.length / cols);
  const cellW = Math.floor(width / cols), cellH = Math.floor(height / rows);
  const loadImg = (src) => new Promise((res) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = () => res(null); img.src = src;
  });
  await Promise.all(images.map(async (imgData, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = col * cellW + 2, y = row * cellH + 2;
    const w = cellW - 4, h = cellH - 4;
    const img = imgData?.url ? await loadImg(imgData.url) : null;
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(x, y, w, h);
    }
  }));
  return { dataURL: canvas.toDataURL("image/jpeg", 0.92), canvas };
}
