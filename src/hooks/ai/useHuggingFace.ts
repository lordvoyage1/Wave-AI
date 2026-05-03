/* ═══════════════════════════════════════════════════════════════
   Wave AI — useHuggingFace Hook
   Connects to HuggingFace Inference API for open-source models.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import {
  generateText, chatCompletion, summarize, classify,
  analyzeSentiment, extractEntities, checkModelAvailability,
  AVAILABLE_MODELS, HFGenerationOptions,
} from "@/lib/providers/huggingface";
import { ChatMessage } from "@/lib/tokenizer";

export interface HFState {
  isLoading: boolean;
  error: string | null;
  response: string | null;
  model: string | null;
  latencyMs: number | null;
}

export function useHuggingFace() {
  const [state, setState] = useState<HFState>({
    isLoading: false,
    error: null,
    response: null,
    model: null,
    latencyMs: null,
  });

  const apiKey = import.meta.env.VITE_HF_API_KEY as string | undefined;

  const generate = useCallback(async (
    prompt: string,
    options: HFGenerationOptions = {},
    signal?: AbortSignal
  ): Promise<string> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await generateText(prompt, options, apiKey, signal);
      setState({ isLoading: false, error: null, response: result.text, model: result.model, latencyMs: result.latencyMs });
      return result.text;
    } catch (e) {
      const err = e instanceof Error ? e.message : "Generation failed";
      setState(s => ({ ...s, isLoading: false, error: err }));
      throw e;
    }
  }, [apiKey]);

  const chat = useCallback(async (
    messages: ChatMessage[],
    options: HFGenerationOptions = {}
  ): Promise<string> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await chatCompletion(messages, options, apiKey);
      setState({ isLoading: false, error: null, response: result.text, model: result.model, latencyMs: result.latencyMs });
      return result.text;
    } catch (e) {
      const err = e instanceof Error ? e.message : "Chat failed";
      setState(s => ({ ...s, isLoading: false, error: err }));
      throw e;
    }
  }, [apiKey]);

  const summarizeText = useCallback(async (text: string, maxLength = 150): Promise<string> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await summarize(text, maxLength, apiKey);
      setState(s => ({ ...s, isLoading: false, response: result }));
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : "Summarization failed";
      setState(s => ({ ...s, isLoading: false, error: err }));
      throw e;
    }
  }, [apiKey]);

  const classifyText = useCallback(async (text: string, labels: string[]) => {
    return classify(text, labels, apiKey);
  }, [apiKey]);

  const getSentiment = useCallback(async (text: string) => {
    return analyzeSentiment(text, apiKey);
  }, [apiKey]);

  const getEntities = useCallback(async (text: string) => {
    return extractEntities(text, apiKey);
  }, [apiKey]);

  const checkAvailability = useCallback(async (modelId: string) => {
    return checkModelAvailability(modelId, apiKey);
  }, [apiKey]);

  const hasApiKey = !!apiKey;

  return {
    ...state,
    generate,
    chat,
    summarizeText,
    classifyText,
    getSentiment,
    getEntities,
    checkAvailability,
    hasApiKey,
    availableModels: AVAILABLE_MODELS,
  };
}
