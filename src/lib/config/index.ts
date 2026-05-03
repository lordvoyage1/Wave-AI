/* ═══════════════════════════════════════════════════════════════
   Wave AI — Global Configuration
   Central config for all system layers
═══════════════════════════════════════════════════════════════ */

export const WAVE_CONFIG = {
  brand: {
    name: "Wave AI",
    company: "Wave Platforms, Inc.",
    ceo: "Meddy Mususwa",
    tagline: "The New Era Begins.",
    origin: "East Africa",
    version: "2.0.0",
  },

  model: {
    primaryProvider: "huggingface",
    fallbackProviders: ["xcasper", "prince", "keith"],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.95,
    topK: 50,
    repetitionPenalty: 1.1,
    contextWindow: 8192,
    streamingEnabled: true,
  },

  huggingface: {
    baseUrl: "https://api-inference.huggingface.co/models",
    models: {
      chat: "mistralai/Mistral-7B-Instruct-v0.3",
      code: "mistralai/Codestral-22B-v0.1",
      vision: "Salesforce/blip-image-captioning-large",
      embedding: "sentence-transformers/all-MiniLM-L6-v2",
      summarization: "facebook/bart-large-cnn",
      classification: "facebook/bart-large-mnli",
      ner: "dslim/bert-base-NER",
      sentiment: "distilbert-base-uncased-finetuned-sst-2-english",
      translation: "Helsinki-NLP/opus-mt-en-mul",
      zeroShot: "facebook/bart-large-mnli",
    },
    timeout: 30000,
    retries: 3,
  },

  memory: {
    maxShortTermMessages: 20,
    maxLongTermEntries: 500,
    sessionTTL: 1000 * 60 * 60 * 24,
    summaryThreshold: 15,
    embeddingDimensions: 384,
    similarityThreshold: 0.75,
  },

  rag: {
    chunkSize: 512,
    chunkOverlap: 64,
    topK: 5,
    minSimilarity: 0.6,
    maxDocuments: 1000,
    indexName: "wave_knowledge_v1",
  },

  safety: {
    enableContentFilter: true,
    enableToxicityDetection: true,
    enablePIIDetection: true,
    enableHarmfulContentDetection: true,
    toxicityThreshold: 0.7,
    maxResponseLength: 8192,
    blockedTopics: ["detailed weapon synthesis", "csam", "doxxing"],
  },

  inference: {
    requestTimeout: 45000,
    maxConcurrentRequests: 10,
    rateLimitPerMinute: 60,
    cacheTTL: 1000 * 60 * 60,
    cacheMaxSize: 500,
    streamChunkSize: 64,
  },

  tools: {
    enabled: ["web_search", "calculator", "code_executor", "weather", "currency", "time", "image_gen", "tts", "summarizer"],
    maxToolCalls: 5,
    toolTimeout: 15000,
  },

  pipeline: {
    stages: ["intent", "safety_pre", "retrieval", "augmentation", "generation", "safety_post", "formatting"],
    enableParallel: true,
    maxPipelineTime: 60000,
  },
} as const;

export type WaveConfig = typeof WAVE_CONFIG;
export default WAVE_CONFIG;
