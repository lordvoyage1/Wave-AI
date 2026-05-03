/* ═══════════════════════════════════════════════════════════════
   Wave AI — Model Hub
   Central registry of all available models, their capabilities,
   and selection logic based on task requirements.
═══════════════════════════════════════════════════════════════ */

export type ModelCapability =
  | "chat" | "code" | "vision" | "embedding" | "summarization"
  | "classification" | "ner" | "sentiment" | "translation" | "tts";

export interface ModelCard {
  id: string;
  name: string;
  provider: "huggingface" | "local" | "fallback";
  capabilities: ModelCapability[];
  contextLength: number;
  languages: string[];
  license: string;
  description: string;
  tags: string[];
  isDefault: boolean;
  requiresApiKey: boolean;
  estimatedLatencyMs: number;
  qualityScore: number;
}

/* ── Model catalog ───────────────────────────────────────────── */
export const MODEL_CATALOG: ModelCard[] = [
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct v0.3",
    provider: "huggingface",
    capabilities: ["chat", "code"],
    contextLength: 8192,
    languages: ["en", "fr", "de", "es", "it", "pt"],
    license: "Apache 2.0",
    description: "High-quality instruction-tuned model. Excellent for chat and code generation.",
    tags: ["instruction-tuned", "multilingual", "open-source"],
    isDefault: true,
    requiresApiKey: true,
    estimatedLatencyMs: 3000,
    qualityScore: 0.88,
  },
  {
    id: "mistralai/Codestral-22B-v0.1",
    name: "Codestral 22B",
    provider: "huggingface",
    capabilities: ["code"],
    contextLength: 32768,
    languages: ["en"],
    license: "Codestral License",
    description: "Specialized code generation model with extremely long context support.",
    tags: ["code", "large-context", "specialized"],
    isDefault: false,
    requiresApiKey: true,
    estimatedLatencyMs: 5000,
    qualityScore: 0.92,
  },
  {
    id: "HuggingFaceH4/zephyr-7b-beta",
    name: "Zephyr 7B Beta",
    provider: "huggingface",
    capabilities: ["chat"],
    contextLength: 4096,
    languages: ["en"],
    license: "MIT",
    description: "Fine-tuned on curated datasets for helpful and harmless responses.",
    tags: ["aligned", "helpful", "open-source"],
    isDefault: false,
    requiresApiKey: true,
    estimatedLatencyMs: 2500,
    qualityScore: 0.85,
  },
  {
    id: "tiiuae/falcon-7b-instruct",
    name: "Falcon 7B Instruct",
    provider: "huggingface",
    capabilities: ["chat"],
    contextLength: 4096,
    languages: ["en"],
    license: "Apache 2.0",
    description: "Open-source model from TII, trained on RefinedWeb dataset.",
    tags: ["open-source", "fast"],
    isDefault: false,
    requiresApiKey: true,
    estimatedLatencyMs: 2000,
    qualityScore: 0.80,
  },
  {
    id: "teknium/OpenHermes-2.5-Mistral-7B",
    name: "OpenHermes 2.5",
    provider: "huggingface",
    capabilities: ["chat", "code"],
    contextLength: 8192,
    languages: ["en"],
    license: "Apache 2.0",
    description: "Strong general-purpose model fine-tuned on synthetic datasets.",
    tags: ["fine-tuned", "synthetic-data", "open-source"],
    isDefault: false,
    requiresApiKey: true,
    estimatedLatencyMs: 3000,
    qualityScore: 0.87,
  },
  {
    id: "sentence-transformers/all-MiniLM-L6-v2",
    name: "MiniLM L6 v2",
    provider: "huggingface",
    capabilities: ["embedding"],
    contextLength: 512,
    languages: ["en"],
    license: "Apache 2.0",
    description: "Fast sentence embedding model. Used for semantic search and RAG.",
    tags: ["embedding", "fast", "semantic-search"],
    isDefault: true,
    requiresApiKey: false,
    estimatedLatencyMs: 500,
    qualityScore: 0.82,
  },
  {
    id: "facebook/bart-large-cnn",
    name: "BART Large CNN",
    provider: "huggingface",
    capabilities: ["summarization"],
    contextLength: 4096,
    languages: ["en"],
    license: "MIT",
    description: "State-of-the-art summarization model trained on CNN/DailyMail.",
    tags: ["summarization", "news", "document"],
    isDefault: true,
    requiresApiKey: true,
    estimatedLatencyMs: 2000,
    qualityScore: 0.85,
  },
  {
    id: "multi-provider-fallback",
    name: "Wave AI Multi-Provider",
    provider: "fallback",
    capabilities: ["chat", "code"],
    contextLength: 4096,
    languages: ["en"],
    license: "Proprietary",
    description: "Resilient multi-provider routing with automatic failover.",
    tags: ["resilient", "fallback", "always-available"],
    isDefault: false,
    requiresApiKey: false,
    estimatedLatencyMs: 2000,
    qualityScore: 0.78,
  },
];

/* ── Model selection ─────────────────────────────────────────── */
export function selectModelForTask(
  capability: ModelCapability,
  hasApiKey: boolean,
  preferFast = false
): ModelCard {
  const candidates = MODEL_CATALOG.filter(m =>
    m.capabilities.includes(capability) &&
    (m.requiresApiKey ? hasApiKey : true)
  );

  if (candidates.length === 0) {
    return MODEL_CATALOG.find(m => m.id === "multi-provider-fallback")!;
  }

  if (preferFast) {
    return candidates.sort((a, b) => a.estimatedLatencyMs - b.estimatedLatencyMs)[0];
  }

  return candidates.sort((a, b) => b.qualityScore - a.qualityScore)[0];
}

/* ── Get model by ID ─────────────────────────────────────────── */
export function getModelById(id: string): ModelCard | null {
  return MODEL_CATALOG.find(m => m.id === id) ?? null;
}

/* ── Get models by capability ────────────────────────────────── */
export function getModelsByCapability(capability: ModelCapability): ModelCard[] {
  return MODEL_CATALOG.filter(m => m.capabilities.includes(capability));
}

/* ── Hub stats ───────────────────────────────────────────────── */
export function getHubStats() {
  const byProvider = MODEL_CATALOG.reduce((acc, m) => {
    acc[m.provider] = (acc[m.provider] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const capabilities = [...new Set(MODEL_CATALOG.flatMap(m => m.capabilities))];

  return {
    totalModels: MODEL_CATALOG.length,
    byProvider,
    capabilities,
    avgQualityScore: MODEL_CATALOG.reduce((s, m) => s + m.qualityScore, 0) / MODEL_CATALOG.length,
    defaultModels: MODEL_CATALOG.filter(m => m.isDefault).map(m => m.name),
    noApiKeyModels: MODEL_CATALOG.filter(m => !m.requiresApiKey).map(m => m.name),
  };
}
