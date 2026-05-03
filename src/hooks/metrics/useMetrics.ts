/* ═══════════════════════════════════════════════════════════════
   Wave AI — useMetrics Hook
   React hook for accessing real-time system metrics and stats.
═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import {
  getDashboardSummary, getRecentRequests, getErrorRate,
  getAverageLatency, getCacheHitRate, getIntentBreakdown,
} from "@/lib/metrics/tracker";
import { getFeedbackStats } from "@/lib/feedback/collector";
import { getModerationStats } from "@/lib/moderation/pipeline";
import { getAuditStats } from "@/lib/audit/auditLog";
import { getRouterStats } from "@/lib/inference/router";
import { getHubStats } from "@/lib/hub/modelHub";
import { globalScheduler } from "@/lib/scheduler/requestScheduler";

export interface MetricsDashboard {
  summary: ReturnType<typeof getDashboardSummary>;
  feedback: ReturnType<typeof getFeedbackStats>;
  moderation: ReturnType<typeof getModerationStats>;
  audit: ReturnType<typeof getAuditStats>;
  router: ReturnType<typeof getRouterStats>;
  hub: ReturnType<typeof getHubStats>;
  scheduler: ReturnType<typeof globalScheduler.getStats>;
  errorRate: number;
  avgLatency: number;
  cacheHitRate: number;
  intentBreakdown: Record<string, number>;
  recentRequests: ReturnType<typeof getRecentRequests>;
}

export function useMetrics(refreshIntervalMs = 5000) {
  const [metrics, setMetrics] = useState<MetricsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    try {
      const dashboard: MetricsDashboard = {
        summary: getDashboardSummary(),
        feedback: getFeedbackStats(),
        moderation: getModerationStats(),
        audit: getAuditStats(),
        router: getRouterStats(),
        hub: getHubStats(),
        scheduler: globalScheduler.getStats(),
        errorRate: getErrorRate(),
        avgLatency: getAverageLatency(),
        cacheHitRate: getCacheHitRate(),
        intentBreakdown: getIntentBreakdown(),
        recentRequests: getRecentRequests(10),
      };
      setMetrics(dashboard);
      setIsLoading(false);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, refreshIntervalMs]);

  return { metrics, isLoading, refresh };
}
