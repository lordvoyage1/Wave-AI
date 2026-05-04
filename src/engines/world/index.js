/**
 * Wave AI — World Knowledge Engine Index
 * Central hub for all world knowledge modules.
 * Provides unified query interface for any topic.
 */

export * from "./worldConcepts.js";
export * from "./humanPersonality.js";
export * from "./education.js";
export * from "./entertainment.js";
export * from "./foodCulture.js";
export * from "./newsClimate.js";
export * from "./scienceTech.js";

const TOPIC_MAP = {
  world: () => import("./worldConcepts.js"),
  geography: () => import("./worldConcepts.js"),
  nature: () => import("./worldConcepts.js"),
  personality: () => import("./humanPersonality.js"),
  psychology: () => import("./humanPersonality.js"),
  emotions: () => import("./humanPersonality.js"),
  education: () => import("./education.js"),
  learning: () => import("./education.js"),
  career: () => import("./education.js"),
  entertainment: () => import("./entertainment.js"),
  movies: () => import("./entertainment.js"),
  music: () => import("./entertainment.js"),
  sports: () => import("./entertainment.js"),
  games: () => import("./entertainment.js"),
  food: () => import("./foodCulture.js"),
  culture: () => import("./foodCulture.js"),
  religion: () => import("./foodCulture.js"),
  traditions: () => import("./foodCulture.js"),
  news: () => import("./newsClimate.js"),
  climate: () => import("./newsClimate.js"),
  weather: () => import("./newsClimate.js"),
  environment: () => import("./newsClimate.js"),
  science: () => import("./scienceTech.js"),
  technology: () => import("./scienceTech.js"),
  ai: () => import("./scienceTech.js"),
  space: () => import("./scienceTech.js"),
};

export async function queryWorldKnowledge(topic, query = "") {
  const key = Object.keys(TOPIC_MAP).find(k => topic.toLowerCase().includes(k));
  if (!key) return { topic, answer: `I have broad knowledge about ${topic}. ${query ? `Regarding "${query}": ` : ""}This covers fascinating global perspectives.` };
  const module = await TOPIC_MAP[key]();
  return { topic, module: key, loaded: true };
}

export function detectWorldKnowledgeTopic(text) {
  const lower = text.toLowerCase();
  const topics = Object.keys(TOPIC_MAP);
  const detected = topics.filter(t => lower.includes(t));
  return detected.length > 0 ? detected[0] : null;
}

export async function getContextualWorldInfo(userMessage) {
  const topic = detectWorldKnowledgeTopic(userMessage);
  if (!topic) return null;
  
  const contextMap = {
    news: async () => { const { fetchLatestNews } = await import("./newsClimate.js"); return await fetchLatestNews("world", 3); },
    weather: async () => {
      const cityMatch = userMessage.match(/weather (?:in|at|for) ([a-z\s]+)/i);
      if (cityMatch) { const { getWeatherData } = await import("./newsClimate.js"); return await getWeatherData(cityMatch[1]); }
      return null;
    },
    climate: async () => { const { CLIMATE_SCIENCE, getClimateActionTip } = await import("./newsClimate.js"); return { ...CLIMATE_SCIENCE.basics, tip: getClimateActionTip() }; },
    food: async () => {
      const countryMatch = userMessage.match(/food (?:in|from|of) ([a-z\s]+)/i);
      if (countryMatch) { const { getFoodRecommendation } = await import("./foodCulture.js"); return getFoodRecommendation(countryMatch[1]); }
      return null;
    },
    personality: async () => { const { getMoodAdvice } = await import("./humanPersonality.js"); return getMoodAdvice(userMessage); },
    movies: async () => { const { recommendMovie } = await import("./entertainment.js"); return recommendMovie(userMessage); },
    science: async () => { const { explainScientificConcept } = await import("./scienceTech.js"); return explainScientificConcept(userMessage); },
  };
  
  const handler = contextMap[topic];
  if (handler) {
    try { return await handler(); }
    catch { return null; }
  }
  return null;
}
