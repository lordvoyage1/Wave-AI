/* ═══════════════════════════════════════════════════════════════
   Wave AI — Global Store
   Centralized state management using Zustand for all app state.
═══════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import WAVE_CONFIG from "@/lib/config";

export interface ModelSettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enableStreaming: boolean;
  enableRAG: boolean;
  enableMemory: boolean;
  enableSafety: boolean;
  hfApiKey: string;
}

export interface UIPreferences {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  messageLayout: "bubbles" | "flat";
  showMetrics: boolean;
  showTraces: boolean;
  soundEnabled: boolean;
  autoScroll: boolean;
}

export interface SystemStatus {
  hfConnected: boolean;
  ragIndexed: boolean;
  memoryActive: boolean;
  safetyActive: boolean;
  streamingActive: boolean;
  lastHealthCheck: number | null;
}

export interface WaveStore {
  modelSettings: ModelSettings;
  uiPreferences: UIPreferences;
  systemStatus: SystemStatus;
  sessionId: string;
  ragEnabled: boolean;
  memoryEnabled: boolean;

  updateModelSettings: (settings: Partial<ModelSettings>) => void;
  updateUIPreferences: (prefs: Partial<UIPreferences>) => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  setHFApiKey: (key: string) => void;
  setSessionId: (id: string) => void;
  toggleRAG: () => void;
  toggleMemory: () => void;
  reset: () => void;
}

const defaultModelSettings: ModelSettings = {
  provider: "huggingface",
  model: WAVE_CONFIG.huggingface.models.chat,
  temperature: WAVE_CONFIG.model.temperature,
  maxTokens: WAVE_CONFIG.model.maxTokens,
  topP: WAVE_CONFIG.model.topP,
  enableStreaming: WAVE_CONFIG.model.streamingEnabled,
  enableRAG: true,
  enableMemory: true,
  enableSafety: true,
  hfApiKey: "",
};

const defaultUIPreferences: UIPreferences = {
  theme: "system",
  fontSize: "medium",
  messageLayout: "bubbles",
  showMetrics: false,
  showTraces: false,
  soundEnabled: false,
  autoScroll: true,
};

const defaultSystemStatus: SystemStatus = {
  hfConnected: false,
  ragIndexed: false,
  memoryActive: true,
  safetyActive: true,
  streamingActive: true,
  lastHealthCheck: null,
};

export const useWaveStore = create<WaveStore>()(
  persist(
    (set) => ({
      modelSettings: defaultModelSettings,
      uiPreferences: defaultUIPreferences,
      systemStatus: defaultSystemStatus,
      sessionId: `session_${Date.now()}`,
      ragEnabled: true,
      memoryEnabled: true,

      updateModelSettings: (settings) =>
        set((state) => ({ modelSettings: { ...state.modelSettings, ...settings } })),

      updateUIPreferences: (prefs) =>
        set((state) => ({ uiPreferences: { ...state.uiPreferences, ...prefs } })),

      updateSystemStatus: (status) =>
        set((state) => ({ systemStatus: { ...state.systemStatus, ...status } })),

      setHFApiKey: (key) =>
        set((state) => ({
          modelSettings: { ...state.modelSettings, hfApiKey: key },
          systemStatus: { ...state.systemStatus, hfConnected: key.startsWith("hf_") },
        })),

      setSessionId: (id) => set({ sessionId: id }),
      toggleRAG: () => set((state) => ({ ragEnabled: !state.ragEnabled })),
      toggleMemory: () => set((state) => ({ memoryEnabled: !state.memoryEnabled })),

      reset: () => set({
        modelSettings: defaultModelSettings,
        uiPreferences: defaultUIPreferences,
        systemStatus: defaultSystemStatus,
        sessionId: `session_${Date.now()}`,
        ragEnabled: true,
        memoryEnabled: true,
      }),
    }),
    {
      name: "wave_store_v2",
      partialize: (state) => ({
        modelSettings: { ...state.modelSettings, hfApiKey: "" },
        uiPreferences: state.uiPreferences,
        ragEnabled: state.ragEnabled,
        memoryEnabled: state.memoryEnabled,
      }),
    }
  )
);
