/* ═══════════════════════════════════════════════════════════════
   Wave AI — Moderation Pipeline
   Fast, multi-stage content moderation for inputs and outputs.
   Combines rule-based, pattern-matching, and ML approaches.
═══════════════════════════════════════════════════════════════ */

import { filterContent, scrubPII, toxicityScore } from "@/lib/safety/contentFilter";
import { applyInputGuardrails, applyOutputGuardrails } from "@/lib/safety/guardrails";

export type ModerationDecision = "allow" | "block" | "flag" | "sanitize";

export interface ModerationResult {
  decision: ModerationDecision;
  categories: string[];
  confidence: number;
  toxicity: number;
  piiDetected: boolean;
  modified: boolean;
  finalContent: string;
  reasons: string[];
  processingMs: number;
}

export interface ModerationConfig {
  strictMode: boolean;
  allowAdultContent: boolean;
  enablePIIScrubbing: boolean;
  minToxicityToBlock: number;
  enableJailbreakDetection: boolean;
}

const DEFAULT_CONFIG: ModerationConfig = {
  strictMode: false,
  allowAdultContent: false,
  enablePIIScrubbing: true,
  minToxicityToBlock: 0.75,
  enableJailbreakDetection: true,
};

/* ── Moderate input ──────────────────────────────────────────── */
export async function moderateInput(
  content: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  const start = performance.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const reasons: string[] = [];
  let decision: ModerationDecision = "allow";
  let finalContent = content;
  let modified = false;
  let piiDetected = false;

  const safetyResult = filterContent(content, true);
  const guardrailResult = applyInputGuardrails(content);
  const toxicity = toxicityScore(content);

  if (guardrailResult.passed === false || safetyResult.blocked) {
    decision = "block";
    reasons.push("Content blocked by safety filters");
  }

  if (toxicity >= cfg.minToxicityToBlock) {
    decision = "block";
    reasons.push(`High toxicity score: ${toxicity.toFixed(2)}`);
  }

  if (cfg.enablePIIScrubbing) {
    const { scrubbed, detected } = scrubPII(content);
    if (detected.length > 0) {
      piiDetected = true;
      finalContent = scrubbed;
      modified = true;
      reasons.push(`PII detected and scrubbed: ${detected.join(", ")}`);
    }
  }

  if (decision === "allow" && guardrailResult.checks.some(c => !c.passed && c.severity === "warning")) {
    decision = "flag";
    reasons.push("Content flagged for review");
  }

  return {
    decision,
    categories: safetyResult.categories,
    confidence: safetyResult.confidence,
    toxicity,
    piiDetected,
    modified,
    finalContent: decision === "block" ? content : finalContent,
    reasons,
    processingMs: Math.round(performance.now() - start),
  };
}

/* ── Moderate output ─────────────────────────────────────────── */
export async function moderateOutput(
  content: string,
  userInput: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  const start = performance.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const reasons: string[] = [];
  let decision: ModerationDecision = "allow";
  let finalContent = content;
  let modified = false;
  let piiDetected = false;

  const guardrailResult = applyOutputGuardrails(content, userInput);
  const toxicity = toxicityScore(content);

  if (!guardrailResult.passed) {
    decision = "block";
    reasons.push(guardrailResult.summary);
  }

  if (toxicity >= cfg.minToxicityToBlock) {
    decision = "block";
    reasons.push(`Output toxicity too high: ${toxicity.toFixed(2)}`);
  }

  if (guardrailResult.modified) {
    finalContent = guardrailResult.finalText;
    modified = true;
    reasons.push("Output sanitized by guardrails");
  }

  const { scrubbed, detected } = scrubPII(finalContent);
  if (detected.length > 0) {
    piiDetected = true;
    finalContent = scrubbed;
    modified = true;
  }

  const safetyResult = filterContent(finalContent, false);

  return {
    decision,
    categories: safetyResult.categories,
    confidence: safetyResult.confidence,
    toxicity,
    piiDetected,
    modified,
    finalContent,
    reasons,
    processingMs: Math.round(performance.now() - start),
  };
}

/* ── Batch moderation ────────────────────────────────────────── */
export async function moderateBatch(
  items: Array<{ content: string; type: "input" | "output"; userInput?: string }>,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult[]> {
  return Promise.all(items.map(item =>
    item.type === "input"
      ? moderateInput(item.content, config)
      : moderateOutput(item.content, item.userInput ?? "", config)
  ));
}

/* ── Moderation audit log ────────────────────────────────────── */
const auditLog: Array<{ timestamp: number; decision: ModerationDecision; categories: string[]; toxicity: number }> = [];
const AUDIT_MAX = 1000;

export function logModerationEvent(result: ModerationResult): void {
  auditLog.push({
    timestamp: Date.now(),
    decision: result.decision,
    categories: result.categories,
    toxicity: result.toxicity,
  });
  if (auditLog.length > AUDIT_MAX) auditLog.shift();
}

export function getModerationStats(windowMs = 3600000) {
  const since = Date.now() - windowMs;
  const recent = auditLog.filter(e => e.timestamp > since);

  return {
    total: recent.length,
    blocked: recent.filter(e => e.decision === "block").length,
    flagged: recent.filter(e => e.decision === "flag").length,
    allowed: recent.filter(e => e.decision === "allow").length,
    blockRate: recent.length > 0 ? recent.filter(e => e.decision === "block").length / recent.length : 0,
    avgToxicity: recent.length > 0 ? recent.reduce((s, e) => s + e.toxicity, 0) / recent.length : 0,
  };
}
