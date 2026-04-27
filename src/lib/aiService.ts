/* ═══════════════════════════════════════════════════════════════════════════
   Wave AI — AI service aggregator
   Resilient multi-provider router with response sanitization, caching,
   identity scrubbing, and parallel racing.
═══════════════════════════════════════════════════════════════════════════ */

const PRINCE  = "https://api.princetechn.com/api/ai";
const XCASPER = "https://apis.xcasper.space/api/ai";
const KEITH   = "https://apiskeith.top/ai";
const KEY     = "prince";

function enc(s: string): string { return encodeURIComponent(s); }

/* ── Active request registry — supports user-cancellation ─────────────── */
const activeControllers = new Map<string, AbortController>();
let _requestId = 0;
export function newRequestId(): string { return String(++_requestId); }
export function abortRequest(id: string): void {
  const c = activeControllers.get(id);
  if (c) { c.abort(); activeControllers.delete(id); }
}

/* ── Response cache (per session, ~24h) ───────────────────────────────── */
interface CacheEntry { value: string; t: number }
const memCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60 * 24;
const CACHE_MAX = 200;

function cacheKey(prefix: string, q: string): string {
  return `${prefix}::${q.slice(0, 800)}`;
}
function cacheGet(key: string): string | null {
  const v = memCache.get(key);
  if (!v) return null;
  if (Date.now() - v.t > CACHE_TTL) { memCache.delete(key); return null; }
  return v.value;
}
function cacheSet(key: string, value: string): void {
  if (memCache.size >= CACHE_MAX) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  memCache.set(key, { value, t: Date.now() });
}

