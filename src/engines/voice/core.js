/**
 * Wave AI — Voice Chat Engine Core
 * Real-time voice chat with AI using speech recognition,
 * HuggingFace AI responses, and speech synthesis.
 */

import { sendChatMessage } from "@/lib/aiService";

export const VOICE_LANGUAGES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "sw-KE", name: "Swahili (Kenya)", flag: "🇰🇪" },
  { code: "sw-TZ", name: "Swahili (Tanzania)", flag: "🇹🇿" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "pt-BR", name: "Portuguese", flag: "🇧🇷" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "zh-CN", name: "Chinese", flag: "🇨🇳" },
  { code: "ha-NG", name: "Hausa (Nigeria)", flag: "🇳🇬" },
  { code: "yo-NG", name: "Yoruba", flag: "🇳🇬" },
  { code: "am-ET", name: "Amharic", flag: "🇪🇹" },
];

export const VOICE_MODES = {
  push_to_talk: { label: "Push to Talk", description: "Hold button to speak" },
  continuous: { label: "Continuous", description: "AI listens until you pause" },
  turn_based: { label: "Turn Based", description: "Classic back-and-forth conversation" },
  hands_free: { label: "Hands Free", description: "Auto-detect speech with VAD" },
};

export class VoiceChatCore {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.state = "idle";
    this.mode = "turn_based";
    this.language = "en-US";
    this.voice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    this.conversationHistory = [];
    this.listeners = new Map();
    this.currentUtterance = null;
    this.SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isListening = false;
    this.isSpeaking = false;
    this.interruptible = true;
    this.systemPrompt = "You are Wave AI, a helpful, warm, and intelligent assistant created by Wave Platforms. Keep voice responses concise and conversational — 1-3 sentences max unless asked for more detail.";
  }

  get isSupported() { return !!this.SR && !!this.synthesis; }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
    return () => {
      const arr = this.listeners.get(event) || [];
      this.listeners.set(event, arr.filter(h => h !== handler));
    };
  }

  emit(event, data) {
    (this.listeners.get(event) || []).forEach(h => { try { h(data); } catch {} });
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) this.recognition.lang = lang;
  }

  setVoice(voice) { this.voice = voice; }
  setRate(rate) { this.rate = Math.max(0.5, Math.min(2, rate)); }
  setPitch(pitch) { this.pitch = Math.max(0.5, Math.min(2, pitch)); }
  setVolume(vol) { this.volume = Math.max(0, Math.min(1, vol)); }
  setMode(mode) { if (VOICE_MODES[mode]) this.mode = mode; }
  setInterruptible(val) { this.interruptible = val; }
  setSystemPrompt(prompt) { this.systemPrompt = prompt; }

  async initialize() {
    if (!this.isSupported) return { success: false, error: "Voice chat not supported. Use Chrome or Edge." };
    await this._loadVoices();
    return { success: true, voices: this.getAvailableVoices(), languages: VOICE_LANGUAGES };
  }

  async _loadVoices() {
    return new Promise(resolve => {
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) { resolve(voices); return; }
      this.synthesis.onvoiceschanged = () => resolve(this.synthesis.getVoices());
      setTimeout(resolve, 2000);
    });
  }

  getAvailableVoices() {
    return this.synthesis.getVoices().map(v => ({
      name: v.name, lang: v.lang, localService: v.localService,
      default: v.default, uri: v.voiceURI,
    }));
  }

  getBestVoiceForLanguage(langCode) {
    const voices = this.synthesis.getVoices();
    const preferred = voices.find(v => v.lang === langCode && v.localService);
    const fallback = voices.find(v => v.lang.startsWith(langCode.split("-")[0]));
    return preferred || fallback || voices[0];
  }

  startListening(onResult) {
    if (!this.SR || this.isListening) return false;
    this.recognition = new this.SR();
    this.recognition.lang = this.language;
    this.recognition.continuous = this.mode === "continuous" || this.mode === "hands_free";
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.onstart = () => { this.isListening = true; this.state = "listening"; this.emit("listening-start", {}); };
    this.recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      this.emit("transcript", { transcript, isFinal });
      if (isFinal && onResult) onResult(transcript);
    };
    this.recognition.onerror = (e) => { this.isListening = false; this.state = "idle"; this.emit("error", { error: e.error }); };
    this.recognition.onend = () => { this.isListening = false; if (this.state === "listening") this.state = "idle"; this.emit("listening-end", {}); };
    this.recognition.start();
    return true;
  }

  stopListening() {
    this.recognition?.stop();
    this.isListening = false;
  }

  async speak(text, options = {}) {
    if (!this.synthesis) return false;
    return new Promise((resolve) => {
      if (this.interruptible && this.synthesis.speaking) this.synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = options.voice || this.getBestVoiceForLanguage(this.language) || null;
      utterance.rate = options.rate || this.rate;
      utterance.pitch = options.pitch || this.pitch;
      utterance.volume = options.volume || this.volume;
      utterance.lang = this.language;
      utterance.onstart = () => { this.isSpeaking = true; this.state = "speaking"; this.emit("speaking-start", { text }); };
      utterance.onend = () => { this.isSpeaking = false; this.state = "idle"; this.emit("speaking-end", { text }); resolve(true); };
      utterance.onerror = () => { this.isSpeaking = false; this.state = "idle"; resolve(false); };
      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() { this.synthesis?.cancel(); this.isSpeaking = false; this.state = "idle"; }

  async sendToAI(userMessage) {
    this.state = "thinking";
    this.emit("thinking-start", { userMessage });
    try {
      const response = await sendChatMessage(userMessage, { systemPrompt: this.systemPrompt, history: this.conversationHistory.slice(-6) });
      this.conversationHistory.push({ role: "user", content: userMessage }, { role: "assistant", content: response });
      if (this.conversationHistory.length > 20) this.conversationHistory = this.conversationHistory.slice(-20);
      this.emit("ai-response", { response });
      return response;
    } catch (err) {
      const fallback = "I encountered an issue. Please try again.";
      this.emit("ai-error", { error: err.message });
      return fallback;
    }
  }

  async handleUserInput(text) {
    if (!text?.trim()) return;
    const aiResponse = await this.sendToAI(text);
    await this.speak(aiResponse);
    if (this.mode === "continuous" || this.mode === "hands_free") {
      setTimeout(() => this.startListening((t) => this.handleUserInput(t)), 500);
    }
  }

  clearHistory() { this.conversationHistory = []; }
  getHistory() { return [...this.conversationHistory]; }

  getState() {
    return { state: this.state, isListening: this.isListening, isSpeaking: this.isSpeaking, mode: this.mode, language: this.language };
  }
}

export const voiceChatCore = new VoiceChatCore();
