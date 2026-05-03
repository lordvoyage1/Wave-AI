/* ═══════════════════════════════════════════════════════════════
   Wave AI — Settings Page
   API key configuration, model selection, system preferences.
   Does NOT change the design of Home.tsx.
═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Key, Brain, Shield, Zap, Save, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, Cpu } from "lucide-react";
import { useWaveStore } from "@/store/waveStore";
import { validateApiKey } from "@/lib/validation/inputValidator";
import { checkModelAvailability, AVAILABLE_MODELS } from "@/lib/providers/huggingface";
import { cn } from "@/lib/utils";

type SettingsTab = "api" | "model" | "safety" | "performance" | "advanced";

export default function Settings() {
  const navigate = useNavigate();
  const { modelSettings, uiPreferences, systemStatus, updateModelSettings, updateUIPreferences, setHFApiKey } = useWaveStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("api");
  const [apiKeyInput, setApiKeyInput] = useState(import.meta.env.VITE_HF_API_KEY || "");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "api", label: "API Keys", icon: <Key size={15} /> },
    { id: "model", label: "Model", icon: <Cpu size={15} /> },
    { id: "safety", label: "Safety", icon: <Shield size={15} /> },
    { id: "performance", label: "Performance", icon: <Zap size={15} /> },
    { id: "advanced", label: "Advanced", icon: <Brain size={15} /> },
  ];

  const validateKey = async () => {
    if (!apiKeyInput) return;
    setKeyStatus("checking");
    const result = validateApiKey(apiKeyInput);
    if (!result.valid) { setKeyStatus("invalid"); return; }
    try {
      const available = await checkModelAvailability("mistralai/Mistral-7B-Instruct-v0.3", apiKeyInput);
      setKeyStatus(available ? "valid" : "invalid");
    } catch { setKeyStatus("invalid"); }
  };

  const saveSettings = () => {
    setHFApiKey(apiKeyInput);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/app")} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Settings</h1>
            <p className="text-xs text-slate-400">Configure your Wave AI experience</p>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Sidebar tabs */}
          <div className="w-40 flex-shrink-0 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                  activeTab === tab.id
                    ? "bg-white border border-slate-200 text-primary shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            {activeTab === "api" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 mb-1">HuggingFace API Key</h2>
                  <p className="text-xs text-slate-400 mb-3">
                    Required to use open-source models (Mistral, Codestral). Get your free key at{" "}
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      huggingface.co/settings/tokens
                    </a>
                  </p>

                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKeyInput}
                        onChange={e => { setApiKeyInput(e.target.value); setKeyStatus("idle"); }}
                        placeholder="hf_..."
                        className="w-full pr-20 pl-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button onClick={() => setShowKey(s => !s)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                          {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {keyStatus === "valid" && <CheckCircle size={14} className="text-emerald-500" />}
                        {keyStatus === "invalid" && <XCircle size={14} className="text-red-400" />}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={validateKey} disabled={!apiKeyInput || keyStatus === "checking"} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        <RefreshCw size={11} className={cn(keyStatus === "checking" && "animate-spin")} />
                        {keyStatus === "checking" ? "Checking..." : "Test Key"}
                      </button>
                      <button onClick={saveSettings} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold wave-gradient text-white hover:opacity-90">
                        <Save size={11} />
                        {saveStatus === "saved" ? "Saved!" : "Save"}
                      </button>
                    </div>

                    {keyStatus === "valid" && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-xs text-emerald-700">API key verified — HuggingFace models active</p>
                      </div>
                    )}
                    {keyStatus === "invalid" && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <XCircle size={14} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-600">Invalid API key. Check your key and try again.</p>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium mb-1">Without API key</p>
                      <p className="text-xs text-blue-600">Wave AI uses its resilient multi-provider fallback — no API key required. Chat works instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "model" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">Model Configuration</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Primary Model</label>
                    <select
                      value={modelSettings.model}
                      onChange={e => updateModelSettings({ model: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {AVAILABLE_MODELS.filter(m => m.type === "chat" || m.type === "completion").map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Temperature: <span className="text-primary font-semibold">{modelSettings.temperature}</span>
                    </label>
                    <input type="range" min="0" max="2" step="0.1" value={modelSettings.temperature}
                      onChange={e => updateModelSettings({ temperature: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary" />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">Precise</span>
                      <span className="text-[10px] text-slate-400">Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Max Tokens: <span className="text-primary font-semibold">{modelSettings.maxTokens}</span>
                    </label>
                    <input type="range" min="256" max="4096" step="256" value={modelSettings.maxTokens}
                      onChange={e => updateModelSettings({ maxTokens: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Top P: <span className="text-primary font-semibold">{modelSettings.topP}</span>
                    </label>
                    <input type="range" min="0" max="1" step="0.05" value={modelSettings.topP}
                      onChange={e => updateModelSettings({ topP: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">Safety & Moderation</h2>
                {[
                  { key: "enableSafety" as const, label: "Content Safety", desc: "Filter harmful, toxic, and inappropriate content" },
                  { key: "enableRAG" as const, label: "Knowledge Retrieval (RAG)", desc: "Augment responses with relevant knowledge" },
                  { key: "enableMemory" as const, label: "Conversation Memory", desc: "Remember context across turns" },
                  { key: "enableStreaming" as const, label: "Streaming Responses", desc: "Display responses token-by-token as generated" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <button
                      onClick={() => updateModelSettings({ [key]: !modelSettings[key] } as Partial<typeof modelSettings>)}
                      className={cn("relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0", modelSettings[key] ? "bg-primary" : "bg-slate-200")}
                      style={{ minWidth: 40, height: 22 }}
                    >
                      <span className={cn("absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform",
                        modelSettings[key] ? "translate-x-5" : "translate-x-0.5")}
                        style={{ width: 18, height: 18, transform: modelSettings[key] ? "translateX(20px)" : "translateX(2px)" }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">Performance</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">System Status</p>
                    {[
                      { label: "HuggingFace", value: systemStatus.hfConnected },
                      { label: "RAG Index", value: systemStatus.ragIndexed },
                      { label: "Memory", value: systemStatus.memoryActive },
                      { label: "Safety", value: systemStatus.safetyActive },
                      { label: "Streaming", value: systemStatus.streamingActive },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", value ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                          {value ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">Advanced</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-semibold text-amber-700 mb-1">About Wave AI Architecture</p>
                    <p className="text-xs text-amber-600">
                      Wave AI uses a full 8-layer AI platform: HuggingFace Mistral/Codestral backbone,
                      HNSW vector store, RAG pipeline, short+long-term memory, content safety guardrails,
                      RLHF reward model, inference router with circuit breaking, and streaming handler.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Primary Provider</p>
                    <p className="text-xs text-slate-500">HuggingFace Inference API (Mistral 7B Instruct v0.3)</p>
                    <p className="text-xs text-slate-400 mt-1">Fallback: Multi-provider resilient routing</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Built by</p>
                    <p className="text-xs text-slate-500">Wave Platforms, Inc.</p>
                    <p className="text-xs text-slate-400">CEO: Meddy Mususwa</p>
                    <p className="text-xs text-slate-400">East Africa's first advanced AI assistant</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
