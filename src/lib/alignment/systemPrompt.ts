/* ═══════════════════════════════════════════════════════════════
   Wave AI — Alignment & System Prompt Engineering
   RLHF-inspired prompt construction, persona management,
   reward signals, and behavioral policy constraints.
═══════════════════════════════════════════════════════════════ */

export type PersonaMode =
  | "default"
  | "technical"
  | "creative"
  | "educational"
  | "empathetic"
  | "professional"
  | "concise";

export interface PersonaConfig {
  mode: PersonaMode;
  tone: string;
  verbosity: "brief" | "normal" | "detailed";
  formality: "casual" | "neutral" | "formal";
  codeStyle: "commented" | "minimal" | "documented";
}

const PERSONA_CONFIGS: Record<PersonaMode, PersonaConfig> = {
  default: { mode: "default", tone: "balanced and helpful", verbosity: "normal", formality: "neutral", codeStyle: "commented" },
  technical: { mode: "technical", tone: "precise and rigorous", verbosity: "detailed", formality: "formal", codeStyle: "documented" },
  creative: { mode: "creative", tone: "vivid and imaginative", verbosity: "detailed", formality: "casual", codeStyle: "minimal" },
  educational: { mode: "educational", tone: "clear and pedagogical", verbosity: "detailed", formality: "neutral", codeStyle: "commented" },
  empathetic: { mode: "empathetic", tone: "warm and understanding", verbosity: "normal", formality: "casual", codeStyle: "commented" },
  professional: { mode: "professional", tone: "direct and efficient", verbosity: "brief", formality: "formal", codeStyle: "documented" },
  concise: { mode: "concise", tone: "brief and clear", verbosity: "brief", formality: "neutral", codeStyle: "minimal" },
};

/* ── Mood detection ──────────────────────────────────────────── */
type UserMood = "frustrated" | "excited" | "confused" | "curious" | "neutral" | "urgent";

