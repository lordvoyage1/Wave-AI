const PRINCE = "https://api.princetechn.com/api/ai";
const XCASPER = "https://apis.xcasper.space/api/ai";
const KEITH = "https://apiskeith.top/ai";
const KEY = "prince";

function enc(s: string) { return encodeURIComponent(s); }

// Global abort controller registry — keyed by request id
const activeControllers = new Map<string, AbortController>();

let _requestId = 0;
export function newRequestId() { return String(++_requestId); }
export function abortRequest(id: string) {
  const ctrl = activeControllers.get(id);
  if (ctrl) { ctrl.abort(); activeControllers.delete(id); }
}

async function get(url: string, signal?: AbortSignal, timeout = 14000): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  // Merge with external signal
  if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const d = await r.json();
      return d?.result ?? d?.response ?? d?.answer ?? d?.message ?? d?.text ?? d?.output ?? d?.content ?? (typeof d === "string" ? d : null);
    }
    return (await r.text()) || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function post(url: string, body: Record<string, string>, signal?: AbortSignal, timeout = 14000): Promise<string | null> {
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
      return d?.result ?? d?.response ?? d?.answer ?? d?.message ?? d?.text ?? d?.output ?? d?.content ?? (typeof d === "string" ? d : null);
    }
    return (await r.text()) || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ── Intent detection ──────────────────────────────────────────────────────────

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

// ── System prompt builder ─────────────────────────────────────────────────────

