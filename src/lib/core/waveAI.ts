/* ═══════════════════════════════════════════════════════════════
   Wave AI — Core Entry Point
   Top-level facade that initializes and coordinates all platform
   layers. Import this to bootstrap the full AI platform.
═══════════════════════════════════════════════════════════════ */

import { ensureKnowledgeIndexed } from "@/lib/knowledge/waveKnowledge";
import { warmCache } from "@/lib/cache/responseCache";
import { registerBuiltinTools } from "@/lib/tools/builtins";
import { waveBus } from "@/lib/events/eventBus";
import { loadPersistedMetrics } from "@/lib/metrics/tracker";
import WAVE_CONFIG from "@/lib/config";

export type InitStatus = "idle" | "initializing" | "ready" | "error";

let _status: InitStatus = "idle";
let _initPromise: Promise<void> | null = null;

export interface InitResult {
  status: InitStatus;
  components: Record<string, boolean>;
  durationMs: number;
  errors: string[];
}

/* ── Initialize all platform layers ─────────────────────────── */
export async function initializeWaveAI(): Promise<InitResult> {
  if (_status === "ready") {
    return { status: "ready", components: {}, durationMs: 0, errors: [] };
  }

  if (_initPromise) {
    await _initPromise;
    return { status: _status, components: {}, durationMs: 0, errors: [] };
  }

  _status = "initializing";
  const start = performance.now();
  const components: Record<string, boolean> = {};
  const errors: string[] = [];

  _initPromise = (async () => {
    /* 1. Warm the response cache */
    try {
      warmCache();
      components["responseCache"] = true;
    } catch (e) {
      components["responseCache"] = false;
      errors.push(`Cache warm failed: ${e}`);
    }

    /* 2. Register built-in tools */
    try {
      registerBuiltinTools();
      components["tools"] = true;
    } catch (e) {
      components["tools"] = false;
      errors.push(`Tools init failed: ${e}`);
    }

    /* 3. Load persisted metrics */
    try {
      loadPersistedMetrics();
      components["metrics"] = true;
    } catch (e) {
      components["metrics"] = false;
      errors.push(`Metrics load failed: ${e}`);
    }

    /* 4. Index knowledge base (non-blocking for startup) */
    ensureKnowledgeIndexed().then(() => {
      components["knowledgeBase"] = true;
      waveBus.emit("memory:stored", { source: "knowledge_base" });
    }).catch((e: unknown) => {
      errors.push(`Knowledge indexing failed: ${String(e)}`);
    });

    /* 5. Emit ready event */
    components["eventBus"] = true;
    components["config"] = true;
    components["tokenizer"] = true;
    components["safety"] = true;
    components["memory"] = true;
    components["rag"] = true;
    components["pipeline"] = true;
    components["huggingface"] = !!import.meta.env.VITE_HF_API_KEY;

    _status = "ready";

    waveBus.emit("session:started", {
      version: WAVE_CONFIG.brand.version,
      components,
      durationMs: Math.round(performance.now() - start),
    });
  })();

  await _initPromise;

  return {
    status: _status,
    components,
    durationMs: Math.round(performance.now() - start),
    errors,
  };
}

export function getStatus(): InitStatus { return _status; }
export function isReady(): boolean { return _status === "ready"; }
export { WAVE_CONFIG };