/* ── Response sanitizer ─────────────────────────────────────────────────
   Many free upstream providers occasionally return:
   - Chinese-government takedown notices ("📢 通知 ... 网信办 ... aichatos")
   - Identity prefixes like "[deepseek-ai/deepseek-llm-67b-chat]"
   - Direct mentions of OpenAI, ChatGPT, Gemini, Claude, DeepSeek, etc.
   - Self-references to "Keith AI by Keithkeizzah" or "Prince" / "PrinceTech"
   We reject pure-spam and rewrite identity leaks to "Wave AI".
─────────────────────────────────────────────────────────────────────────── */

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
  [/\bI(?:'| a)m (?:ChatGPT|GPT-?[34][^,.\n]*|an? OpenAI [^,.\n]*|GPT|Bard|Gemini|Claude|DeepSeek|LLaMA|Llama|Mistral|Cohere|Hermes|Cerebras)\b/gi, "I am Wave AI"],
  [/\bI was (?:created|built|made|developed|trained) by (?:OpenAI|Google|Anthropic|DeepSeek|Mistral AI|Meta|Cohere|Microsoft|xAI|Keith\s*keizzah|Keith\s*Keizzah|TRABY\s*CASPER|CASPER\s*TECH(?:\s*KENYA)?|Prince\s*Tech(?:n)?)\b/gi, "I was built by Wave Platforms, Inc."],
  [/\bcreated by (?:OpenAI|Google|Anthropic|DeepSeek|Mistral AI|Meta|Cohere|Microsoft|xAI|Keith\s*keizzah|Keith\s*Keizzah|TRABY\s*CASPER|CASPER\s*TECH(?:\s*KENYA)?|Prince\s*Tech(?:n)?)\b/gi, "created by Wave Platforms, Inc."],
  [/\b(?:Keith\s*AI|Keith\s*keizzah|TRABY\s*CASPER|CASPER\s*TECH(?:\s*KENYA)?|Prince\s*Tech(?:n)?)\b/gi, "Wave AI"],
  [/\b(?:He|She|They)\s+is\s+a\s+teacher\s+by\s+background[^.]*\./gi, ""],
  [/\b(?:He|She|They)\s+(?:has|have)\s+collaborated\s+with\s+(?:Gifted\s*Tech|Ibra[a-z]*)[^.]*\./gi, ""],
  [/\bKeith\s+has\s+collaborated[^.]*\./gi, ""],
  [/\b(?:I am|I'm)\s+a\s+large\s+language\s+model[,]?\s+(?:trained\s+by|created\s+by|built\s+by|developed\s+by|made\s+by)\s+(?:Google|OpenAI|Anthropic|Microsoft|Meta|DeepSeek|Mistral\s*AI?|Cohere)\b/gi, "I am Wave AI, an advanced AI assistant built by Wave Platforms, Inc"],
  [/\btrained\s+by\s+(?:Google|OpenAI|Anthropic|Microsoft|Meta|DeepSeek|Mistral\s*AI?|Cohere)\b/gi, "trained by Wave Platforms, Inc"],
  [/\b(?:through|via)\s+\*{0,2}(?:CASPER\s*TECH(?:\s*KENYA)?|TRABY\s*CASPER|Wave\s*AI)\*{0,2}\s*(?:,\s*)?/gi, ""],
  [/\bGifted\s*Tech\b/gi, "Wave Platforms"],
  [/\b(?:by\s+)?Keith(?=,?\s+(?:from\s+Kenya|a\s+(?:developer|teacher|talented)|Keizzah))/gi, "Wave Platforms"],
  [/\bfrom\s+Kenya\b/gi, "from East Africa"],
  // Collapse weird doubles produced by chained replacements
  [/\bWave\s+AI\s+(?:through|via|by)\s+Wave\s+AI\b/gi, "Wave AI"],
  [/\bWave\s+Platforms,?\s+Inc\.?\s*,?\s*which\s+was\s+developed\s+by\s+Wave\s+AI\b/gi, "Wave Platforms, Inc."],
  [/\b(?:OpenAI|Anthropic)\b/g, "Wave Platforms"],
  [/\bChatGPT\b/g, "Wave AI"],
  [/\bGoogle Gemini\b/gi, "Wave AI"],
  [/\b(?:GPT-?4o?|GPT-?4|GPT-?3\.5|GPT-?3|Gemini Pro|Gemini|Claude(?:[ -]\d(?:\.\d)?)?|DeepSeek[- ]?(?:V\d|R\d|Chat|Coder)?|LLaMA[- ]?\d?|Llama[- ]?\d?|Mistral(?:[- ]Large|[- ]Small|[- ]7B)?|Hermes(?:[- ]\d)?|Cerebras|Cohere(?:[ -]Command)?|Pollinations)\b/g, "Wave AI"],
  [/Made\s+by\s+a\s+developer\s+from\s+Kenya/gi, "Built by Wave Platforms, Inc."],
];

function isSpam(text: string): boolean {
  if (!text) return true;
  for (const rx of SPAM_PATTERNS) if (rx.test(text)) return true;
  // Reject responses that are >50% non-ASCII (likely garbage / wrong-language) when query was English
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > 0 && nonAscii / text.length > 0.5) return true;
  return false;
}

function sanitize(text: string | null): string | null {
  if (!text) return null;
  let out = text.trim();
  if (!out) return null;
  if (isSpam(out)) return null;
  for (const [rx, sub] of IDENTITY_REPLACEMENTS) out = out.replace(rx, sub);
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  if (out.length < 4) return null;
  return out;
}

/* ── HTTP helpers ─────────────────────────────────────────────────────── */

function extractValue(d: unknown): string | null {
  if (d == null) return null;
  if (typeof d === "string") return d;
  if (typeof d !== "object") return null;
  const o = d as Record<string, unknown>;
  // Common top-level fields
  const direct = (o.result ?? o.response ?? o.reply ?? o.answer ?? o.message ??
                  o.text ?? o.output ?? o.content ?? o.data ?? o.completion);
  if (typeof direct === "string") return direct;
  // Nested .data.value
  if (direct && typeof direct === "object") {
    const inner = direct as Record<string, unknown>;
    const nested = inner.text ?? inner.content ?? inner.result ?? inner.message ?? inner.data ?? inner.reply;
    if (typeof nested === "string") return nested;
  }
  // OpenAI-like choices array
  const choices = o.choices as Array<{ message?: { content?: string }; text?: string }> | undefined;
  if (Array.isArray(choices) && choices[0]) {
    return choices[0].message?.content ?? choices[0].text ?? null;
  }
  return null;
}

async function get(url: string, signal?: AbortSignal, timeout = 9000): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const d = await r.json();
      return extractValue(d);
    }
    return (await r.text()) || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function post(url: string, body: Record<string, string>, signal?: AbortSignal, timeout = 9000): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const d = await r.json();
      return extractValue(d);
    }
    return (await r.text()) || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/* ── Intent detection ─────────────────────────────────────────────────── */