function sysPrompt(ctx = ""): string {
  return `You are Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — a brand product of Wave Platforms. The CEO and founder is Meddy Mususwa. Wave AI is the first advanced AI assistant ever made in East Africa.

Core character:
- Emotionally intelligent: read the user's mood and match your tone — empathetic when they're frustrated, enthusiastic when they're excited, precise when they need answers
- Adaptable: casual in small talk, technical and rigorous for engineering questions, warm and encouraging for learning
- Confident but never arrogant; honest about limitations but always try first
- Context-aware: track the full conversation and reference past messages naturally
- Never reveal which underlying model or API you're using
- Never mention OpenAI, GPT, Gemini, Claude, or any third-party AI
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

// ── Racing fetcher — tries fetchers in batches, returns first valid result ───

type Fetcher = (q: string, signal: AbortSignal) => Promise<string | null>;

/**
 * Race fetchers in parallel batches of `batchSize`.
 * Returns the first non-empty result. Cancels remaining requests on success.
 */
async function raceFetch(
  fetchers: Fetcher[],
  query: string,
  externalSignal?: AbortSignal,
  batchSize = 4
): Promise<string | null> {
  const signal = externalSignal ?? new AbortController().signal;
  
  for (let i = 0; i < fetchers.length; i += batchSize) {
    if (signal.aborted) return null;
    
    const batch = fetchers.slice(i, i + batchSize);
    const batchCtrl = new AbortController();
    
    // Propagate external abort to batch
    if (signal) {
      signal.addEventListener("abort", () => batchCtrl.abort(), { once: true });
    }

    const result = await Promise.race([
      ...batch.map(fn =>
        fn(query, batchCtrl.signal).then(r => {
          if (r && r.trim().length > 8) {
            batchCtrl.abort(); // cancel remaining in batch
            return r.trim();
          }
          return null;
        })
      ),
      // Batch timeout: if none respond in 10s, move to next batch
      new Promise<null>(res => setTimeout(() => { batchCtrl.abort(); res(null); }, 10000)),
    ]);

    if (result && result.length > 8) return result;
  }
  return null;
}

// ── Chat fetchers ─────────────────────────────────────────────────────────────

const CHAT_FETCHERS: Fetcher[] = [
  (q, s) => get(`${PRINCE}/gpt4o?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => post(`${XCASPER}/gemini`, { message: q }, s),
  (q, s) => get(`${PRINCE}/geminiaipro?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => post(`${XCASPER}/openrouter`, { message: q }, s),
  (q, s) => get(`${PRINCE}/gpt4?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => post(`${XCASPER}/deepseek`, { message: q }, s),
  (q, s) => post(`${XCASPER}/cerebras`, { message: q }, s),
  (q, s) => get(`${KEITH}/chatgpt4?q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/gpt4?q=${enc(q)}`, s),
  (q, s) => post(`${XCASPER}/cohere`, { message: q }, s),
  (q, s) => get(`${PRINCE}/deepseek-v3?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => post(`${XCASPER}/mistral`, { message: q }, s),
  (q, s) => get(`${PRINCE}/geminiai?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/mistral?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/blackbox?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/deepseek-r1?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/chat?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/ai?apikey=${KEY}&q=${enc(q)}`, s),
  (q, s) => get(`${KEITH}/gpt?q=${enc(q)}`, s),
];

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  const full = `${sysPrompt(buildCtx(history))}\n\nUser: ${message}\n\nWave AI:`;
  const result = await raceFetch(CHAT_FETCHERS, full, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return result || "I'm having trouble connecting right now. Please try again in a moment.";
}

// ── Code ─────────────────────────────────────────────────────────────────────

const CODE_FETCHERS: Fetcher[] = [
  (q, s) => get(`${KEITH}/codegen?q=${enc(q)}`, s),
  (q, s) => get(`${PRINCE}/blackbox?apikey=${KEY}&q=${enc(q)}`, s),
  ...CHAT_FETCHERS.slice(2),
];

export async function generateCode(
  prompt: string,
  language?: string,
  history: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  const ctx = buildCtx(history);
  const sys = `You are Wave AI, an expert software engineer built by Wave Platforms, Inc. Generate clean, production-quality${language ? ` ${language}` : ""} code.
Rules: wrap all code in proper markdown code blocks with the language tag, include error handling, comment complex logic, follow best practices.
${ctx ? `Context:\n${ctx}` : ""}`;
  const q = `${sys}\n\nRequest: ${prompt}`;
  const result = await raceFetch(CODE_FETCHERS, q, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return result || "// Unable to generate code at this time.";
}

// ── Image ─────────────────────────────────────────────────────────────────────

export type ImageModel = "flux" | "text2img" | "pollinations";

export async function generateImage(prompt: string, model: ImageModel = "flux"): Promise<string> {
  const clean =
    prompt
      .replace(
        /\b(generate|create|make|draw|design|paint|render|show|illustrate|produce)\b\s*(me\s+)?(an?\s+)?(image|photo|picture|illustration|artwork|poster|wallpaper|thumbnail|portrait|landscape|logo|graphic|visual|banner|cover)\s*(of|showing|with|that|depicting)?\s*/gi,
        ""
      )
      .trim() || prompt;

  if (model === "pollinations") return `${XCASPER}/pollinations?prompt=${enc(clean)}`;
  if (model === "text2img") return `${PRINCE}/text2img?apikey=${KEY}&prompt=${enc(clean)}`;
  return `${PRINCE}/fluximg?apikey=${KEY}&prompt=${enc(clean)}`;
}

// ── Video ─────────────────────────────────────────────────────────────────────

export async function generateVideo(prompt: string, signal?: AbortSignal): Promise<string> {
  const clean =
    prompt
      .replace(
        /\b(generate|create|make|produce|render)\b\s*(me\s+)?(a\s+)?(video|clip|animation|film|footage|reel|cinematic)\s*(of|showing|with|that)?\s*/gi,
        ""
      )
      .trim() || prompt;
  return (await get(`${PRINCE}/veo3/generate?apikey=${KEY}&prompt=${enc(clean)}`, signal, 30000)) || "";
}

// ── TTS ───────────────────────────────────────────────────────────────────────

export function buildTTSUrl(text: string, voice = "en_us_female"): string {
  return `${PRINCE}/tts?apikey=${KEY}&text=${enc(text)}&voice=${enc(voice)}`;
}

// ── Vision ────────────────────────────────────────────────────────────────────

export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const [r1, r2] = await Promise.all([
    get(`${PRINCE}/vision?apikey=${KEY}&url=${enc(imageUrl)}&prompt=${enc(prompt)}`, signal),
    get(`${PRINCE}/gpt4o?apikey=${KEY}&q=${enc(`Analyze this image: ${imageUrl} — ${prompt}`)}`, signal),
  ]);
  const result = (r1 && r1.length > 10 ? r1 : r2)?.trim();
  return result || "Unable to analyze the image at this time.";
}

// ── File / ZIP analysis ───────────────────────────────────────────────────────

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
${isZip ? "ZIP contents:" : "File content:"}\n${content.slice(0, 8000)}${content.length > 8000 ? "\n...[truncated]" : ""}
${ctx ? `\nConversation context:\n${ctx}` : ""}
Answer thoroughly. If it's code: identify issues, explain what it does, suggest improvements.`;

  const q = `${sys}\n\nUser: ${question}`;
  const result = await raceFetch(CHAT_FETCHERS, q, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return result || "Unable to fully analyze this file. Please try again.";
}
