/* ═══════════════════════════════════════════════════════════════
   Wave AI — Metrics & Observability
   Request tracking, latency monitoring, error rates, usage stats.
═══════════════════════════════════════════════════════════════ */

export type MetricType = "counter" | "gauge" | "histogram" | "timer";

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

export interface RequestMetric {
  requestId: string;
  userId?: string;
  sessionId?: string;
  intent: string;
  provider: string;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cached: boolean;
  error?: string;
  ragUsed: boolean;
  memoryUsed: boolean;
  blocked: boolean;
  timestamp: number;
  feedback?: "positive" | "negative" | "neutral";
}

export interface SessionMetrics {
  sessionId: string;
  requestCount: number;
  totalLatencyMs: number;
  errorCount: number;
  cachedCount: number;
  avgLatencyMs: number;
  intentBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
  startTime: number;
  lastActivity: number;
}

/* ── Storage ─────────────────────────────────────────────────── */
const requestHistory: RequestMetric[] = [];
const sessionMetrics = new Map<string, SessionMetrics>();
const customMetrics: Metric[] = [];
const MAX_HISTORY = 1000;

/* ── Track a request ─────────────────────────────────────────── */
export function trackRequest(metric: Omit<RequestMetric, "requestId" | "timestamp">): RequestMetric {
  const full: RequestMetric = {
    ...metric,
    requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  requestHistory.push(full);
  if (requestHistory.length > MAX_HISTORY) requestHistory.shift();

  updateSessionMetrics(full);
  persistMetrics();

  return full;
}

/* ── Update session rollup ───────────────────────────────────── */
function updateSessionMetrics(req: RequestMetric): void {
  const sid = req.sessionId ?? "anonymous";
  const existing = sessionMetrics.get(sid) ?? {
    sessionId: sid,
    requestCount: 0,
    totalLatencyMs: 0,
    errorCount: 0,
    cachedCount: 0,
    avgLatencyMs: 0,
    intentBreakdown: {},
    providerBreakdown: {},
    startTime: Date.now(),
    lastActivity: Date.now(),
  };

  existing.requestCount++;
  existing.totalLatencyMs += req.latencyMs;
  existing.avgLatencyMs = Math.round(existing.totalLatencyMs / existing.requestCount);
  existing.lastActivity = Date.now();
  if (req.error) existing.errorCount++;
  if (req.cached) existing.cachedCount++;
  existing.intentBreakdown[req.intent] = (existing.intentBreakdown[req.intent] ?? 0) + 1;
  existing.providerBreakdown[req.provider] = (existing.providerBreakdown[req.provider] ?? 0) + 1;

  sessionMetrics.set(sid, existing);
}

/* ── Custom metric recording ─────────────────────────────────── */
export function recordMetric(
  name: string,
  value: number,
  type: MetricType = "gauge",
  tags: Record<string, string> = {}
): void {
  customMetrics.push({ name, type, value, tags, timestamp: Date.now() });
  if (customMetrics.length > 5000) customMetrics.shift();
}

/* ── Aggregation helpers ─────────────────────────────────────── */
export function getRecentRequests(limit = 100): RequestMetric[] {
  return requestHistory.slice(-limit);
}

export function getErrorRate(windowMs = 60000): number {
  const since = Date.now() - windowMs;
  const recent = requestHistory.filter(r => r.timestamp > since);
  if (recent.length === 0) return 0;
  const errors = recent.filter(r => r.error).length;
  return errors / recent.length;
}

export function getAverageLatency(windowMs = 60000): number {
  const since = Date.now() - windowMs;
  const recent = requestHistory.filter(r => r.timestamp > since && !r.error);
  if (recent.length === 0) return 0;
  return Math.round(recent.reduce((s, r) => s + r.latencyMs, 0) / recent.length);
}

export function getCacheHitRate(windowMs = 60000): number {
  const since = Date.now() - windowMs;
  const recent = requestHistory.filter(r => r.timestamp > since);
  if (recent.length === 0) return 0;
  return recent.filter(r => r.cached).length / recent.length;
}

export function getIntentBreakdown(windowMs = 3600000): Record<string, number> {
  const since = Date.now() - windowMs;
  const recent = requestHistory.filter(r => r.timestamp > since);
  const breakdown: Record<string, number> = {};
  for (const r of recent) breakdown[r.intent] = (breakdown[r.intent] ?? 0) + 1;
  return breakdown;
}

export function getProviderBreakdown(windowMs = 3600000): Record<string, number> {
  const since = Date.now() - windowMs;
  const recent = requestHistory.filter(r => r.timestamp > since);
  const breakdown: Record<string, number> = {};
  for (const r of recent) breakdown[r.provider] = (breakdown[r.provider] ?? 0) + 1;
  return breakdown;
}

/* ── Dashboard summary ───────────────────────────────────────── */
export function getDashboardSummary() {
  const allTime = requestHistory;
  const last1h = allTime.filter(r => r.timestamp > Date.now() - 3600000);

  return {
    allTime: {
      requests: allTime.length,
      errors: allTime.filter(r => r.error).length,
      cached: allTime.filter(r => r.cached).length,
      avgLatencyMs: allTime.length > 0
        ? Math.round(allTime.reduce((s, r) => s + r.latencyMs, 0) / allTime.length)
        : 0,
    },
    lastHour: {
      requests: last1h.length,
      errorRate: getErrorRate(3600000),
      cacheHitRate: getCacheHitRate(3600000),
      avgLatencyMs: getAverageLatency(3600000),
      intentBreakdown: getIntentBreakdown(3600000),
      providerBreakdown: getProviderBreakdown(3600000),
    },
    sessions: {
      active: sessionMetrics.size,
      avgRequestsPerSession: sessionMetrics.size > 0
        ? Math.round(Array.from(sessionMetrics.values()).reduce((s, m) => s + m.requestCount, 0) / sessionMetrics.size)
        : 0,
    },
  };
}

/* ── Add feedback to a request ───────────────────────────────── */
export function addFeedback(requestId: string, feedback: "positive" | "negative" | "neutral"): boolean {
  const req = requestHistory.find(r => r.requestId === requestId);
  if (!req) return false;
  req.feedback = feedback;
  persistMetrics();
  return true;
}

/* ── Persist to localStorage ─────────────────────────────────── */
const METRICS_KEY = "wave_metrics_v1";

function persistMetrics(): void {
  try {
    const recent = requestHistory.slice(-200);
    localStorage.setItem(METRICS_KEY, JSON.stringify(recent));
  } catch { /* storage full */ }
}

export function loadPersistedMetrics(): void {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return;
    const loaded: RequestMetric[] = JSON.parse(raw);
    requestHistory.push(...loaded.slice(-200));
  } catch { /* corrupt data */ }
}

loadPersistedMetrics();
