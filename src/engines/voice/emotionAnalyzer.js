/**
 * Wave AI — Voice Chat — Emotion Analyzer
 * Detect emotion from speech text and audio features.
 */
export const EMOTION_KEYWORDS = {
  joy: { words: ["happy", "great", "wonderful", "amazing", "love", "excellent", "fantastic", "perfect", "awesome", "excited"], weight: 1 },
  sadness: { words: ["sad", "unhappy", "depressed", "lonely", "miss", "lost", "grief", "cry", "hurt", "pain"], weight: 1 },
  anger: { words: ["angry", "furious", "hate", "terrible", "worst", "awful", "disgusting", "annoying", "frustrated", "mad"], weight: 1 },
  fear: { words: ["scared", "afraid", "terrified", "anxious", "nervous", "worried", "stress", "panic", "overwhelmed"], weight: 1 },
  surprise: { words: ["wow", "omg", "shocking", "unexpected", "incredible", "unbelievable", "really", "serious", "whoa"], weight: 0.7 },
  neutral: { words: ["okay", "fine", "alright", "sure", "maybe", "perhaps", "possibly", "could", "would"], weight: 0.5 },
};

export function detectTextEmotion(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS)) {
    let score = 0;
    for (const word of config.words) { if (lower.includes(word)) score += config.weight; }
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    if (emotion === "joy" || emotion === "surprise") score += exclamations * 0.3;
    if (emotion === "fear" || emotion === "sadness") score += questions * 0.1;
    scores[emotion] = score;
  }
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    dominant: dominant[0],
    confidence: total > 0 ? Math.min(1, dominant[1] / total * 2) : 0.5,
    scores,
    intensity: total > 3 ? "high" : total > 1 ? "medium" : "low",
  };
}

export function detectAudioEmotion(audioFeatures) {
  const { pitch, speed, volume, variability } = audioFeatures || {};
  if (!pitch) return { dominant: "neutral", confidence: 0.5 };
  const excited = pitch > 250 && speed > 1.1 && volume > 70;
  const sad = pitch < 150 && speed < 0.9 && volume < 50;
  const angry = pitch > 200 && variability > 0.4 && volume > 75;
  const fearful = variability > 0.5 && speed > 1.05;
  if (angry) return { dominant: "anger", confidence: 0.75 };
  if (excited) return { dominant: "joy", confidence: 0.7 };
  if (sad) return { dominant: "sadness", confidence: 0.7 };
  if (fearful) return { dominant: "fear", confidence: 0.65 };
  return { dominant: "neutral", confidence: 0.6 };
}

export function getEmotionalResponse(emotion) {
  const responses = {
    joy: ["That's wonderful to hear! Your positive energy is contagious! 😊", "I love your enthusiasm! ", "So happy to hear that!"],
    sadness: ["I'm so sorry you're feeling that way. Would you like to talk about it?", "That sounds really difficult. I'm here with you.", "It's okay to feel sad. Take all the time you need."],
    anger: ["I understand you're frustrated. Let me help sort this out.", "That does sound very frustrating. Let's work through this together.", "I hear your frustration. Let's see what we can do."],
    fear: ["Take a deep breath. You're safe here, and I'll help you through this.", "It's okay to feel anxious. Let's tackle this step by step.", "I understand this feels overwhelming. We'll figure it out together."],
    surprise: ["Oh wow! That is surprising! Tell me more!", "I didn't expect that either! What happened next?"],
    neutral: ["I understand. How can I help you further?", "Got it! What else would you like to know?"],
  };
  const options = responses[emotion] || responses.neutral;
  return options[Math.floor(Math.random() * options.length)];
}
