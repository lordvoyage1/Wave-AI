/* ═══════════════════════════════════════════════════════════════
   Wave AI — Feedback Collector
   Collects user feedback (thumbs up/down, ratings, comments)
   for RLHF-style improvement signals.
═══════════════════════════════════════════════════════════════ */

import { addFeedback } from "@/lib/metrics/tracker";
import { estimateRewardSignal } from "@/lib/alignment/systemPrompt";

export type FeedbackType = "thumbs_up" | "thumbs_down" | "rating" | "comment" | "flag";

export interface FeedbackEntry {
  id: string;
  requestId: string;
  sessionId?: string;
  userId?: string;
  type: FeedbackType;
  rating?: number;
  comment?: string;
  flag?: "harmful" | "inaccurate" | "unhelpful" | "spam" | "other";
  userInput: string;
  aiResponse: string;
  rewardSignal?: ReturnType<typeof estimateRewardSignal>;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgRating: number;
  positiveRate: number;
  flagged: number;
  byType: Record<FeedbackType, number>;
  recentTrend: "improving" | "declining" | "stable";
}

/* ── Storage ─────────────────────────────────────────────────── */
const FEEDBACK_KEY = "wave_feedback_v1";
const MAX_STORED = 500;

function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFeedback(entries: FeedbackEntry[]): void {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries.slice(-MAX_STORED)));
  } catch { /* storage full */ }
}

let feedbackStore: FeedbackEntry[] = loadFeedback();

/* ── Submit feedback ─────────────────────────────────────────── */
export function submitFeedback(
  requestId: string,
  type: FeedbackType,
  userInput: string,
  aiResponse: string,
  options: {
    sessionId?: string;
    userId?: string;
    rating?: number;
    comment?: string;
    flag?: FeedbackEntry["flag"];
    metadata?: Record<string, unknown>;
  } = {}
): FeedbackEntry {
  const sentiment = type === "thumbs_up" || (options.rating !== undefined && options.rating >= 4)
    ? "positive"
    : type === "thumbs_down" || (options.rating !== undefined && options.rating <= 2)
    ? "negative"
    : "neutral";

  addFeedback(requestId, sentiment as "positive" | "negative" | "neutral");

  const rewardSignal = estimateRewardSignal(userInput, aiResponse, sentiment as "positive" | "negative" | "neutral");

  const entry: FeedbackEntry = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    requestId,
    sessionId: options.sessionId,
    userId: options.userId,
    type,
    rating: options.rating,
    comment: options.comment,
    flag: options.flag,
    userInput: userInput.slice(0, 500),
    aiResponse: aiResponse.slice(0, 1000),
    rewardSignal,
    timestamp: Date.now(),
    metadata: options.metadata ?? {},
  };

  feedbackStore.push(entry);
  saveFeedback(feedbackStore);

  return entry;
}

/* ── Get feedback stats ──────────────────────────────────────── */
export function getFeedbackStats(windowMs = Infinity): FeedbackStats {
  const since = windowMs === Infinity ? 0 : Date.now() - windowMs;
  const entries = feedbackStore.filter(e => e.timestamp > since);

  const positive = entries.filter(e => e.type === "thumbs_up" || (e.rating !== undefined && e.rating >= 4)).length;
  const negative = entries.filter(e => e.type === "thumbs_down" || (e.rating !== undefined && e.rating <= 2)).length;
  const neutral = entries.length - positive - negative;
  const rated = entries.filter(e => e.rating !== undefined);
  const avgRating = rated.length > 0 ? rated.reduce((s, e) => s + (e.rating ?? 3), 0) / rated.length : 3;
  const flagged = entries.filter(e => e.flag).length;

  const byType: Record<FeedbackType, number> = {
    thumbs_up: 0, thumbs_down: 0, rating: 0, comment: 0, flag: 0
  };
  for (const e of entries) byType[e.type] = (byType[e.type] ?? 0) + 1;

  const recentEntries = entries.slice(-20);
  const recentPositive = recentEntries.filter(e => e.type === "thumbs_up").length;
  const recentNegative = recentEntries.filter(e => e.type === "thumbs_down").length;
  let recentTrend: FeedbackStats["recentTrend"] = "stable";
  if (recentPositive > recentNegative * 2) recentTrend = "improving";
  else if (recentNegative > recentPositive * 2) recentTrend = "declining";

  return {
    total: entries.length,
    positive,
    negative,
    neutral,
    avgRating,
    positiveRate: entries.length > 0 ? positive / entries.length : 0,
    flagged,
    byType,
    recentTrend,
  };
}

/* ── Get recent feedback ─────────────────────────────────────── */
export function getRecentFeedback(limit = 20): FeedbackEntry[] {
  return feedbackStore.slice(-limit).reverse();
}

/* ── Get negative feedback for improvement ───────────────────── */
export function getNegativeFeedback(): FeedbackEntry[] {
  return feedbackStore.filter(e => e.type === "thumbs_down" || e.flag).slice(-50);
}

/* ── Export feedback dataset (for fine-tuning) ───────────────── */
export function exportFeedbackDataset(): Array<{
  prompt: string;
  response: string;
  score: number;
}> {
  return feedbackStore
    .filter(e => e.rewardSignal)
    .map(e => ({
      prompt: e.userInput,
      response: e.aiResponse,
      score: e.rewardSignal!.overall,
    }));
}

export function clearFeedback(): void {
  feedbackStore = [];
  localStorage.removeItem(FEEDBACK_KEY);
}
