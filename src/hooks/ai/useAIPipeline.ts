/* ═══════════════════════════════════════════════════════════════
   Wave AI — useAIPipeline Hook
   React hook that connects the UI to the full AI pipeline.
   Handles streaming, state, errors, and pipeline tracing.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef } from "react";
import { runPipeline, PipelineResult } from "@/lib/pipeline/orchestrator";
import { simulateStream, createStream, StreamSession } from "@/lib/streaming/streamHandler";
import { trackRequest } from "@/lib/metrics/tracker";
import { waveBus } from "@/lib/events/eventBus";
import { validateChatMessage } from "@/lib/validation/inputValidator";
import WAVE_CONFIG from "@/lib/config";

export interface PipelineState {
  isLoading: boolean;
  isStreaming: boolean;
  streamedText: string;
  lastResult: PipelineResult | null;
  error: string | null;
  stage: string | null;
  provider: string | null;
  ragUsed: boolean;
  memoryUsed: boolean;
}

export interface UsePipelineOptions {
  sessionId?: string;
  userId?: string;
  enableRAG?: boolean;
  enableMemory?: boolean;
  enableSafety?: boolean;
  enableStreaming?: boolean;
  onChunk?: (text: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string) => void;
}

export function useAIPipeline(options: UsePipelineOptions = {}) {
  const {
    sessionId = "default",
    userId,
    enableRAG = true,
    enableMemory = true,
    enableSafety = true,
    enableStreaming = WAVE_CONFIG.model.streamingEnabled,
    onChunk,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<PipelineState>({
    isLoading: false,
    isStreaming: false,
    streamedText: "",
    lastResult: null,
    error: null,
    stage: null,
    provider: null,
    ragUsed: false,
    memoryUsed: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<StreamSession | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const send = useCallback(async (
    message: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<string> => {
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      const err = validation.errors.join(", ");
      onError?.(err);
      setState(s => ({ ...s, error: err }));
      return "";
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState(s => ({
      ...s,
      isLoading: true,
      isStreaming: false,
      streamedText: "",
      error: null,
      stage: "intent_detection",
      ragUsed: false,
      memoryUsed: false,
    }));

    waveBus.emit("message:sent", { content: message }, { sessionId });
    const sendStart = performance.now();

    try {
      const apiKey = import.meta.env.VITE_HF_API_KEY as string | undefined;

      const result = await runPipeline(message, history, {
        sessionId,
        userId,
        enableRAG,
        enableMemory,
        enableSafety,
        apiKey,
        signal: ctrl.signal,
      });

      if (ctrl.signal.aborted) return "";

      const latencyMs = Math.round(performance.now() - sendStart);
      requestIdRef.current = trackRequest({
        userId,
        sessionId,
        intent: result.intent.type,
        provider: result.provider,
        model: result.model,
        latencyMs,
        inputTokens: message.split(/\s+/).length,
        outputTokens: result.response.split(/\s+/).length,
        cached: false,
        ragUsed: result.ragUsed,
        memoryUsed: result.memoryUsed,
        blocked: result.blocked,
        error: result.blocked ? result.blockReason : undefined,
      }).requestId;

      if (result.blocked) {
        setState(s => ({ ...s, isLoading: false, error: result.blockReason ?? "Blocked", stage: "complete" }));
        onError?.(result.blockReason ?? "Blocked");
        waveBus.emit("safety:blocked", { reason: result.blockReason }, { sessionId });
        return result.response;
      }

      waveBus.emit("message:received", { content: result.response, provider: result.provider }, { sessionId });

      if (enableStreaming) {
        setState(s => ({
          ...s,
          isLoading: false,
          isStreaming: true,
          stage: "complete",
          provider: result.provider,
          ragUsed: result.ragUsed,
          memoryUsed: result.memoryUsed,
          lastResult: result,
        }));

        const stream = createStream((_chunk) => {});
        streamRef.current = stream;

        await simulateStream(result.response, stream, (chunk) => {
          if (chunk.type === "token") {
            setState(s => ({ ...s, streamedText: s.streamedText + chunk.content }));
            onChunk?.(chunk.content);
          } else if (chunk.type === "done") {
            setState(s => ({ ...s, isStreaming: false }));
            onComplete?.(result);
          }
        });
      } else {
        setState(s => ({
          ...s,
          isLoading: false,
          isStreaming: false,
          stage: "complete",
          provider: result.provider,
          ragUsed: result.ragUsed,
          memoryUsed: result.memoryUsed,
          lastResult: result,
        }));
        onComplete?.(result);
      }

      return result.response;
    } catch (e) {
      if (ctrl.signal.aborted) return "";
      const errMsg = e instanceof Error ? e.message : "An error occurred";
      setState(s => ({ ...s, isLoading: false, isStreaming: false, error: errMsg, stage: null }));
      onError?.(errMsg);
      waveBus.emit("error:warning", { message: errMsg }, { sessionId });
      return "";
    }
  }, [sessionId, userId, enableRAG, enableMemory, enableSafety, enableStreaming, onChunk, onComplete, onError]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    streamRef.current?.cancel();
    setState(s => ({ ...s, isLoading: false, isStreaming: false, stage: null }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isLoading: false,
      isStreaming: false,
      streamedText: "",
      lastResult: null,
      error: null,
      stage: null,
      provider: null,
      ragUsed: false,
      memoryUsed: false,
    });
  }, [cancel]);

  return {
    ...state,
    send,
    cancel,
    reset,
    requestId: requestIdRef.current,
  };
}
