/* ═══════════════════════════════════════════════════════════════
   Wave AI — Model Adapter
   Unified interface for multiple model providers.
   Normalizes requests and responses across HuggingFace, fallback.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";

export interface AdapterRequest {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

export interface AdapterResponse {
  text: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string;
  latencyMs: number;
}

export interface ProviderAdapter {
  name: string;
  isAvailable: () => boolean;
  generate: (request: AdapterRequest) => Promise<AdapterResponse>;
  estimateCost: (tokens: number) => number;
}

/* ── HuggingFace adapter ─────────────────────────────────────── */
export const huggingfaceAdapter: ProviderAdapter = {
  name: "huggingface",
  isAvailable: () => !!import.meta.env.VITE_HF_API_KEY,
  estimateCost: (_tokens) => 0,

  generate: async (request) => {
    const { chatCompletion } = await import("@/lib/providers/huggingface");
    const start = performance.now();
    const messages = request.messages.map(m => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    }));
    const apiKey = import.meta.env.VITE_HF_API_KEY as string;
    const result = await chatCompletion(messages, {
      temperature: request.temperature,
      maxNewTokens: request.maxTokens,
      topP: request.topP,
    }, apiKey, request.signal);

    const promptTokens = request.messages.reduce((s, m) => s + m.content.split(/\s+/).length, 0);
    const completionTokens = result.tokens;

    return {
      text: result.text,
      provider: "huggingface",
      model: result.model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      finishReason: result.finishReason,
      latencyMs: Math.round(performance.now() - start),
    };
  },
};

/* ── Fallback multi-provider adapter ─────────────────────────── */
export const fallbackAdapter: ProviderAdapter = {
  name: "fallback",
  isAvailable: () => true,
  estimateCost: () => 0,

  generate: async (request) => {
    const { sendChatMessage } = await import("@/lib/aiService");
    const start = performance.now();
    const userMsg = request.messages[request.messages.length - 1]?.content ?? "";
    const history = request.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const text = await sendChatMessage(userMsg, history, request.signal);

    return {
      text,
      provider: "fallback",
      model: "multi-provider",
      promptTokens: userMsg.split(/\s+/).length,
      completionTokens: text.split(/\s+/).length,
      totalTokens: (userMsg.split(/\s+/).length) + (text.split(/\s+/).length),
      finishReason: "stop",
      latencyMs: Math.round(performance.now() - start),
    };
  },
};

/* ── Adapter registry ────────────────────────────────────────── */
const adapters: ProviderAdapter[] = [huggingfaceAdapter, fallbackAdapter];

export function getAvailableAdapters(): ProviderAdapter[] {
  return adapters.filter(a => a.isAvailable());
}

export function getAdapter(name: string): ProviderAdapter | null {
  return adapters.find(a => a.name === name) ?? null;
}

export function registerAdapter(adapter: ProviderAdapter): void {
  const existing = adapters.findIndex(a => a.name === adapter.name);
  if (existing >= 0) adapters[existing] = adapter;
  else adapters.push(adapter);
}

/* ── Smart adapter selection ─────────────────────────────────── */
export function selectAdapter(preferFast = false): ProviderAdapter {
  const available = getAvailableAdapters();
  if (available.length === 0) return fallbackAdapter;
  if (preferFast) return available[available.length - 1];
  return available[0];
}
