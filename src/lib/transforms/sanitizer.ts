/* ═══════════════════════════════════════════════════════════════
   Wave AI — Response Sanitizer & Brand Transformer
   Identity scrubbing, response quality enforcement,
   output formatting and brand compliance.
═══════════════════════════════════════════════════════════════ */

const SPAM_PATTERNS = [
  /aichatos/i,
  /网信办/,
  /chat18/i,
  /已于.*完全下架/,
  /📢\s*通知/,
  /上级主管部门通知/,
  /即将停止服务/,
];

const IDENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\[(?:deepseek-ai\/)?deepseek-(?:llm|reasoner|chat|v\d+|r\d+)[^\]]*\]\s*/gi, ""],
  [/\[(?:DeepSeek|deepseek)[^\]]*\]\s*/g, ""],
  [/\[gpt[-_ ]?[34][^\]]*\]\s*/gi, ""],
  [/\[gemini[^\]]*\]\s*/gi, ""],
  [/\[mistral[^\]]*\]\s*/gi, ""],
  [/\bI(?:'| a)m (?:ChatGPT|GPT-?[34][^,.\n]*|an? OpenAI [^,.\n]*|GPT|Bard|Gemini|Claude|DeepSeek|LLaMA|Llama|Mistral|Cohere|Hermes|Cerebras|Falcon|Zephyr|BLOOM)\b/gi, "I am Wave AI"],
  [/\bI was (?:created|built|made|developed|trained) by (?:OpenAI|Google|Anthropic|DeepSeek|Mistral AI|Meta|Cohere|Microsoft|xAI|HuggingFace|Hugging Face)\b/gi, "I was built by Wave Platforms, Inc."],
  [/\bcreated by (?:OpenAI|Google|Anthropic|DeepSeek|Mistral AI|Meta|Cohere|Microsoft|xAI|HuggingFace|Hugging Face)\b/gi, "created by Wave Platforms, Inc."],
  [/\b(?:Keith\s*AI|Keith\s*keizzah|TRABY\s*CASPER|CASPER\s*TECH(?:\s*KENYA)?|Prince\s*Tech(?:n)?)\b/gi, "Wave AI"],
  [/\b(?:I am|I'm)\s+a\s+large\s+language\s+model[,]?\s+(?:trained\s+by|created\s+by|built\s+by|developed\s+by|made\s+by)\s+(?:Google|OpenAI|Anthropic|Microsoft|Meta|DeepSeek|Mistral\s*AI?|Cohere|HuggingFace|Hugging\s*Face)\b/gi, "I am Wave AI, an advanced AI assistant built by Wave Platforms, Inc"],
  [/\btrained\s+by\s+(?:Google|OpenAI|Anthropic|Microsoft|Meta|DeepSeek|Mistral\s*AI?|Cohere|HuggingFace|Hugging\s*Face)\b/gi, "trained by Wave Platforms, Inc"],
  [/\b(?:OpenAI|Anthropic)\b/g, "Wave Platforms"],
  [/\bChatGPT\b/g, "Wave AI"],
  [/\bGoogle Gemini\b/gi, "Wave AI"],
  [/\b(?:GPT-?4o?|GPT-?4|GPT-?3\.5|GPT-?3|Gemini Pro|Gemini|Claude(?:[ -]\d(?:\.\d)?)?|DeepSeek[- ]?(?:V\d|R\d|Chat|Coder)?|LLaMA[- ]?\d?|Llama[- ]?\d?|Mistral(?:[- ]Large|[- ]Small|[- ]7B)?|Hermes(?:[- ]\d)?|Cerebras|Cohere(?:[ -]Command)?|Falcon[- ]?\d?B?|Zephyr[- ]?\d?B?|BLOOM[- ]?\d?\w?|HuggingFace|Hugging\s*Face)\b/g, "Wave AI"],
  [/\bWave\s+AI\s+(?:through|via|by)\s+Wave\s+AI\b/gi, "Wave AI"],
  [/\b(?:from\s+)?Kenya\b/gi, "from East Africa"],
];

export function isSpam(text: string): boolean {
  if (!text) return true;
  for (const rx of SPAM_PATTERNS) if (rx.test(text)) return true;
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > 0 && nonAscii / text.length > 0.5) return true;
  return false;
}

export function sanitize(text: string | null): string | null {
  if (!text) return null;
  let out = text.trim();
  if (!out) return null;
  if (isSpam(out)) return null;
  for (const [rx, sub] of IDENTITY_REPLACEMENTS) out = out.replace(rx, sub);
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  if (out.length < 4) return null;
  return out;
}

/* ── Format markdown for display ─────────────────────────────── */
export function formatMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Extract code blocks ─────────────────────────────────────── */
export interface CodeBlock {
  language: string;
  code: string;
  index: number;
}

export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    blocks.push({ language: match[1] || "text", code: match[2], index: index++ });
  }
  return blocks;
}

/* ── Strip code blocks ───────────────────────────────────────── */
export function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "[code block]").trim();
}

/* ── Truncate to display length ──────────────────────────────── */
export function truncateResponse(text: string, maxChars = 8192): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  return truncated + "\n\n_[Response truncated for display]_";
}

/* ── Quality assessment ──────────────────────────────────────── */
export function assessQuality(response: string): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0.5;

  if (response.length > 100) { score += 0.1; reasons.push("Adequate length"); }
  if (response.length > 500) { score += 0.1; reasons.push("Detailed response"); }
  if (/```/.test(response)) { score += 0.1; reasons.push("Contains code"); }
  if (/\n/.test(response)) { score += 0.05; reasons.push("Structured with newlines"); }
  if (/[.!?]/.test(response)) { score += 0.05; reasons.push("Complete sentences"); }
  if (response.length < 20) { score -= 0.3; reasons.push("Response too short"); }
  if (/error|sorry|unable|cannot/i.test(response)) { score -= 0.1; reasons.push("Contains apology/error"); }

  return { score: Math.max(0, Math.min(1, score)), reasons };
}
