/* ═══════════════════════════════════════════════════════════════
   Wave AI — Inference Router
   Smart routing between HuggingFace primary backbone and fallback
   providers. Handles load balancing, circuit breaking, retries.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";
import { chatCompletion, generateCode as hfGenerateCode } from "@/lib/providers/huggingface";
import { sendChatMessage, generateCode as legacyGenerateCode } from "@/lib/aiService";

export type Provider = "huggingface" | "xcasper" | "prince" | "keith" | "fallback";

export interface RouterDecision {
  provider: Provider;
  model: string;
  reason: string;
  estimatedLatencyMs: number;
}

export interface RouterResult {
  text: string;
  provider: Provider;
  model: string;
  latencyMs: number;
  retries: number;
  cached: boolean;
}

/* ── Circuit breaker ─────────────────────────────────────────── */
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuits = new Map<Provider, CircuitState>();
const FAILURE_THRESHOLD = 3;
const RECOVERY_TIME_MS = 30000;

function getCircuit(provider: Provider): CircuitState {
  if (!circuits.has(provider)) {
    circuits.set(provider, { failures: 0, lastFailure: 0, state: "closed" });
  }
  return circuits.get(provider)!;
}

function recordSuccess(provider: Provider): void {
  const c = getCircuit(provider);
  c.failures = 0;
  c.state = "closed";
}

function recordFailure(provider: Provider): void {
  const c = getCircuit(provider);
  c.failures++;
  c.lastFailure = Date.now();
  if (c.failures >= FAILURE_THRESHOLD) c.state = "open";
}

function isAvailable(provider: Provider): boolean {
  const c = getCircuit(provider);
  if (c.state === "closed") return true;
  if (c.state === "half-open") return true;
  if (c.state === "open") {
    if (Date.now() - c.lastFailure > RECOVERY_TIME_MS) {
      c.state = "half-open";
      return true;
    }
    return false;
  }
  return true;
}

/* ── Latency tracker ─────────────────────────────────────────── */
const latencyHistory = new Map<Provider, number[]>();

function recordLatency(provider: Provider, ms: number): void {
  const hist = latencyHistory.get(provider) ?? [];
  hist.push(ms);
  if (hist.length > 20) hist.shift();
  latencyHistory.set(provider, hist);
}

function getAvgLatency(provider: Provider): number {
  const hist = latencyHistory.get(provider) ?? [];
  if (hist.length === 0) return 3000;
  return hist.reduce((a, b) => a + b, 0) / hist.length;
}

/* ── Provider selection ──────────────────────────────────────── */
export function selectProvider(
  hasApiKey: boolean,
  intentType: string,
  preferFast = false
): RouterDecision {
  if (hasApiKey && isAvailable("huggingface")) {
    if (intentType === "code") {
      return {
        provider: "huggingface",
        model: WAVE_CONFIG.huggingface.models.code,
        reason: "HuggingFace Codestral selected for code generation",
        estimatedLatencyMs: getAvgLatency("huggingface"),
      };
    }
    return {
      provider: "huggingface",
      model: WAVE_CONFIG.huggingface.models.chat,
      reason: "HuggingFace Mistral 7B selected as primary backbone",
      estimatedLatencyMs: getAvgLatency("huggingface"),
    };
  }

  return {
    provider: "fallback",
    model: "multi-provider",
    reason: "Using fallback multi-provider routing",
    estimatedLatencyMs: getAvgLatency("fallback"),
  };
}

/* ── Route with retry ────────────────────────────────────────── */
export async function routeGeneration(
  messages: Array<{ role: string; content: string }>,
  intentType: string,
  apiKey?: string,
  signal?: AbortSignal,
  maxRetries = 2
): Promise<RouterResult> {
  const start = performance.now();
  const decision = selectProvider(!!apiKey, intentType);
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      if (decision.provider === "huggingface" && apiKey) {
        const chatMessages = messages.map(m => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        }));
        const result = await chatCompletion(chatMessages, {}, apiKey, signal);
        recordSuccess("huggingface");
        const ms = Math.round(performance.now() - start);
        recordLatency("huggingface", ms);
        return { text: result.text, provider: "huggingface", model: result.model, latencyMs: ms, retries, cached: result.cached };
      }

      const userMsg = messages[messages.length - 1]?.content ?? "";
      const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

      let text: string;
      if (intentType === "code") {
        text = await legacyGenerateCode(userMsg, undefined, history, signal);
      } else {
        text = await sendChatMessage(userMsg, history, signal);
      }

      recordSuccess("fallback");
      const ms = Math.round(performance.now() - start);
      recordLatency("fallback", ms);
      return { text, provider: "fallback", model: "multi-provider", latencyMs: ms, retries, cached: false };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (decision.provider === "huggingface") recordFailure("huggingface");
      else recordFailure("fallback");
      retries++;
      if (retries <= maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * retries));
      }
    }
  }

  throw lastError ?? new Error("All providers failed");
}

/* ── Router stats ────────────────────────────────────────────── */
export function getRouterStats() {
  const providers: Provider[] = ["huggingface", "xcasper", "prince", "keith", "fallback"];
  return providers.map(p => ({
    provider: p,
    circuit: getCircuit(p).state,
    failures: getCircuit(p).failures,
    avgLatencyMs: Math.round(getAvgLatency(p)),
  }));
}
