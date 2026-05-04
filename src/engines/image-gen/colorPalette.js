/**
 * Wave AI — Image Generation — Color Palette Engine
 * Extract dominant colors, generate harmonious palettes,
 * and analyze color composition from images.
 */

export const COLOR_HARMONIES = {
  complementary: (hue) => [hue, (hue + 180) % 360],
  triadic: (hue) => [hue, (hue + 120) % 360, (hue + 240) % 360],
  analogous: (hue) => [hue, (hue + 30) % 360, (hue - 30 + 360) % 360],
  tetradic: (hue) => [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360],
  splitComplementary: (hue) => [hue, (hue + 150) % 360, (hue + 210) % 360],
};

export const PRESET_PALETTES = {
  "Wave Blue": ["#4f7fff", "#6b8fff", "#9b5cff", "#c084fc", "#f472b6"],
  "African Sunset": ["#ff6b35", "#f7c59f", "#efefd0", "#004e89", "#1a936f"],
  "Savanna Gold": ["#d4a017", "#8b6914", "#5c4a1e", "#c8a96e", "#2d1b00"],
  "Ocean Depth": ["#0077b6", "#00b4d8", "#90e0ef", "#caf0f8", "#023e8a"],
  "Forest Green": ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
  "Desert Rose": ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#264653"],
  "Neon City": ["#ff006e", "#8338ec", "#3a86ff", "#06d6a0", "#ffbe0b"],
  "Monochrome": ["#000000", "#333333", "#666666", "#999999", "#cccccc"],
};

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

export function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

export function generateHarmoniousPalette(baseColor, harmony = "triadic", count = 5) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return Object.values(PRESET_PALETTES)[0];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const harmonyFn = COLOR_HARMONIES[harmony] || COLOR_HARMONIES.triadic;
  const hues = harmonyFn(hsl.h);
  const palette = [];
  for (let i = 0; i < count; i++) {
    const hue = hues[i % hues.length];
    const lightness = 30 + (i * 12) % 50;
    const saturation = Math.max(30, Math.min(90, hsl.s + (i % 2 === 0 ? 10 : -10)));
    const { r, g, b } = hslToRgb(hue, saturation, lightness);
    palette.push(rgbToHex(r, g, b));
  }
  return palette;
}

export async function extractDominantColors(imageUrl, colorCount = 5) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixels = [];
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i + 3] < 128) continue;
        pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
      }
      const colors = kMeans(pixels, colorCount);
      resolve(colors.map(c => ({ hex: rgbToHex(...c), rgb: { r: c[0], g: c[1], b: c[2] }, hsl: rgbToHsl(...c) })));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function kMeans(pixels, k, iterations = 10) {
  if (pixels.length < k) return pixels.slice(0, k).map(p => p);
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) centroids.push([...pixels[i * step]]);
  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    for (const pixel of pixels) {
      let minDist = Infinity, closest = 0;
      for (let c = 0; c < k; c++) {
        const dist = Math.sqrt(centroids[c].reduce((s, v, i) => s + (v - pixel[i]) ** 2, 0));
        if (dist < minDist) { minDist = dist; closest = c; }
      }
      clusters[closest].push(pixel);
    }
    centroids = clusters.map(cluster => {
      if (cluster.length === 0) return [128, 128, 128];
      return [0, 1, 2].map(i => Math.round(cluster.reduce((s, p) => s + p[i], 0) / cluster.length));
    });
  }
  return centroids;
}

export function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function suggestImageColors(prompt) {
  const lower = prompt.toLowerCase();
  if (/sunset|sunrise|warm|golden|amber/.test(lower)) return PRESET_PALETTES["African Sunset"];
  if (/ocean|sea|water|blue|sky/.test(lower)) return PRESET_PALETTES["Ocean Depth"];
  if (/forest|nature|green|tree|jungle/.test(lower)) return PRESET_PALETTES["Forest Green"];
  if (/neon|city|night|glow|cyber/.test(lower)) return PRESET_PALETTES["Neon City"];
  if (/desert|sand|dry|earth/.test(lower)) return PRESET_PALETTES["Savanna Gold"];
  return PRESET_PALETTES["Wave Blue"];
}
