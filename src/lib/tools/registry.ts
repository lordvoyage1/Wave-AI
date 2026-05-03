/* ═══════════════════════════════════════════════════════════════
   Wave AI — Tool Registry
   Extensible tool calling system. Tools are registered functions
   that the AI can invoke to interact with external systems.
═══════════════════════════════════════════════════════════════ */

import WAVE_CONFIG from "@/lib/config";

export type ToolStatus = "available" | "busy" | "error" | "disabled";

export interface ToolDefinition {
  name: string;
  description: string;
  category: "search" | "compute" | "media" | "data" | "system" | "communication";
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>, signal?: AbortSignal) => Promise<ToolResult>;
  status: ToolStatus;
  timeout?: number;
  requiresAuth?: boolean;
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  displayText: string;
  raw?: unknown;
}

export interface ToolCall {
  toolName: string;
  params: Record<string, unknown>;
  callId: string;
  timestamp: number;
}

export interface ToolCallResult extends ToolCall {
  result: ToolResult;
  durationMs: number;
}

/* ── Tool registry ───────────────────────────────────────────── */
const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  toolRegistry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | null {
  return toolRegistry.get(name) ?? null;
}

export function listTools(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

export function listEnabledTools(): ToolDefinition[] {
  return listTools().filter(t =>
    t.status === "available" && WAVE_CONFIG.tools.enabled.includes(t.name)
  );
}

/* ── Tool executor ───────────────────────────────────────────── */
export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  signal?: AbortSignal
): Promise<ToolCallResult> {
  const tool = getTool(name);
  const callId = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const start = performance.now();

  if (!tool) {
    return {
      toolName: name,
      params,
      callId,
      timestamp: Date.now(),
      result: { success: false, error: `Tool '${name}' not found`, displayText: `Tool '${name}' is not available.` },
      durationMs: 0,
    };
  }

  if (tool.status !== "available") {
    return {
      toolName: name,
      params,
      callId,
      timestamp: Date.now(),
      result: { success: false, error: `Tool '${name}' is ${tool.status}`, displayText: `Tool '${name}' is currently ${tool.status}.` },
      durationMs: 0,
    };
  }

  const timeout = tool.timeout ?? WAVE_CONFIG.tools.toolTimeout;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });

  try {
    const result = await tool.execute(params, ctrl.signal);
    clearTimeout(timer);
    return { toolName: name, params, callId, timestamp: Date.now(), result, durationMs: Math.round(performance.now() - start) };
  } catch (e) {
    clearTimeout(timer);
    const error = e instanceof Error ? e.message : String(e);
    return {
      toolName: name,
      params,
      callId,
      timestamp: Date.now(),
      result: { success: false, error, displayText: `Tool execution failed: ${error}` },
      durationMs: Math.round(performance.now() - start),
    };
  }
}

/* ── Tool intent parser ──────────────────────────────────────── */
const TOOL_PATTERNS: Array<{ pattern: RegExp; tool: string; extract: (m: RegExpMatchArray) => Record<string, unknown> }> = [
  { pattern: /(?:what(?:'s| is) the )?(?:current )?time(?: in (.+?))?[?.]?$/i, tool: "time", extract: (m) => ({ timezone: m[1] }) },
  { pattern: /(?:calculate|compute|what(?:'s| is))\s+(.+?)(?:\?|$)/i, tool: "calculator", extract: (m) => ({ expression: m[1] }) },
  { pattern: /(?:what(?:'s| is) the )?(?:current )?weather(?: in (.+?))?[?.]?$/i, tool: "weather", extract: (m) => ({ location: m[1] ?? "Nairobi" }) },
  { pattern: /(?:convert|exchange)\s+([\d.]+)\s+([A-Z]{3})\s+(?:to|into)\s+([A-Z]{3})/i, tool: "currency", extract: (m) => ({ amount: parseFloat(m[1]), from: m[2], to: m[3] }) },
  { pattern: /search(?:\s+the\s+web)?(?:\s+for)?\s+(.+?)(?:\?|$)/i, tool: "web_search", extract: (m) => ({ query: m[1] }) },
];

export function detectToolIntent(text: string): { tool: string; params: Record<string, unknown> } | null {
  for (const { pattern, tool, extract } of TOOL_PATTERNS) {
    const m = text.match(pattern);
    if (m) return { tool, params: extract(m) };
  }
  return null;
}
