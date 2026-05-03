/* ═══════════════════════════════════════════════════════════════
   Wave AI — useTools Hook
   React hook for executing and managing Wave AI tools.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { executeTool, listEnabledTools, detectToolIntent, ToolCallResult } from "@/lib/tools/registry";
import "@/lib/tools/builtins";

export interface ToolState {
  isExecuting: boolean;
  lastResult: ToolCallResult | null;
  error: string | null;
  history: ToolCallResult[];
}

export function useTools() {
  const [state, setState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null,
    error: null,
    history: [],
  });

  const execute = useCallback(async (
    toolName: string,
    params: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<ToolCallResult> => {
    setState(s => ({ ...s, isExecuting: true, error: null }));
    try {
      const result = await executeTool(toolName, params, signal);
      setState(s => ({
        ...s,
        isExecuting: false,
        lastResult: result,
        history: [...s.history.slice(-19), result],
        error: result.result.success ? null : (result.result.error ?? "Tool failed"),
      }));
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : "Tool execution failed";
      setState(s => ({ ...s, isExecuting: false, error: err }));
      throw e;
    }
  }, []);

  const detectAndExecute = useCallback(async (
    userMessage: string,
    signal?: AbortSignal
  ): Promise<ToolCallResult | null> => {
    const intent = detectToolIntent(userMessage);
    if (!intent) return null;
    return execute(intent.tool, intent.params, signal);
  }, [execute]);

  const clearHistory = useCallback(() => {
    setState(s => ({ ...s, history: [], lastResult: null, error: null }));
  }, []);

  return {
    ...state,
    execute,
    detectAndExecute,
    clearHistory,
    availableTools: listEnabledTools(),
  };
}
