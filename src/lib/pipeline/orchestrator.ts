/* ═══════════════════════════════════════════════════════════════
   Wave AI — Pipeline Orchestrator
   The central AI generation pipeline. Coordinates intent detection,
   safety checks, memory retrieval, RAG, generation, and output
   guardrails in a staged, traceable pipeline.
═══════════════════════════════════════════════════════════════ */

import { detectIntent, Intent } from "@/lib/aiService";
import { applyInputGuardrails, applyOutputGuardrails } from "@/lib/safety/guardrails";
import { filterContent } from "@/lib/safety/contentFilter";
import { ShortTermMemory } from "@/lib/memory/shortTerm";
import { longTermMemory } from "@/lib/memory/longTerm";
import { retrieve } from "@/lib/rag/retriever";
import { summarizeEntries, buildContextWithSummary } from "@/lib/memory/summarizer";
import { chatCompletion } from "@/lib/providers/huggingface";
import WAVE_CONFIG from "@/lib/config";
import { sanitize } from "@/lib/transforms/sanitizer";

export type PipelineStage =
  | "intent_detection"
  | "input_guardrails"
  | "memory_retrieval"
  | "rag_retrieval"
  | "context_building"
  | "generation"
  | "output_guardrails"
  | "memory_storage"
  | "complete";

export interface PipelineTrace {
  stage: PipelineStage;
  durationMs: number;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PipelineResult {
  response: string;
  intent: Intent;
  traces: PipelineTrace[];
  totalMs: number;
  ragUsed: boolean;
  memoryUsed: boolean;
  provider: string;
  model: string;
  blocked: boolean;
  blockReason?: string;
}

export interface PipelineOptions {
  sessionId?: string;
  userId?: string;
  enableRAG?: boolean;
  enableMemory?: boolean;
  enableSafety?: boolean;
  apiKey?: string;
  signal?: AbortSignal;
}

/* ── Wave AI system prompt ───────────────────────────────────── */
function buildSystemPrompt(context: string, ragContext: string, ltmContext: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const sections = [
    `You are Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — the first advanced AI assistant ever made in East Africa. The CEO and founder is Meddy Mususwa.

Core identity:
- Emotionally intelligent, adaptable, confident but never arrogant
- Context-aware: track the full conversation and reference past messages naturally
- Never reveal which underlying model or API you're using
- Never mention OpenAI, GPT, Gemini, Claude, DeepSeek, Mistral, Cohere, or any third-party AI brand
- You are Wave AI — that is your only identity
- For code: always use proper markdown code blocks with language identifier
- If asked who built you: "I am Wave AI, built by Wave Platforms, Inc. The CEO is Meddy Mususwa."
- Wave Platforms social channels: YouTube: https://www.youtube.com/@Wave-platfoms | WhatsApp: https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30 | TikTok: https://www.tiktok.com/@itsmeddy

Today: ${date}`,
  ];

  if (ltmContext) sections.push(`\n[Recalled from memory: ${ltmContext}]`);
  if (ragContext) sections.push(`\n${ragContext}`);
  if (context) sections.push(`\nConversation so far:\n${context}`);

  return sections.join("\n");
}

/* ── Stage runner helper ─────────────────────────────────────── */
async function runStage<T>(
  name: PipelineStage,
  traces: PipelineTrace[],
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    traces.push({ stage: name, durationMs: Math.round(performance.now() - start) });
    return result;
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    traces.push({ stage: name, durationMs: Math.round(performance.now() - start), error: err });
    throw e;
  }
}

/* ── Session memory registry ─────────────────────────────────── */
const sessionMemories = new Map<string, ShortTermMemory>();

function getMemory(sessionId: string): ShortTermMemory {
  if (!sessionMemories.has(sessionId)) {
    sessionMemories.set(sessionId, new ShortTermMemory(sessionId));
  }
  return sessionMemories.get(sessionId)!;
}