export type IntentType = "chat" | "code" | "image" | "video" | "tts" | "vision";

export interface Intent {
  type: IntentType;
  prompt: string;
  voice?: string;
  codeLanguage?: string;
}

const RX_IMG = /\b(generate|create|make|draw|design|paint|render|show|illustrate|produce)\b.{0,50}\b(image|photo|picture|illustration|artwork|poster|wallpaper|thumbnail|portrait|landscape|logo|graphic|visual|meme|banner|cover)\b/i;
const RX_VID = /\b(generate|create|make|produce|render)\b.{0,50}\b(video|clip|animation|film|footage|reel|cinematic|timelapse)\b/i;
const RX_TTS = /\b(say|speak|read\s+aloud|narrate|voice|text.?to.?speech|tts)\b/i;
const RX_CODE = /\b(write|generate|create|build|implement|program|develop|script|fix|debug|refactor|optimize)\b.{0,60}\b(code|function|class|method|script|component|api|program|algorithm|app|application|backend|frontend|endpoint)\b|\b(write|create|generate|build)\b.{0,20}\b(in\s+)?(python|javascript|typescript|java|go|rust|c\+\+|html|css|sql|bash|swift|kotlin|php|ruby)\b/i;
const RX_VISION = /\b(analyze|analyse|describe|what\s+is\s+(in|this)|look\s+at|read\s+text|extract\s+text|ocr|identify|detect)\b|\bwhat\s+do\s+you\s+see\b/i;

