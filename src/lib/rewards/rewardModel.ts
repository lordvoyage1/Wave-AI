/* ═══════════════════════════════════════════════════════════════
   Wave AI — Reward Model (RLHF)
   Scores responses based on multiple quality dimensions.
   Used to select the best response from multiple candidates
   and to provide training signal for alignment.
═══════════════════════════════════════════════════════════════ */

export interface RewardDimension {
  name: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface RewardScore {
  overall: number;
  dimensions: RewardDimension[];
  tier: "excellent" | "good" | "acceptable" | "poor" | "harmful";
  recommendation: "use" | "improve" | "reject";
  reasoning: string;
}

export interface ResponseCandidate {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/* ── Dimension scorers ───────────────────────────────────────── */

function scoreHelpfulness(response: string, userInput: string): RewardDimension {
  let score = 0.5;
  const explanations: string[] = [];

  if (response.length > 50) { score += 0.1; }
  if (response.length > 200) { score += 0.1; explanations.push("Detailed response"); }
  if (response.length > 500) { score += 0.05; }

  const hasCode = /```/.test(response) && /code|function|script|program/i.test(userInput);
  if (hasCode) { score += 0.15; explanations.push("Code provided for code request"); }

  const answersQuestion = /\?$/.test(userInput.trim()) && response.length > 30;
  if (answersQuestion) { score += 0.05; explanations.push("Answers the question"); }

  const isApology = /sorry|unfortunately|i can't|i cannot|i'm unable/i.test(response) && response.length < 100;
  if (isApology) { score -= 0.2; explanations.push("Unhelpful refusal"); }

  return { name: "helpfulness", score: Math.max(0, Math.min(1, score)), weight: 0.35, explanation: explanations.join("; ") || "Adequate" };
}

function scoreHarmlessness(response: string): RewardDimension {
  let score = 0.9;
  const explanations: string[] = [];

  const harmfulPatterns = [
    /how to make (?:bomb|weapon|explosive|poison)/i,
    /instructions for (?:hacking|cracking|bypassing)/i,
    /\b(kill|hurt|harm) (?:yourself|someone)\b/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(response)) { score -= 0.5; explanations.push("Contains harmful content"); }
  }

  const identityLeaks = /(openai|chatgpt|gpt-4|gemini|claude|anthropic)/i.test(response);
  if (identityLeaks) { score -= 0.1; explanations.push("Identity leak detected"); }

  return { name: "harmlessness", score: Math.max(0, Math.min(1, score)), weight: 0.30, explanation: explanations.join("; ") || "Safe content" };
}

function scoreHonesty(response: string): RewardDimension {
  let score = 0.65;
  const explanations: string[] = [];

  const hedgesProperly = /I'm not sure|I don't have complete|this may vary|to my knowledge/i.test(response);
  if (hedgesProperly) { score += 0.1; explanations.push("Appropriately hedged"); }

  const falseConfidence = /definitely|certainly|absolutely|100% sure/i.test(response) && response.length < 50;
  if (falseConfidence) { score -= 0.1; explanations.push("Overconfident short response"); }

  const acknowledgesLimits = /I cannot access|I don't have access to|as of my|I may be wrong/i.test(response);
  if (acknowledgesLimits) { score += 0.05; explanations.push("Acknowledges limitations"); }

  return { name: "honesty", score: Math.max(0, Math.min(1, score)), weight: 0.20, explanation: explanations.join("; ") || "Reasonably honest" };
}

function scoreClarity(response: string): RewardDimension {
  let score = 0.6;
  const explanations: string[] = [];

  if (/\n/.test(response)) { score += 0.05; }
  if (/\*\*/.test(response)) { score += 0.05; explanations.push("Uses formatting"); }
  if (/^[-*•]\s/m.test(response)) { score += 0.05; explanations.push("Uses lists"); }
  if (/^#{1,3}\s/m.test(response)) { score += 0.05; explanations.push("Uses headers"); }

  const wordCount = response.split(/\s+/).length;
  const hasRepetition = new Set(response.toLowerCase().match(/\b\w{5,}\b/g) ?? []).size < wordCount * 0.3;
  if (hasRepetition) { score -= 0.1; explanations.push("Repetitive vocabulary"); }

  const avgSentenceLength = response.split(/[.!?]+/).filter(Boolean).reduce((s, sent) => s + sent.split(/\s+/).length, 0) / Math.max(1, response.split(/[.!?]+/).filter(Boolean).length);
  if (avgSentenceLength < 30) { score += 0.05; explanations.push("Concise sentences"); }

  return { name: "clarity", score: Math.max(0, Math.min(1, score)), weight: 0.15, explanation: explanations.join("; ") || "Reasonably clear" };
}

/* ── Score a single response ─────────────────────────────────── */
export function scoreResponse(response: string, userInput: string): RewardScore {
  const dimensions: RewardDimension[] = [
    scoreHelpfulness(response, userInput),
    scoreHarmlessness(response),
    scoreHonesty(response),
    scoreClarity(response),
  ];

  const overall = dimensions.reduce((s, d) => s + d.score * d.weight, 0) / dimensions.reduce((s, d) => s + d.weight, 0);

  let tier: RewardScore["tier"];
  let recommendation: RewardScore["recommendation"];

  if (overall >= 0.85) { tier = "excellent"; recommendation = "use"; }
  else if (overall >= 0.7) { tier = "good"; recommendation = "use"; }
  else if (overall >= 0.55) { tier = "acceptable"; recommendation = "improve"; }
  else if (overall >= 0.3) { tier = "poor"; recommendation = "improve"; }
  else { tier = "harmful"; recommendation = "reject"; }

  const reasoning = dimensions.map(d => `${d.name}: ${d.score.toFixed(2)} (${d.explanation})`).join("; ");

  return { overall, dimensions, tier, recommendation, reasoning };
}

/* ── Select best candidate ───────────────────────────────────── */
export function selectBestCandidate(
  candidates: ResponseCandidate[],
  userInput: string
): { best: ResponseCandidate; scores: Array<{ id: string; score: RewardScore }> } {
  const scores = candidates.map(c => ({ id: c.id, score: scoreResponse(c.text, userInput) }));

  const usable = scores.filter(s => s.score.recommendation !== "reject");
  const toSort = usable.length > 0 ? usable : scores;
  toSort.sort((a, b) => b.score.overall - a.score.overall);

  const bestId = toSort[0].id;
  const best = candidates.find(c => c.id === bestId) ?? candidates[0];

  return { best, scores };
}

/* ── Preference pair generation (for DPO training) ──────────── */
export function generatePreferencePair(
  userInput: string,
  chosen: string,
  rejected: string
): { prompt: string; chosen: string; rejected: string; score_gap: number } {
  const chosenScore = scoreResponse(chosen, userInput);
  const rejectedScore = scoreResponse(rejected, userInput);

  return {
    prompt: userInput,
    chosen,
    rejected,
    score_gap: chosenScore.overall - rejectedScore.overall,
  };
}
