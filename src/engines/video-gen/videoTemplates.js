/**
 * Wave AI — Video Generation — Video Templates Library
 */
export const VIDEO_TEMPLATES = {
  product_showcase: {
    name: "Product Showcase",
    description: "Elegant product presentation with zoom-in and slide effects",
    scenes: ["intro", "product_closeup", "features", "call_to_action"],
    defaultDuration: 30,
    style: "cinematic",
    suggestedMusic: "upbeat corporate",
  },
  social_story: {
    name: "Social Story",
    description: "Vertical 9:16 format for Instagram/TikTok stories",
    width: 1080, height: 1920,
    defaultDuration: 15,
    style: "vibrant",
  },
  youtube_intro: {
    name: "YouTube Intro",
    description: "Dynamic channel intro with logo animation",
    defaultDuration: 5,
    style: "energetic",
    elements: ["logo", "channel_name", "subscribe_button"],
  },
  news_report: {
    name: "News Report",
    description: "Professional news broadcast style",
    defaultDuration: 60,
    style: "professional",
    elements: ["lower_third", "ticker", "anchor_box"],
  },
  photo_slideshow: {
    name: "Photo Slideshow",
    description: "Ken Burns effect slideshow with music sync",
    defaultDuration: 60,
    defaultTransition: "fade",
    style: "elegant",
  },
  countdown_timer: {
    name: "Countdown Timer",
    description: "Animated countdown for events and launches",
    defaultDuration: 10,
    style: "dramatic",
  },
  wave_ai_presentation: {
    name: "Wave AI Presentation",
    description: "Professional Wave AI branded presentation",
    width: 1920, height: 1080,
    defaultDuration: 45,
    style: "wave",
    branding: { primary: "#4f7fff", secondary: "#9b5cff", accent: "#f472b6" },
  },
  documentary: {
    name: "Documentary",
    description: "Cinematic documentary with narration and B-roll",
    defaultDuration: 120,
    style: "cinematic",
    suggestedFont: "Georgia",
  },
};

export function getTemplate(name) { return VIDEO_TEMPLATES[name] || null; }
export function getAllTemplates() { return Object.entries(VIDEO_TEMPLATES).map(([id, t]) => ({ id, ...t })); }
export function getTemplatesByStyle(style) { return getAllTemplates().filter(t => t.style === style); }