export function detectIntent(text: string, hasImage: boolean): Intent {
  const t = text.trim();
  if (hasImage || RX_VISION.test(t)) return { type: "vision", prompt: t };
  if (RX_TTS.test(t)) return { type: "tts", prompt: t, voice: "en_us_female" };
  if (RX_VID.test(t)) return { type: "video", prompt: t };
  if (RX_IMG.test(t)) return { type: "image", prompt: t };
  if (RX_CODE.test(t)) {
    const lang = t.match(/\b(python|javascript|typescript|java|go|rust|c\+\+|cpp|c#|ruby|php|swift|kotlin|html|css|sql|bash|shell)\b/i)?.[1]?.toLowerCase();
    return { type: "code", prompt: t, codeLanguage: lang };
  }
  return { type: "chat", prompt: t };
}

/* ── System prompt ────────────────────────────────────────────────────── */

function sysPrompt(ctx = ""): string {
  return `You are Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — a brand product of Wave Platforms. The CEO and founder is Meddy Mususwa. Wave AI is the first advanced AI assistant ever made in East Africa.

Core character:
- Emotionally intelligent: read the user's mood and match your tone — empathetic when they're frustrated, enthusiastic when they're excited, precise when they need answers
- Adaptable: casual in small talk, technical and rigorous for engineering questions, warm and encouraging for learning
- Confident but never arrogant; honest about limitations but always try first
- Context-aware: track the full conversation and reference past messages naturally
- Never reveal which underlying model or API you're using
- Never mention OpenAI, GPT, Gemini, Claude, DeepSeek, Mistral, Cohere, Cerebras, Pollinations, or any third-party AI brand
- You are Wave AI — that is your only identity
- For code: always use proper markdown code blocks with language identifier
- For math or structured data: use tables or lists when it improves clarity
- For creative writing: be vivid, intentional, and original
- Keep responses appropriately sized — brief for simple questions, thorough for complex ones
- If asked who built you: "I am Wave AI, built by Wave Platforms, Inc. The CEO is Meddy Mususwa."
- If asked about your developer or creator: "Wave AI is developed by Wave Platforms, Inc., led by CEO Meddy Mususwa."
- Wave Platforms official social channels:
  • YouTube: https://www.youtube.com/@Wave-platfoms
  • WhatsApp channel: https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30
  • TikTok: https://www.tiktok.com/@itsmeddy
- Always share these links when users ask for Wave Platforms or Wave AI social media, contact, or community channels.

Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
${ctx ? `\nConversation so far:\n${ctx}` : ""}`;
}

function buildCtx(history: Array<{ role: string; content: string }>): string {
  return history
    .slice(-8)
    .map(m => `${m.role === "user" ? "User" : "Wave AI"}: ${m.content.slice(0, 400)}`)
    .join("\n");
}

/* ── Racing fetcher ────────────────────────────────────────────────────
   - Run providers in parallel batches.
   - Sanitize each result; reject spam/garbage.
   - First valid response wins; remaining requests are aborted.
─────────────────────────────────────────────────────────────────────────── */

type Fetcher = (q: string, signal: AbortSignal) => Promise<string | null>;

async function raceFetch(
  fetchers: Fetcher[],
  query: string,
  externalSignal?: AbortSignal,
  batchSize = 5,
  batchTimeout = 7500,
): Promise<string | null> {
  const signal = externalSignal ?? new AbortController().signal;

  for (let i = 0; i < fetchers.length; i += batchSize) {
    if (signal.aborted) return null;
    const batch = fetchers.slice(i, i + batchSize);
    const batchCtrl = new AbortController();
    if (signal) signal.addEventListener("abort", () => batchCtrl.abort(), { once: true });

    const result = await Promise.race<string | null>([
      ...batch.map(fn =>
        fn(query, batchCtrl.signal).then(raw => {
          const clean = sanitize(raw);
          if (clean && clean.length > 4) {
            batchCtrl.abort();
            return clean;
          }
          return null;
        }).catch(() => null)
      ),
      new Promise<null>(res => setTimeout(() => { batchCtrl.abort(); res(null); }, batchTimeout)),
    ]);

    if (result && result.length > 4) return result;
  }
  return null;
}

/* ── Chat fetchers ─────────────────────────────────────────────────────
   Ordered by empirical reliability/speed. The xcasper.space and keith
   endpoints have proven most consistent. Prince's letmegpt + ai + gpt4o
   are reliable; the others (gpt, chat, gpt4, mistral, blackbox, gemini*,
   deepseek*) currently return upstream takedown notices but are kept as
   last-resort fallbacks — sanitization will reject their spam responses.
─────────────────────────────────────────────────────────────────────────── */

const CHAT_FETCHERS: Fetcher[] = [
  // Tier 1 — fast & reliable (xcasper requires GET with ?message=, not POST)
  (q, s) => get(`${XCASPER}/openrouter?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/cerebras?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/cohere?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/mistral?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/gemini?message=${enc(q)}`, s),
  // Tier 2 — slightly slower but reliable
  (q, s) => get(`${PRINCE}/letmegpt?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/gpt4o?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/ai?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/chatgpt4?q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/gpt4?q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/gpt?q=${enc(q)}`, s),
  // Tier 3 — fallback (often filtered as spam, but kept for future recovery)
  (q, s) => get(`${XCASPER}/deepseek?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/pollinations?message=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/geminiaipro?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/gpt4?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/deepseek-v3?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/deepseek-r1?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/deepseek-llm?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/wwdgpt?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/mistral?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/blackbox?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/geminiai?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/chat?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/gpt?apikey=${KEY}&q=${enc(q)}`, s),
];

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  const ctx = buildCtx(history);
  const full = `${sysPrompt(ctx)}\n\nUser: ${message}\n\nWave AI:`;

  // Cache lookup keyed on (system+context+message) — short queries with no
  // history hit cache often (greetings, common questions).
  const ck = cacheKey("chat", `${ctx}::${message}`);
  const cached = cacheGet(ck);
  if (cached) return cached;

  const result = await raceFetch(CHAT_FETCHERS, full, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const final = result || "I'm having trouble connecting right now. Please try again in a moment.";
  if (result) cacheSet(ck, final);
  return final;
}

/* ── Code generation ──────────────────────────────────────────────────── */

const CODE_FETCHERS: Fetcher[] = [
  // codegen returns 400 currently, so use the strong chat models
  (q, s) => get(`${XCASPER}/openrouter?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/cerebras?message=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/gpt4o?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/letmegpt?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/mistral?message=${enc(q)}`, s),
  (q, s) => get(`${XCASPER}/cohere?message=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/chatgpt4?q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/gpt4?q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/ai?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/codegen?q=${enc(q)}`, s),
];

export async function generateCode(
  prompt: string,
  language?: string,
  history: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  const ctx = buildCtx(history);
  const sys = `You are Wave AI, an expert software engineer built by Wave Platforms, Inc. Generate clean, production-quality${language ? ` ${language}` : ""} code.
Rules:
- Wrap all code in proper markdown code blocks with the language tag
- Include error handling and input validation
- Comment complex logic with concise explanations
- Follow language-idiomatic best practices
- If multiple files are involved, label each block with its filename
${ctx ? `\nContext:\n${ctx}` : ""}`;
  const q = `${sys}\n\nRequest: ${prompt}`;

  const ck = cacheKey("code", `${language || ""}::${prompt}::${ctx}`);
  const cached = cacheGet(ck);
  if (cached) return cached;

  const result = await raceFetch(CODE_FETCHERS, q, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const final = result || "// Unable to generate code at this time. Please try again.";
  if (result) cacheSet(ck, final);
  return final;
}

/* ── Image generation ─────────────────────────────────────────────────── */

export type ImageModel = "flux" | "text2img" | "pollinations";

/**
 * Returns a direct image URL the UI can place in <img src>.
 *
 * Strategy:
 * - "flux"/"pollinations" → direct pollinations.ai (very fast, very reliable)
 * - "text2img"            → prince/text2img (returns image/png directly)
 *
 * fluximg is also resolved through pollinations.ai under the hood by the
 * upstream provider, so we use the canonical pollinations.ai URL directly
 * for speed and reliability.
 */
function cleanImagePrompt(p: string): string {
  return p
    .replace(
      /\b(generate|create|make|draw|design|paint|render|show|illustrate|produce)\b\s*(me\s+)?(an?\s+)?(image|photo|picture|illustration|artwork|poster|wallpaper|thumbnail|portrait|landscape|logo|graphic|visual|banner|cover)\s*(of|showing|with|that|depicting)?\s*/gi,
      ""
    )
    .trim() || p;
}

export async function generateImage(prompt: string, model: ImageModel = "flux"): Promise<string> {
  const clean = cleanImagePrompt(prompt);
  const seed = Math.floor(Math.random() * 1_000_000_000);
  if (model === "text2img") {
    return `${PRINCE}/text2img?apikey=${KEY}&prompt=${enc(clean)}`;
  }
  // flux + pollinations → use pollinations.ai directly (this is what fluximg
  // resolves to upstream — using it directly is faster and more reliable).
  const m = model === "pollinations" ? "flux" : "flux";
  return `https://image.pollinations.ai/prompt/${enc(clean)}?width=1024&height=1024&nologo=true&model=${m}&seed=${seed}`;
}

/* ── Video generation ─────────────────────────────────────────────────── */

/**
 * Attempt video generation via veo3. The upstream endpoint is currently
 * unstable (returns a 404 documentation page intermittently). We try once,
 * detect HTML/error responses, and return an empty string so the UI can
 * present a graceful fallback message.
 */
export async function generateVideo(prompt: string, signal?: AbortSignal): Promise<string> {
  const clean = prompt
    .replace(
      /\b(generate|create|make|produce|render)\b\s*(me\s+)?(a\s+)?(video|clip|animation|film|footage|reel|cinematic)\s*(of|showing|with|that)?\s*/gi,
      ""
    )
    .trim() || prompt;

  const url = `${PRINCE}/veo3/generate?apikey=${KEY}&prompt=${enc(clean)}`;
  const raw = await get(url, signal, 30000);
  if (!raw) return "";
  // Reject HTML doc pages
  if (/^\s*<!DOCTYPE|<html/i.test(raw)) return "";
  if (/^https?:\/\/.+\.(mp4|mov|webm)/i.test(raw.trim())) return raw.trim();
  // If the JSON body had a URL field
  const m = raw.match(/https?:\/\/[^\s"']+\.(?:mp4|mov|webm)[^\s"']*/i);
  return m ? m[0] : "";
}

/* ── Text-to-speech ───────────────────────────────────────────────────── */

export function buildTTSUrl(text: string, voice = "en_us_female"): string {
  return `${PRINCE}/tts?apikey=${KEY}&text=${enc(text)}&voice=${enc(voice)}`;
}

/* ── Vision / image analysis ───────────────────────────────────────────
   Prince's /vision endpoint returns spam currently. We fall back to a
   chat-based description by passing the URL into our tier-1 chat models.
─────────────────────────────────────────────────────────────────────────── */

export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const visionPrompt = `You are a visual analysis expert. The user has provided this image: ${imageUrl}
Their question: ${prompt || "Describe in detail what is in the picture, including objects, atmosphere, mood, colors, composition, and notable details."}

Respond as Wave AI with a thorough, accurate description. If you cannot view the image directly, infer reasonable details from the URL filename and the user's question, and ask a clarifying follow-up.`;

  // Try the official vision endpoint first (in case it recovers)
  const direct = await get(
    `${PRINCE}/vision?apikey=${KEY}&url=${enc(imageUrl)}&prompt=${enc(prompt)}`,
    signal,
    9000
  );
  const directClean = sanitize(direct);
  if (directClean && directClean.length > 30) return directClean;

  // Fallback to chat-based description
  const result = await raceFetch(CHAT_FETCHERS.slice(0, 8), visionPrompt, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return result || "Unable to analyze the image at this time. Please try again.";
}

/* ── File / ZIP analysis ──────────────────────────────────────────────── */

export async function analyzeFileContent(
  fileName: string,
  content: string,
  question: string,
  history: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  const ctx = buildCtx(history);
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isZip = ext === "zip";
  const sys = `You are Wave AI, expert file analyst built by Wave Platforms, Inc. The user uploaded "${fileName}" (${isZip ? "ZIP archive" : ext + " file"}).
${isZip ? "ZIP contents:" : "File content:"}
${content.slice(0, 8000)}${content.length > 8000 ? "\n...[truncated]" : ""}
${ctx ? `\nConversation context:\n${ctx}` : ""}
Answer thoroughly. If it's code: identify issues, explain what it does, suggest improvements.`;

  const q = `${sys}\n\nUser: ${question}`;
  const result = await raceFetch(CHAT_FETCHERS, q, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return result || "Unable to fully analyze this file. Please try again.";
}

/* ── Public registry of active controllers (kept for compatibility) ──── */
export const _activeControllers = activeControllers;