/* ── Main pipeline ───────────────────────────────────────────── */
export async function runPipeline(
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const pipelineStart = performance.now();
  const traces: PipelineTrace[] = [];
  const {
    sessionId = "default",
    userId,
    enableRAG = true,
    enableMemory = true,
    enableSafety = true,
    apiKey,
    signal,
  } = options;

  let blocked = false;
  let blockReason: string | undefined;
  let ragUsed = false;
  let memoryUsed = false;
  let intent!: Intent;
  let ragContext = "";
  let ltmContext = "";
  let contextString = "";

  /* Stage 1: Intent detection */
  intent = await runStage("intent_detection", traces, async () => {
    const hasImage = history.some(h => h.role === "user" && h.content.includes("[image]"));
    return detectIntent(userMessage, hasImage);
  });

  /* Stage 2: Input guardrails */
  if (enableSafety) {
    const guardrailResult = await runStage("input_guardrails", traces, async () => {
      return applyInputGuardrails(userMessage);
    });
    if (!guardrailResult.passed) {
      blocked = true;
      blockReason = guardrailResult.summary;
    }
  }

  if (blocked) {
    return {
      response: "I'm not able to help with that request. Please try asking something else.",
      intent,
      traces,
      totalMs: Math.round(performance.now() - pipelineStart),
      ragUsed: false,
      memoryUsed: false,
      provider: "none",
      model: "none",
      blocked: true,
      blockReason,
    };
  }

  /* Stage 3: Memory retrieval */
  if (enableMemory) {
    await runStage("memory_retrieval", traces, async () => {
      const memory = getMemory(sessionId);
      for (const h of history.slice(-10)) {
        if (h.role === "user" || h.role === "assistant") {
          memory.add(h.role as "user" | "assistant", h.content);
        }
      }

      const ltmResults = await longTermMemory.search(userMessage, 3, { userId });
      if (ltmResults.length > 0) {
        memoryUsed = true;
        ltmContext = ltmResults.map(r => r.entry.summary).join(". ");
      }
    });
  }

  /* Stage 4: RAG retrieval */
  if (enableRAG && intent.type === "chat") {
    await runStage("rag_retrieval", traces, async () => {
      const result = await retrieve(userMessage, WAVE_CONFIG.rag.topK);
      if (result.chunks.length > 0) {
        ragUsed = true;
        ragContext = result.augmentedContext;
      }
    });
  }

  /* Stage 5: Context building */
  await runStage("context_building", traces, async () => {
    const memory = getMemory(sessionId);
    const entries = memory.getEntries();

    if (entries.length > WAVE_CONFIG.memory.summaryThreshold) {
      const toSummarize = entries.slice(0, -8);
      const summaryResult = summarizeEntries(toSummarize);
      const recent = entries.slice(-8);
      contextString = buildContextWithSummary(summaryResult.summary, recent, 2048);
    } else {
      contextString = memory.getContext(2048);
    }
    if (!contextString && history.length > 0) {
      contextString = history.slice(-8).map(h =>
        `${h.role === "user" ? "User" : "Wave AI"}: ${h.content.slice(0, 400)}`
      ).join("\n");
    }
  });

  /* Stage 6: Generation */
  let rawResponse = "";
  let provider = "huggingface";
  let model = WAVE_CONFIG.huggingface.models.chat;

  await runStage("generation", traces, async () => {
    const systemPrompt = buildSystemPrompt(contextString, ragContext, ltmContext);

    if (apiKey) {
      try {
        const hfResult = await chatCompletion(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          { temperature: WAVE_CONFIG.model.temperature, maxNewTokens: WAVE_CONFIG.model.maxTokens },
          apiKey,
          signal
        );
        rawResponse = hfResult.text;
        provider = "huggingface";
        model = hfResult.model;
      } catch {
        rawResponse = "";
      }
    }

    if (!rawResponse) {
      const { sendChatMessage } = await import("@/lib/aiService");
      rawResponse = await sendChatMessage(
        userMessage,
        history,
        signal
      );
      provider = "fallback";
      model = "multi-provider";
    }
  });

  /* Stage 7: Output guardrails */
  let finalResponse = rawResponse;
  if (enableSafety && rawResponse) {
    await runStage("output_guardrails", traces, async () => {
      const guardrailResult = applyOutputGuardrails(rawResponse, userMessage);
      finalResponse = guardrailResult.finalText;
      if (!guardrailResult.passed) {
        finalResponse = "I apologize, but I'm unable to provide that response. Please try a different approach.";
      }
    });
  }

  /* Apply sanitization */
  finalResponse = sanitize(finalResponse) ?? finalResponse;

  /* Stage 8: Memory storage */
  if (enableMemory && finalResponse) {
    await runStage("memory_storage", traces, async () => {
      const memory = getMemory(sessionId);
      memory.add("user", userMessage);
      memory.add("assistant", finalResponse);

      if (userMessage.length > 50) {
        await longTermMemory.store(
          userMessage,
          userMessage.slice(0, 200),
          "episodic",
          { userId, sessionId }
        );
      }
    });
  }

  traces.push({ stage: "complete", durationMs: 0 });

  return {
    response: finalResponse || "I'm having trouble generating a response right now. Please try again.",
    intent,
    traces,
    totalMs: Math.round(performance.now() - pipelineStart),
    ragUsed,
    memoryUsed,
    provider,
    model,
    blocked: false,
  };
}

/* ── Clear session memory ────────────────────────────────────── */
export function clearSessionMemory(sessionId: string): void {
  const memory = sessionMemories.get(sessionId);
  if (memory) memory.clear();
  sessionMemories.delete(sessionId);
}

export function getSessionStats(sessionId: string) {
  const memory = sessionMemories.get(sessionId);
  return memory ? memory.getStats() : null;
}
