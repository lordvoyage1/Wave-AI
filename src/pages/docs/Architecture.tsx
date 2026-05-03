/* ═══════════════════════════════════════════════════════════════
   Wave AI — Architecture Documentation Page
   Technical overview of the full 8-layer AI platform.
═══════════════════════════════════════════════════════════════ */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Brain, Shield, Database, Zap, MessageSquare, Search, BarChart3, Cpu } from "lucide-react";

const layers = [
  {
    number: 1,
    name: "Core Configuration",
    icon: <Zap size={16} />,
    color: "blue",
    file: "src/lib/config/index.ts",
    description: "Central config hub for all system parameters — model settings, safety thresholds, memory limits, RAG config, inference options.",
    features: ["Model selection", "Safety thresholds", "Memory configuration", "RAG parameters", "Inference settings"],
  },
  {
    number: 2,
    name: "Tokenizer & Prompt Engineering",
    icon: <MessageSquare size={16} />,
    color: "violet",
    file: "src/lib/tokenizer/index.ts",
    description: "BPE-style tokenization, approximate token counting, Mistral & Llama prompt formatting, token budget management.",
    features: ["BPE tokenization", "Mistral format", "Llama-2 format", "Token budget", "Truncation strategies"],
  },
  {
    number: 3,
    name: "Embeddings & Vector Store",
    icon: <Database size={16} />,
    color: "emerald",
    file: "src/lib/embeddings/, src/lib/vector/",
    description: "Semantic vector representations via HuggingFace sentence-transformers. HNSW-approximated vector index with localStorage persistence.",
    features: ["Sentence embeddings", "Cosine similarity", "HNSW index", "Local persistence", "K-means clustering"],
  },
  {
    number: 4,
    name: "Memory System",
    icon: <Brain size={16} />,
    color: "amber",
    file: "src/lib/memory/",
    description: "Short-term working memory (sliding window with importance scoring) + long-term episodic/semantic memory with vector retrieval + rolling summarizer.",
    features: ["Short-term memory", "Long-term episodic memory", "Semantic memory", "Conversation summarizer", "Memory importance scoring"],
  },
  {
    number: 5,
    name: "RAG Pipeline",
    icon: <Search size={16} />,
    color: "cyan",
    file: "src/lib/rag/",
    description: "Full retrieval-augmented generation: document chunking (fixed/sentence/paragraph/code strategies), vector indexing, semantic retrieval, context augmentation.",
    features: ["Document chunking", "Chunk overlap", "Vector retrieval", "Knowledge base indexing", "Context augmentation"],
  },
  {
    number: 6,
    name: "Safety & Guardrails",
    icon: <Shield size={16} />,
    color: "red",
    file: "src/lib/safety/, src/lib/moderation/",
    description: "Multi-layer safety: toxicity detection, PII scrubbing, jailbreak detection, rate limiting, pre/post generation guardrails, brand compliance.",
    features: ["Toxicity detection", "PII scrubbing", "Jailbreak detection", "Rate limiting", "Brand compliance", "Content policy"],
  },
  {
    number: 7,
    name: "HuggingFace Provider + Router",
    icon: <Cpu size={16} />,
    color: "orange",
    file: "src/lib/providers/, src/lib/inference/",
    description: "Primary backbone: Mistral 7B Instruct & Codestral 22B via HuggingFace Inference API. Circuit-breaking router with latency tracking and automatic failover.",
    features: ["Mistral 7B backbone", "Codestral 22B code", "Circuit breaker", "Latency tracking", "Retry logic", "Multi-provider fallback"],
  },
  {
    number: 8,
    name: "Alignment & RLHF",
    icon: <BarChart3 size={16} />,
    color: "pink",
    file: "src/lib/alignment/, src/lib/rewards/",
    description: "Persona-aware system prompts, mood detection, reward model scoring (helpfulness/harmlessness/honesty/clarity), DPO preference pairs.",
    features: ["Persona modes", "Mood detection", "Reward scoring", "DPO pairs", "Policy constraints", "Training data export"],
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  cyan: "bg-cyan-100 text-cyan-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  pink: "bg-pink-100 text-pink-600",
};

export default function Architecture() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/app")} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Layers size={18} className="text-primary" />
              <h1 className="text-lg font-bold text-slate-800">Wave AI Architecture</h1>
            </div>
            <p className="text-xs text-slate-400">Full 8-layer AI platform built on open-source models</p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-2">Built by Wave Platforms, Inc. — East Africa's First Advanced AI</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Wave AI is powered by open-source models (Mistral 7B, Codestral 22B) via HuggingFace — completely independent of Google, OpenAI, and Anthropic. Every surrounding layer — from memory to safety to RAG to reward modeling — is built from scratch.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["HuggingFace Backbone", "HNSW Vector Store", "RAG Pipeline", "RLHF Alignment", "Multi-layer Safety", "Streaming"].map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-white/70 text-primary text-[10px] font-semibold rounded-full border border-primary/20">{tag}</span>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="space-y-3">
          {layers.map(layer => (
            <div key={layer.number} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[layer.color]}`}>
                  {layer.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-slate-400">LAYER {layer.number}</span>
                    <h3 className="text-sm font-bold text-slate-800">{layer.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">{layer.description}</p>
                  <code className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{layer.file}</code>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {layer.features.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional modules */}
        <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Additional Platform Modules</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              "Streaming Handler", "LRU Response Cache", "Event Bus", "Audit Log",
              "Request Scheduler", "Model Hub", "Training Data Processor", "Feedback Collector",
              "Semantic Search", "Context Window Manager", "Output Formatter", "Text Compressor",
              "Input Validator", "Model Adapter", "Built-in Tools (7)", "Knowledge Base (20+ entries)",
            ].map(m => (
              <div key={m} className="px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-medium">{m}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
