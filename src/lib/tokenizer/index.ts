/* ═══════════════════════════════════════════════════════════════
   Wave AI — Tokenizer Layer
   BPE-style tokenization, token counting, truncation, encoding
═══════════════════════════════════════════════════════════════ */

export interface Token {
  id: number;
  text: string;
  bytes: Uint8Array;
}

export interface TokenizerResult {
  tokens: string[];
  tokenIds: number[];
  count: number;
  truncated: boolean;
  originalLength: number;
}

export interface TokenizerOptions {
  maxTokens?: number;
  addSpecialTokens?: boolean;
  truncationSide?: "left" | "right";
}

/* ── Vocabulary constants ───────────────────────────────────── */
const SPECIAL_TOKENS = {
  BOS: "<s>",
  EOS: "</s>",
  PAD: "<pad>",
  UNK: "<unk>",
  SEP: "[SEP]",
  CLS: "[CLS]",
  MASK: "[MASK]",
  INST_START: "[INST]",
  INST_END: "[/INST]",
  SYS_START: "<<SYS>>",
  SYS_END: "<</SYS>>",
};

/* ── Basic word-piece tokenizer approximation ───────────────── */
const PUNCT_SPLIT = /([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
const WHITESPACE = /\s+/g;

function splitIntoWords(text: string): string[] {
  return text
    .replace(WHITESPACE, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function splitWordPieces(word: string): string[] {
  if (word.length <= 3) return [word];
  const pieces: string[] = [];
  const punct = word.split(PUNCT_SPLIT).filter(Boolean);
  for (let i = 0; i < punct.length; i++) {
    const p = punct[i];
    if (i === 0) pieces.push(p);
    else pieces.push("##" + p);
  }
  return pieces.length > 0 ? pieces : [word];
}

/* ── Approximate token count (4 chars ≈ 1 token for English) ── */
export function approximateTokenCount(text: string): number {
  if (!text) return 0;
  const words = splitIntoWords(text);
  let count = 0;
  for (const word of words) {
    if (word.length <= 3) count += 1;
    else if (word.length <= 6) count += 1;
    else count += Math.ceil(word.length / 4);
  }
  return count;
}

/* ── Tokenize ───────────────────────────────────────────────── */
export function tokenize(
  text: string,
  options: TokenizerOptions = {}
): TokenizerResult {
  const {
    maxTokens = 4096,
    addSpecialTokens = false,
    truncationSide = "right",
  } = options;

  const words = splitIntoWords(text);
  let allPieces: string[] = [];

  for (const word of words) {
    allPieces.push(...splitWordPieces(word));
  }

  if (addSpecialTokens) {
    allPieces = [SPECIAL_TOKENS.BOS, ...allPieces, SPECIAL_TOKENS.EOS];
  }

  const originalLength = allPieces.length;
  let truncated = false;

  if (allPieces.length > maxTokens) {
    truncated = true;
    if (truncationSide === "right") {
      allPieces = allPieces.slice(0, maxTokens);
    } else {
      allPieces = allPieces.slice(allPieces.length - maxTokens);
    }
  }

  const tokenIds = allPieces.map((_, i) => i + 1000);

  return {
    tokens: allPieces,
    tokenIds,
    count: allPieces.length,
    truncated,
    originalLength,
  };
}

/* ── Detokenize ─────────────────────────────────────────────── */
export function detokenize(tokens: string[]): string {
  return tokens
    .filter(t => !Object.values(SPECIAL_TOKENS).includes(t))
    .join(" ")
    .replace(/\s+##/g, "")
    .replace(/\s+([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, "$1")
    .trim();
}

/* ── Truncate text to token limit ───────────────────────────── */
export function truncateToTokens(
  text: string,
  maxTokens: number,
  side: "left" | "right" = "right"
): string {
  const result = tokenize(text, { maxTokens, truncationSide: side });
  if (!result.truncated) return text;
  return detokenize(result.tokens);
}

/* ── Mistral prompt format ──────────────────────────────────── */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function formatMistralPrompt(messages: ChatMessage[]): string {
  let prompt = "";
  let systemContent = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "system") {
      systemContent = msg.content;
    } else if (msg.role === "user") {
      const content = systemContent && i <= 1
        ? `${SPECIAL_TOKENS.SYS_START}\n${systemContent}\n${SPECIAL_TOKENS.SYS_END}\n\n${msg.content}`
        : msg.content;
      prompt += `${SPECIAL_TOKENS.BOS}${SPECIAL_TOKENS.INST_START} ${content} ${SPECIAL_TOKENS.INST_END}`;
      systemContent = "";
    } else if (msg.role === "assistant") {
      prompt += ` ${msg.content}${SPECIAL_TOKENS.EOS}`;
    }
  }

  return prompt;
}

/* ── Llama-2 prompt format ──────────────────────────────────── */
export function formatLlamaPrompt(messages: ChatMessage[]): string {
  const lines: string[] = [];
  let sysMsg = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      sysMsg = msg.content;
    } else if (msg.role === "user") {
      const content = sysMsg
        ? `${SPECIAL_TOKENS.SYS_START}\n${sysMsg}\n${SPECIAL_TOKENS.SYS_END}\n\n${msg.content}`
        : msg.content;
      lines.push(`${SPECIAL_TOKENS.BOS}${SPECIAL_TOKENS.INST_START} ${content} ${SPECIAL_TOKENS.INST_END}`);
      sysMsg = "";
    } else if (msg.role === "assistant") {
      lines.push(` ${msg.content} ${SPECIAL_TOKENS.EOS}`);
    }
  }

  return lines.join("");
}

/* ── Token budget manager ───────────────────────────────────── */
export class TokenBudget {
  private used: number = 0;
  constructor(private total: number) {}

  allocate(text: string): boolean {
    const tokens = approximateTokenCount(text);
    if (this.used + tokens > this.total) return false;
    this.used += tokens;
    return true;
  }

  remaining(): number {
    return Math.max(0, this.total - this.used);
  }

  reset(): void {
    this.used = 0;
  }

  get utilization(): number {
    return this.used / this.total;
  }
}

export { SPECIAL_TOKENS };
