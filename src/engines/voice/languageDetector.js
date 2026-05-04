/**
 * Wave AI — Voice Chat — Language Detector
 */
export const LANGUAGE_PATTERNS = {
  sw: { pattern: /\b(habari|asante|karibu|tafadhali|ndiyo|hapana|jambo|sawa|pole|haraka|kwaheri|rafiki|chakula|maji|nyumba|shule|kazi)\b/i, name: "Swahili", code: "sw-KE" },
  fr: { pattern: /\b(bonjour|merci|oui|non|je|tu|nous|vous|est|avec|dans|pour|une|les|des|pas|mais|comme|qui)\b/i, name: "French", code: "fr-FR" },
  es: { pattern: /\b(hola|gracias|sí|no|el|la|los|las|un|una|de|en|con|por|para|que|muy|bien|como|este|esta)\b/i, name: "Spanish", code: "es-ES" },
  ar: { pattern: /[\u0600-\u06ff]/, name: "Arabic", code: "ar-SA" },
  zh: { pattern: /[\u4e00-\u9fff]/, name: "Chinese", code: "zh-CN" },
  hi: { pattern: /[\u0900-\u097f]/, name: "Hindi", code: "hi-IN" },
  pt: { pattern: /\b(obrigado|sim|não|é|está|isso|como|para|que|uma|dos|das)\b/i, name: "Portuguese", code: "pt-BR" },
  de: { pattern: /\b(danke|bitte|ja|nein|ich|du|wir|sie|ist|sind|und|für|mit|das|die|der)\b/i, name: "German", code: "de-DE" },
  yo: { pattern: /\b(bawo|dáadáa|ẹẹ|bẹẹni|owó|ilé|àgbàdo)\b/i, name: "Yoruba", code: "yo-NG" },
  ha: { pattern: /\b(sannu|nagode|ee|a'a|gida|ruwa|abinci|makaranta)\b/i, name: "Hausa", code: "ha-NG" },
  am: { pattern: /[\u1200-\u137f]/, name: "Amharic", code: "am-ET" },
  en: { pattern: /\b(the|is|are|was|were|will|have|has|had|this|that|with|from|they|what|when|where|how|why|who|which)\b/i, name: "English", code: "en-US" },
};

export function detectLanguage(text) {
  if (!text || text.trim().length < 5) return { code: "en-US", name: "English", confidence: 0.5 };
  const scores = {};
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = (text.match(config.pattern) || []).length;
    const words = text.split(/\s+/).length;
    scores[lang] = matches / Math.max(1, words);
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return { code: "en-US", name: "English", confidence: 0.5 };
  const config = LANGUAGE_PATTERNS[best[0]];
  return { code: config.code, name: config.name, confidence: Math.min(1, best[1] * 10), lang: best[0] };
}

export function detectAndSuggestVoice(text, availableVoices = []) {
  const detected = detectLanguage(text);
  const bestVoice = availableVoices.find(v => v.lang?.toLowerCase().startsWith(detected.code.toLowerCase().split("-")[0]));
  return { detected, suggestedVoice: bestVoice || null };
}

export function isMultilingual(text) {
  const detections = text.split(".").filter(s => s.trim().length > 10).map(s => detectLanguage(s));
  const langs = new Set(detections.map(d => d.lang));
  return langs.size > 1;
}

export function getLanguageGreeting(code) {
  const greetings = { "en": "Hello! How can I help you?", "sw": "Habari! Naweza kukusaidia vipi?", "fr": "Bonjour! Comment puis-je vous aider?", "ar": "مرحبا! كيف يمكنني مساعدتك؟", "zh": "你好！我能帮你什么？", "hi": "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?", "yo": "Ẹ káàbọ̀! Báwo ni mo ṣe lè ràn ọ́ lọ́wọ́?", "am": "ሰላም! እንዴት ልርዳዎ?" };
  const base = code.split("-")[0];
  return greetings[base] || greetings.en;
}
