/**
 * Wave AI — Voice Chat — Conversation Summarizer
 */
import { sendChatMessage } from "@/lib/aiService";

export async function summarizeConversation(history) {
  if (!history?.length) return "No conversation to summarize.";
  const transcript = history.map(t => `${t.role === "user" ? "User" : "Wave AI"}: ${t.text}`).join("\n");
  const prompt = `Summarize this voice conversation in 3-5 bullet points:\n\n${transcript.slice(0, 3000)}\n\nProvide key topics discussed and main outcomes.`;
  try {
    return await sendChatMessage(prompt);
  } catch {
    return generateLocalSummary(history);
  }
}

export function generateLocalSummary(history) {
  const userTurns = history.filter(t => t.role === "user");
  const aiTurns = history.filter(t => t.role === "assistant");
  const totalWords = history.reduce((s, t) => s + t.text.split(/\s+/).length, 0);
  const keywords = extractKeywords(history.map(t => t.text).join(" "));
  return `**Conversation Summary**\n- ${userTurns.length} user messages, ${aiTurns.length} AI responses\n- ~${totalWords} words total\n- Key topics: ${keywords.slice(0, 5).join(", ")}\n- Duration: Active discussion on ${keywords[0] || "various topics"}`;
}

export function extractKeywords(text, topN = 10) {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "ought", "used", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "our", "their", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "to", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "of", "and", "but", "if", "or", "because", "as", "until", "while", "so", "just", "don't", "it's", "i'm", "like", "get", "go", "know", "think", "want", "say", "see", "come", "make", "also", "more", "very", "not"]);
  const freq = {};
  text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([w]) => w);
}
