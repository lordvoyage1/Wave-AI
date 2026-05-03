/* ═══════════════════════════════════════════════════════════════
   Wave AI — useSafety Hook
   React hook for content moderation and safety checks.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { moderateInput, moderateOutput, getModerationStats } from "@/lib/moderation/pipeline";
import { filterContent, toxicityScore } from "@/lib/safety/contentFilter";
import { checkRateLimit } from "@/lib/safety/guardrails";

export function useSafety(userId = "anonymous") {
  const [lastCheck, setLastCheck] = useState<{
    safe: boolean;
    reasons: string[];
    toxicity: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkInput = useCallback(async (text: string) => {
    setIsChecking(true);
    try {
      const result = await moderateInput(text);
      setLastCheck({ safe: result.decision !== "block", reasons: result.reasons, toxicity: result.toxicity });
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkOutput = useCallback(async (text: string, userInput: string) => {
    return moderateOutput(text, userInput);
  }, []);

  const quickCheck = useCallback((text: string) => {
    const result = filterContent(text, true);
    const toxicity = toxicityScore(text);
    return { safe: !result.blocked, toxicity, categories: result.categories };
  }, []);

  const isRateLimited = useCallback((maxPerMinute = 60) => {
    return !checkRateLimit(userId, maxPerMinute);
  }, [userId]);

  return {
    lastCheck,
    isChecking,
    checkInput,
    checkOutput,
    quickCheck,
    isRateLimited,
    getModerationStats,
  };
}
