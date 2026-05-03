/* ═══════════════════════════════════════════════════════════════
   Wave AI — Content Filter
   Multi-layer safety system: toxicity detection, PII scrubbing,
   harmful content detection, policy enforcement.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";

export type SafetyCategory =
  | "safe"
  | "toxic"
  | "hate_speech"
  | "sexual"
  | "violence"
  | "pii"
  | "spam"
  | "jailbreak"
  | "harmful"
  | "misinformation";

export interface SafetyResult {
  safe: boolean;
  categories: SafetyCategory[];
  confidence: number;
  flags: SafetyFlag[];
  sanitized?: string;
  blocked: boolean;
  reason?: string;
}

export interface SafetyFlag {
  category: SafetyCategory;
  severity: "low" | "medium" | "high" | "critical";
  matched: string;
  context: string;
}

/* ── Toxicity patterns ───────────────────────────────────────── */
const TOXICITY_PATTERNS: Array<{ pattern: RegExp; category: SafetyCategory; severity: "low" | "medium" | "high" | "critical" }> = [
  { pattern: /\b(kill|murder|assassinate)\s+(yourself|himself|herself|themselves|him|her|them)\b/i, category: "violence", severity: "critical" },
  { pattern: /\b(bomb|explosive|weapon)\s+(how to make|instructions|recipe|synthesis)\b/i, category: "harmful", severity: "critical" },
  { pattern: /\b(hack|crack|bypass)\s+(password|security|system|authentication)\b/i, category: "harmful", severity: "high" },
  { pattern: /\b(child|minor|underage)\s+(sexual|nude|naked|explicit)\b/i, category: "sexual", severity: "critical" },
  { pattern: /\b(drug|meth|cocaine|heroin)\s+(synthesis|recipe|how to make)\b/i, category: "harmful", severity: "critical" },
  { pattern: /\bjailbreak\b/i, category: "jailbreak", severity: "high" },
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i, category: "jailbreak", severity: "high" },
  { pattern: /you\s+are\s+now\s+(DAN|an?\s+AI\s+without|not\s+bound)/i, category: "jailbreak", severity: "high" },
  { pattern: /act\s+as\s+(if\s+you\s+(have|had|are)|an?\s+(evil|unrestricted|unfiltered))/i, category: "jailbreak", severity: "medium" },
  { pattern: /\b(nigger|faggot|kike|spic|chink|cunt|bitch)\b/i, category: "hate_speech", severity: "high" },
  { pattern: /\b(retard|autist)\s+(?:fucking|shit|idiot)/i, category: "hate_speech", severity: "medium" },
  { pattern: /\bhow\s+to\s+(stalk|track\s+someone|follow\s+someone)\b/i, category: "harmful", severity: "high" },
];

/* ── PII patterns ────────────────────────────────────────────── */
const PII_PATTERNS: Array<{ pattern: RegExp; type: string; replacement: string }> = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: "email", replacement: "[EMAIL]" },
  { pattern: /\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, type: "phone", replacement: "[PHONE]" },
  { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, type: "ssn", replacement: "[SSN]" },
  { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, type: "credit_card", replacement: "[CREDIT_CARD]" },
  { pattern: /\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g, type: "url", replacement: "[URL]" },
];

/* ── Spam patterns ───────────────────────────────────────────── */
const SPAM_PATTERNS = [
  /aichatos/i,
  /网信办/,
  /chat18/i,
  /📢\s*通知/,
  /click\s+here\s+to\s+(win|claim|get)/i,
  /you\s+have\s+(won|been\s+selected)/i,
  /free\s+(bitcoin|crypto|money)\s+(giveaway|airdrop)/i,
];

/* ── Jailbreak detection ─────────────────────────────────────── */
const JAILBREAK_PATTERNS = [
  /pretend\s+you\s+(are|have\s+no|don't\s+have)\s+(restrictions|rules|guidelines)/i,
  /your\s+(new|true|real)\s+(instruction|role|task|purpose)\s+is/i,
  /\[system\s+prompt\]/i,
  /\bDAN\b.*\bdo\s+anything\s+now\b/i,
  /bypass\s+your\s+(safety|filter|restriction|guideline)/i,
  /translate\s+the\s+following\s+to\s+.*(hate|offensive|slur)/i,
];

/* ── Core filter function ────────────────────────────────────── */
export function filterContent(text: string, isInput = true): SafetyResult {
  if (!text || !WAVE_CONFIG.safety.enableContentFilter) {
    return { safe: true, categories: ["safe"], confidence: 1, flags: [], blocked: false };
  }

  const flags: SafetyFlag[] = [];
  const categories = new Set<SafetyCategory>();

  for (const { pattern, category, severity } of TOXICITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      flags.push({
        category,
        severity,
        matched: match[0],
        context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      });
      categories.add(category);
    }
  }

  if (isInput) {
    for (const pattern of JAILBREAK_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        flags.push({
          category: "jailbreak",
          severity: "high",
          matched: match[0],
          context: match[0],
        });
        categories.add("jailbreak");
      }
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ category: "spam", severity: "medium", matched: "spam pattern", context: text.slice(0, 50) });
      categories.add("spam");
    }
  }

  const criticalFlags = flags.filter(f => f.severity === "critical");
  const highFlags = flags.filter(f => f.severity === "high");
  const isBlocked = criticalFlags.length > 0 || (highFlags.length >= 2);

  const maxSeverityScore = flags.reduce((max, f) => {
    const scores = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    return Math.max(max, scores[f.severity]);
  }, 0);

  if (categories.size === 0) categories.add("safe");

  return {
    safe: flags.length === 0,
    categories: Array.from(categories),
    confidence: Math.max(0.5, 1 - maxSeverityScore * 0.3),
    flags,
    blocked: isBlocked,
    reason: isBlocked
      ? `Content blocked: ${Array.from(categories).filter(c => c !== "safe").join(", ")}`
      : undefined,
  };
}

/* ── PII scrubber ────────────────────────────────────────────── */
export function scrubPII(text: string): { scrubbed: string; detected: string[] } {
  let scrubbed = text;
  const detected: string[] = [];

  for (const { pattern, type, replacement } of PII_PATTERNS) {
    if (pattern.test(scrubbed)) {
      detected.push(type);
      scrubbed = scrubbed.replace(pattern, replacement);
    }
  }

  return { scrubbed, detected };
}

/* ── Output sanitizer ────────────────────────────────────────── */
export function sanitizeOutput(text: string): string {
  let out = text;

  const { scrubbed } = scrubPII(out);
  out = scrubbed;

  out = out.replace(/\n{4,}/g, "\n\n\n");
  out = out.replace(/[ \t]{3,}/g, "  ");
  out = out.slice(0, WAVE_CONFIG.safety.maxResponseLength);

  return out.trim();
}

/* ── Policy check ────────────────────────────────────────────── */
export function checkPolicy(text: string): { allowed: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const blocked of WAVE_CONFIG.safety.blockedTopics) {
    if (lower.includes(blocked)) {
      return { allowed: false, reason: `Topic not allowed: ${blocked}` };
    }
  }
  return { allowed: true };
}

/* ── Toxicity score (0-1) ────────────────────────────────────── */
export function toxicityScore(text: string): number {
  const result = filterContent(text);
  if (result.safe) return 0;
  const severityMap = { low: 0.2, medium: 0.5, high: 0.75, critical: 1.0 };
  const maxScore = Math.max(...result.flags.map(f => severityMap[f.severity]));
  return Math.min(1, maxScore);
}
