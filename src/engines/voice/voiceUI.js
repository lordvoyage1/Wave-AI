/**
 * Wave AI — Voice Chat — Voice UI Helpers
 * Utility functions for building voice chat UI components.
 */
export const VOICE_STATES = {
  idle: { icon: "🎤", color: "#94a3b8", label: "Tap to speak", animate: false },
  listening: { icon: "👂", color: "#f472b6", label: "Listening...", animate: true },
  processing: { icon: "⚡", color: "#9b5cff", label: "Processing...", animate: true },
  speaking: { icon: "🔊", color: "#4f7fff", label: "Speaking...", animate: true },
  error: { icon: "⚠️", color: "#ef4444", label: "Error", animate: false },
};

export function getStateConfig(state) { return VOICE_STATES[state] || VOICE_STATES.idle; }

export function formatVoiceTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function buildVoiceWaveform(levels = [], maxBars = 20) {
  const normalized = levels.slice(-maxBars).map(l => Math.max(0.05, Math.min(1, l / 100)));
  while (normalized.length < maxBars) normalized.unshift(0.05);
  return normalized;
}

export function calculateVoiceScore(stats) {
  const { avgWPM = 140, clarity = 0.8, fillerWords = 0, pauseCount = 0, totalWords = 100 } = stats;
  let score = 100;
  if (avgWPM < 100 || avgWPM > 200) score -= 15;
  if (clarity < 0.7) score -= 20;
  const fillerRatio = fillerWords / Math.max(1, totalWords);
  if (fillerRatio > 0.1) score -= Math.round(fillerRatio * 50);
  if (pauseCount > 10) score -= Math.min(20, pauseCount - 10);
  return Math.max(0, Math.min(100, score));
}

export const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "so yeah", "i mean", "right", "okay so"];

export function countFillerWords(transcript) {
  const lower = transcript.toLowerCase();
  return FILLER_WORDS.reduce((count, filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    return count + (lower.match(regex) || []).length;
  }, 0);
}

export function getVoiceQualityLabel(score) {
  if (score >= 90) return { label: "Excellent", color: "#22c55e", emoji: "🌟" };
  if (score >= 75) return { label: "Good", color: "#84cc16", emoji: "👍" };
  if (score >= 60) return { label: "Fair", color: "#f59e0b", emoji: "👌" };
  return { label: "Needs Improvement", color: "#ef4444", emoji: "📈" };
}

export function generateVoiceTips(stats) {
  const tips = [];
  if ((stats.avgWPM || 140) > 180) tips.push("Try slowing down — you might be hard to follow.");
  if ((stats.avgWPM || 140) < 100) tips.push("Speed up slightly for a more natural pace.");
  if ((stats.fillerWords || 0) > 5) tips.push("Reduce filler words like 'um', 'uh', 'like'.");
  if ((stats.pauseCount || 0) > 15) tips.push("Try to reduce unnecessary pauses.");
  if (!tips.length) tips.push("Great voice quality! Keep it up! 🎉");
  return tips;
}
