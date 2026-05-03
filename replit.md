# Wave AI — Platform Overview

**Built by Wave Platforms, Inc.** | CEO: Meddy Mususwa | East Africa's first advanced AI assistant

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand v5 (persisted to `wave_store_v2`)
- **Auth**: Supabase
- **Primary AI**: HuggingFace Inference API
  - Chat: `mistralai/Mistral-7B-Instruct-v0.3`
  - Code: `mistralai/Codestral-22B-v0.1`
- **Fallback**: Multi-provider resilient routing (`src/lib/aiService.ts`)
- **Port**: 5000

## Environment Variables

| Key | Purpose |
|-----|---------|
| `VITE_HF_API_KEY` | HuggingFace API key (starts with `hf_`) — enables Mistral/Codestral |

## Architecture — 8 Layers

### Layer 1: Config (`src/lib/config/index.ts`)
Central configuration for all system parameters — models, thresholds, memory limits, RAG, inference.

### Layer 2: Tokenizer (`src/lib/tokenizer/index.ts`)
BPE-style tokenization, approximate token counting, Mistral/Llama prompt formatting, token budget management.

### Layer 3: Embeddings + Vector Store (`src/lib/embeddings/`, `src/lib/vector/store.ts`)
Sentence embeddings via HuggingFace. HNSW-approximated vector index with localStorage persistence. Separate stores for knowledge base and documents.

### Layer 4: Memory System (`src/lib/memory/`)
- `shortTerm.ts` — sliding window with importance scoring
- `longTerm.ts` — episodic + semantic memory with vector retrieval
- `summarizer.ts` — rolling conversation summarizer

### Layer 5: RAG Pipeline (`src/lib/rag/`)
- `chunker.ts` — fixed/sentence/paragraph/code chunking strategies with overlap
- `retriever.ts` — vector retrieval + knowledge base indexing + context augmentation

### Layer 6: Safety + Guardrails (`src/lib/safety/`, `src/lib/moderation/`)
Toxicity detection, PII scrubbing, jailbreak detection, rate limiting, pre/post guardrails, brand compliance, multi-stage moderation pipeline.

### Layer 7: HuggingFace Provider + Router (`src/lib/providers/`, `src/lib/inference/`)
Mistral 7B + Codestral 22B backbone. Circuit-breaking router with latency tracking, retry logic, automatic failover to multi-provider.

### Layer 8: Alignment + RLHF (`src/lib/alignment/`, `src/lib/rewards/`)
Persona-aware system prompts, mood detection, reward model (helpfulness/harmlessness/honesty/clarity), DPO preference pair generation.

## Additional Platform Modules

| Module | Path |
|--------|------|
| Streaming Handler | `src/lib/streaming/streamHandler.ts` |
| LRU Response Cache | `src/lib/cache/responseCache.ts` |
| Event Bus | `src/lib/events/eventBus.ts` |
| Audit Log | `src/lib/audit/auditLog.ts` |
| Request Scheduler | `src/lib/scheduler/requestScheduler.ts` |
| Model Hub | `src/lib/hub/modelHub.ts` |
| Training Data Processor | `src/lib/training/dataProcessor.ts` |
| Feedback Collector | `src/lib/feedback/collector.ts` |
| Semantic Search | `src/lib/search/semanticSearch.ts` |
| Context Window Manager | `src/lib/context/windowManager.ts` |
| Output Formatter | `src/lib/formats/outputFormatter.ts` |
| Text Compressor | `src/lib/compression/textCompressor.ts` |
| Input Validator | `src/lib/validation/inputValidator.ts` |
| Model Adapter | `src/lib/adapters/modelAdapter.ts` |
| Built-in Tools (7) | `src/lib/tools/registry.ts`, `builtins.ts` |
| Knowledge Base (20+ entries) | `src/lib/knowledge/waveKnowledge.ts` |
| Pipeline Orchestrator | `src/lib/pipeline/orchestrator.ts` |
| Core Bootstrap | `src/lib/core/waveAI.ts` |
| Transforms/Sanitizer | `src/lib/transforms/sanitizer.ts` |

## React Hooks

| Hook | Path |
|------|------|
| `useAIPipeline` | `src/hooks/ai/useAIPipeline.ts` |
| `useHuggingFace` | `src/hooks/ai/useHuggingFace.ts` |
| `useMemory` | `src/hooks/memory/useMemory.ts` |
| `useSemanticSearch` | `src/hooks/search/useSemanticSearch.ts` |
| `useMetrics` | `src/hooks/metrics/useMetrics.ts` |
| `useTools` | `src/hooks/tools/useTools.ts` |
| `useSafety` | `src/hooks/safety/useSafety.ts` |

## Global Store

`src/store/waveStore.ts` — Zustand store persisted to `wave_store_v2` localStorage key.
Stores: model settings, UI preferences, system status, session ID, RAG/memory toggles.
HF API key is excluded from persistence for security.

## Routes

| Path | Component |
|------|-----------|
| `/` | Landing page |
| `/app` | Home (main chat — DO NOT modify design) |
| `/login` | Login |
| `/signup` | Signup |
| `/settings` | Settings (API keys, model config, safety) |
| `/admin` | Admin Dashboard (metrics, pipeline, safety, models) |
| `/docs/architecture` | Architecture documentation |
| `/profile` | User profile |
| `/about` | About page |
| `/terms` | Terms |
| `/api-docs` | API docs |

## Important Constraints

- **Home.tsx and Landing.tsx designs must NOT be changed** — the frontend UI is locked
- The pipeline hooks are separate from Home.tsx by design
- `src/lib/aiService.ts` is the fallback — do not break it
- HuggingFace is primary; fallback is automatic when `VITE_HF_API_KEY` is absent

## Social / Contact

- YouTube: https://www.youtube.com/@Wave-platfoms
- WhatsApp Channel: https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30
- TikTok: https://www.tiktok.com/@itsmeddy