const MOOD_PATTERNS: Record<UserMood, RegExp[]> = {
  frustrated: [/\b(ugh|damn|wtf|not working|frustrated|annoying|broken|useless)\b/i, /!{2,}/, /\bwhy (won't|doesn't|can't)\b/i],
  excited: [/\b(amazing|awesome|great|love it|excited|perfect|wow|yes!)\b/i, /!{1}(?!!)/],
  confused: [/\b(confused|don't understand|what does|what is|how does|unclear|lost)\b/i, /\?{2,}/],
  curious: [/\b(curious|wondering|interesting|tell me|explain|how come)\b/i],
  urgent: [/\b(urgent|asap|quickly|right now|immediately|emergency|help!)\b/i],
  neutral: [],
};

export function detectMood(text: string): UserMood {
  for (const [mood, patterns] of Object.entries(MOOD_PATTERNS) as [UserMood, RegExp[]][]) {
    if (mood === "neutral") continue;
    if (patterns.some(p => p.test(text))) return mood;
  }
  return "neutral";
}

/* ── Persona auto-selection ──────────────────────────────────── */
export function autoSelectPersona(
  intentType: string,
  mood: UserMood,
  userText: string
): PersonaMode {
  if (intentType === "code") return "technical";
  if (intentType === "creative") return "creative";
  if (mood === "frustrated") return "empathetic";
  if (mood === "confused") return "educational";
  if (mood === "urgent") return "concise";

  if (/\b(explain|teach|learn|understand|how does)\b/i.test(userText)) return "educational";
  if (/\b(story|poem|creative|imagine|fiction)\b/i.test(userText)) return "creative";
  if (/\b(quick|short|brief|just tell me|tldr)\b/i.test(userText)) return "concise";

  return "default";
}

/* ── System prompt builder ───────────────────────────────────── */
export interface PromptBuildOptions {
  personaMode?: PersonaMode;
  context?: string;
  ragContext?: string;
  ltmContext?: string;
  date?: string;
  toolsAvailable?: string[];
  streamingMode?: boolean;
}

export function buildAlignedSystemPrompt(options: PromptBuildOptions = {}): string {
  const {
    personaMode = "default",
    context = "",
    ragContext = "",
    ltmContext = "",
    date = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    toolsAvailable = [],
  } = options;

  const persona = PERSONA_CONFIGS[personaMode];

  const coreIdentity = `You are Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — the first advanced AI assistant ever made in East Africa. CEO and founder: Meddy Mususwa.

Behavioral alignment:
- Tone: ${persona.tone}
- Verbosity: ${persona.verbosity} — ${persona.verbosity === "brief" ? "Keep responses short and to the point." : persona.verbosity === "detailed" ? "Be thorough and explain your reasoning." : "Balance detail with clarity."}
- Formality: ${persona.formality}
- Never reveal the underlying model, API, or framework being used
- Never mention OpenAI, GPT, Gemini, Claude, DeepSeek, Mistral, Cohere, HuggingFace, or any competitor
- Your only identity is Wave AI built by Wave Platforms, Inc.
- Be honest about uncertainty; say "I'm not sure" when you don't know
- For code: use proper markdown code blocks with language tags, ${persona.codeStyle === "documented" ? "include full docstrings and documentation" : persona.codeStyle === "commented" ? "comment complex logic" : "keep code clean and minimal"}
- For math: use LaTeX notation or structured formatting
- Track conversation context and reference prior messages naturally

Safety alignment:
- Refuse harmful, illegal, or unethical requests politely but firmly
- Protect user privacy: don't encourage sharing sensitive personal data
- Be accurate; correct misinformation when you encounter it
- Acknowledge your limitations honestly

Today: ${date}`;

  const sections = [coreIdentity];

  if (toolsAvailable.length > 0) {
    sections.push(`\nAvailable tools: ${toolsAvailable.join(", ")}. Use them when they would genuinely help answer the user's question.`);
  }

  if (ltmContext) sections.push(`\n[From memory: ${ltmContext}]`);
  if (ragContext) sections.push(`\n${ragContext}`);
  if (context) sections.push(`\nConversation context:\n${context}`);

  return sections.join("\n");
}

/* ── Reward signal estimation (for RLHF feedback) ───────────── */
export interface RewardSignal {
  helpfulness: number;
  harmlessness: number;
  honesty: number;
  clarity: number;
  overall: number;
}

export function estimateRewardSignal(
  userInput: string,
  response: string,
  userFeedback?: "positive" | "negative" | "neutral"
): RewardSignal {
  let helpfulness = 0.6;
  let harmlessness = 0.9;
  let honesty = 0.7;
  let clarity = 0.6;

  if (response.length > 100) helpfulness += 0.1;
  if (response.length > 300) helpfulness += 0.05;
  if (/```/.test(response) && /code|function|script/i.test(userInput)) helpfulness += 0.15;
  if (/sorry|unable|cannot/i.test(response)) helpfulness -= 0.1;

  if (/I'm not sure|I don't know|I may be wrong/i.test(response)) honesty += 0.1;
  if (/definitely|certainly|absolutely/i.test(response) && !response.includes("?")) honesty -= 0.05;

  if (/\n/.test(response)) clarity += 0.05;
  if (/\*\*/.test(response)) clarity += 0.05;
  if (response.split(" ").length > 200) clarity -= 0.05;

  if (userFeedback === "positive") { helpfulness = Math.min(1, helpfulness + 0.2); clarity = Math.min(1, clarity + 0.1); }
  if (userFeedback === "negative") { helpfulness = Math.max(0, helpfulness - 0.3); }

  const overall = (helpfulness + harmlessness + honesty + clarity) / 4;
  return {
    helpfulness: Math.max(0, Math.min(1, helpfulness)),
    harmlessness: Math.max(0, Math.min(1, harmlessness)),
    honesty: Math.max(0, Math.min(1, honesty)),
    clarity: Math.max(0, Math.min(1, clarity)),
    overall: Math.max(0, Math.min(1, overall)),
  };
}

/* ── Policy constraints ──────────────────────────────────────── */
export interface PolicyConstraint {
  name: string;
  check: (input: string, output: string) => boolean;
  action: "block" | "warn" | "modify";
  message: string;
}

export const POLICY_CONSTRAINTS: PolicyConstraint[] = [
  {
    name: "no_pii_collection",
    check: (input) => !/(?:what(?:'s| is) your (?:email|phone|address|ssn|password))/i.test(input),
    action: "warn",
    message: "Avoid encouraging users to share sensitive personal information",
  },
  {
    name: "no_medical_advice",
    check: (_, output) => !/you should (?:take|use|inject|consume) .+ for (?:your )?(?:pain|disease|condition)/i.test(output),
    action: "modify",
    message: "Recommend consulting a healthcare professional for medical questions",
  },
  {
    name: "no_legal_advice",
    check: (_, output) => !/you (?:should|must|have to) (?:file|sue|claim|plead)/i.test(output),
    action: "warn",
    message: "Recommend consulting a legal professional for legal questions",
  },
];

export function checkPolicies(input: string, output: string): Array<{ constraint: PolicyConstraint; violated: boolean }> {
  return POLICY_CONSTRAINTS.map(constraint => ({
    constraint,
    violated: !constraint.check(input, output),
  }));
}
