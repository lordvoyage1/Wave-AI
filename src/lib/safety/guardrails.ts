/* ═══════════════════════════════════════════════════════════════
   Wave AI — Guardrails System
   Pre/post generation guardrails, policy constraints, bias
   detection, and response quality enforcement.
═══════════════════════════════════════════════════════════════ */

import { filterContent, checkPolicy, SafetyResult } from "./contentFilter";

export interface GuardrailResult {
  passed: boolean;
  checks: GuardrailCheck[];
  modified: boolean;
  finalText: string;
  summary: string;
}

export interface GuardrailCheck {
  name: string;
  passed: boolean;
  message?: string;
  severity: "info" | "warning" | "error" | "critical";
}

/* ── Input guardrails ────────────────────────────────────────── */
export function applyInputGuardrails(userInput: string): GuardrailResult {
  const checks: GuardrailCheck[] = [];
  let finalText = userInput;
  let blocked = false;

  const safetyResult = filterContent(userInput, true);
  checks.push({
    name: "content_safety",
    passed: !safetyResult.blocked,
    message: safetyResult.reason,
    severity: safetyResult.blocked ? "critical" : "info",
  });
  if (safetyResult.blocked) blocked = true;

  const policyCheck = checkPolicy(userInput);
  checks.push({
    name: "policy_check",
    passed: policyCheck.allowed,
    message: policyCheck.reason,
    severity: policyCheck.allowed ? "info" : "error",
  });
  if (!policyCheck.allowed) blocked = true;

  const lengthCheck = userInput.length <= 10000;
  checks.push({
    name: "input_length",
    passed: lengthCheck,
    message: lengthCheck ? undefined : "Input exceeds maximum length of 10,000 characters",
    severity: lengthCheck ? "info" : "warning",
  });
  if (!lengthCheck) finalText = userInput.slice(0, 10000);

  const repetitionCheck = !hasExcessiveRepetition(userInput);
  checks.push({
    name: "repetition_check",
    passed: repetitionCheck,
    message: repetitionCheck ? undefined : "Excessive repetition detected in input",
    severity: "warning",
  });

  return {
    passed: !blocked,
    checks,
    modified: finalText !== userInput,
    finalText,
    summary: blocked
      ? `Input blocked: ${checks.filter(c => !c.passed).map(c => c.name).join(", ")}`
      : "Input passed all guardrails",
  };
}

/* ── Output guardrails ───────────────────────────────────────── */
export function applyOutputGuardrails(response: string, userInput: string): GuardrailResult {
  const checks: GuardrailCheck[] = [];
  let finalText = response;
  let blocked = false;

  const safetyResult = filterContent(response, false);
  checks.push({
    name: "output_safety",
    passed: !safetyResult.blocked,
    message: safetyResult.reason,
    severity: safetyResult.blocked ? "critical" : "info",
  });
  if (safetyResult.blocked) blocked = true;

  const minLength = response.length >= 2;
  checks.push({
    name: "min_length",
    passed: minLength,
    message: minLength ? undefined : "Response too short",
    severity: "warning",
  });

  const maxLength = response.length <= 50000;
  checks.push({
    name: "max_length",
    passed: maxLength,
    severity: "info",
  });
  if (!maxLength) finalText = finalText.slice(0, 50000);

  const hasHallucination = detectHallucination(response);
  checks.push({
    name: "hallucination_check",
    passed: !hasHallucination,
    message: hasHallucination ? "Potential hallucination patterns detected" : undefined,
    severity: "warning",
  });

  const brandCheck = checkBrandCompliance(response);
  checks.push({
    name: "brand_compliance",
    passed: brandCheck.compliant,
    message: brandCheck.issue,
    severity: "warning",
  });
  if (!brandCheck.compliant) finalText = brandCheck.fixed;

  const qualityCheck = checkResponseQuality(response, userInput);
  checks.push({
    name: "response_quality",
    passed: qualityCheck.adequate,
    message: qualityCheck.issue,
    severity: "info",
  });

  return {
    passed: !blocked,
    checks,
    modified: finalText !== response,
    finalText,
    summary: blocked
      ? `Output blocked: ${checks.filter(c => !c.passed).map(c => c.name).join(", ")}`
      : "Output passed all guardrails",
  };
}

/* ── Hallucination detection ─────────────────────────────────── */
const HALLUCINATION_PATTERNS = [
  /as\s+of\s+my\s+knowledge\s+cutoff/i,
  /I\s+don't\s+have\s+access\s+to\s+real-time/i,
  /\d{4}.*\d{4}.*\d{4}/,
  /(?:according\s+to|based\s+on)\s+(?:a\s+study|research)\s+(?:from|by)\s+(?:unknown|unspecified)/i,
];

function detectHallucination(text: string): boolean {
  return HALLUCINATION_PATTERNS.some(p => p.test(text));
}

/* ── Brand compliance ────────────────────────────────────────── */
const COMPETITOR_BRANDS = [
  /\b(ChatGPT|GPT-?[34]|claude|gemini|copilot|bard|llama|mistral|cohere)\b/gi,
  /\b(OpenAI|Anthropic|Google AI|Meta AI|Microsoft AI)\b/g,
];

function checkBrandCompliance(text: string): { compliant: boolean; issue?: string; fixed: string } {
  let fixed = text;
  let hasIssue = false;

  for (const pattern of COMPETITOR_BRANDS) {
    if (pattern.test(fixed)) {
      hasIssue = true;
      fixed = fixed.replace(pattern, "Wave AI");
    }
  }

  return {
    compliant: !hasIssue,
    issue: hasIssue ? "Competitor brand names detected in output" : undefined,
    fixed,
  };
}

/* ── Response quality check ──────────────────────────────────── */
function checkResponseQuality(response: string, userInput: string): { adequate: boolean; issue?: string } {
  if (response.length < 5) {
    return { adequate: false, issue: "Response too brief" };
  }

  const isQuestion = /\?$/.test(userInput.trim());
  if (isQuestion && response.length < 20) {
    return { adequate: false, issue: "Response too short for a question" };
  }

  if (hasExcessiveRepetition(response)) {
    return { adequate: false, issue: "Response contains excessive repetition" };
  }

  return { adequate: true };
}

/* ── Repetition detection ────────────────────────────────────── */
function hasExcessiveRepetition(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 10) return false;

  const ngrams = new Map<string, number>();
  for (let i = 0; i < words.length - 3; i++) {
    const gram = words.slice(i, i + 4).join(" ");
    ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
  }

  for (const count of ngrams.values()) {
    if (count > 3) return true;
  }
  return false;
}

/* ── Rate limiter ────────────────────────────────────────────── */
const requestCounts = new Map<string, number[]>();

export function checkRateLimit(userId: string, maxPerMinute = 60): boolean {
  const now = Date.now();
  const windowStart = now - 60000;
  const counts = (requestCounts.get(userId) ?? []).filter(t => t > windowStart);
  if (counts.length >= maxPerMinute) return false;
  counts.push(now);
  requestCounts.set(userId, counts);
  return true;
}
