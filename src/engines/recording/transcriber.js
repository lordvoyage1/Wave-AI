/**
 * Wave AI Recording Engine — Transcriber
 * Real-time speech-to-text transcription using Web Speech API
 * and HuggingFace Whisper via API for high-accuracy transcription.
 */

export class RealTimeTranscriber {
  constructor() {
    this.recognition = null;
    this.transcript = "";
    this.interimTranscript = "";
    this.isListening = false;
    this.language = "en-US";
    this.continuous = true;
    this.interimResults = true;
    this.confidence = 0;
    this.listeners = new Map();
    this.wordTimestamps = [];
    this.sessionStart = null;
    this.SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  }

  get isSupported() { return !!this.SR; }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
    return () => {
      const handlers = this.listeners.get(event) || [];
      this.listeners.set(event, handlers.filter(h => h !== handler));
    };
  }

  emit(event, data) {
    (this.listeners.get(event) || []).forEach(h => { try { h(data); } catch {} });
  }

  start(options = {}) {
    if (!this.isSupported) return { success: false, error: "Speech recognition not supported. Use Chrome or Edge." };
    if (this.isListening) return { success: false, error: "Already listening" };
    this.language = options.language || "en-US";
    this.continuous = options.continuous !== false;
    this.interimResults = options.interim !== false;
    this.transcript = "";
    this.interimTranscript = "";
    this.wordTimestamps = [];
    this.sessionStart = Date.now();
    this.recognition = new this.SR();
    this.recognition.lang = this.language;
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.maxAlternatives = 3;
    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit("start", { language: this.language });
    };
    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        this.confidence = result[0].confidence;
        if (result.isFinal) {
          final += text;
          this.wordTimestamps.push({ text, time: Date.now() - this.sessionStart, confidence: this.confidence });
        } else {
          interim += text;
        }
      }
      if (final) {
        this.transcript += (this.transcript ? " " : "") + final.trim();
        this.emit("final", { text: final.trim(), fullTranscript: this.transcript, confidence: this.confidence });
      }
      this.interimTranscript = interim;
      this.emit("interim", { text: interim, fullTranscript: this.transcript + (interim ? " " + interim : "") });
    };
    this.recognition.onerror = (event) => {
      const errors = {
        "not-allowed": "Microphone access denied.",
        "no-speech": "No speech detected.",
        "audio-capture": "Microphone not found.",
        "network": "Network error during speech recognition.",
      };
      this.emit("error", { error: errors[event.error] || event.error });
    };
    this.recognition.onend = () => {
      this.isListening = false;
      this.emit("end", { transcript: this.transcript, duration: Date.now() - this.sessionStart, wordCount: this.getWordCount() });
      if (this.continuous && this._shouldRestart) {
        setTimeout(() => { if (!this.isListening) this.recognition?.start(); }, 300);
      }
    };
    this._shouldRestart = true;
    this.recognition.start();
    return { success: true };
  }

  stop() {
    this._shouldRestart = false;
    this.recognition?.stop();
    this.isListening = false;
    return { transcript: this.transcript, wordTimestamps: this.wordTimestamps };
  }

  abort() {
    this._shouldRestart = false;
    this.recognition?.abort();
    this.isListening = false;
  }

  setLanguage(lang) { this.language = lang; }
  getTranscript() { return this.transcript; }
  getWordCount() { return this.transcript.split(/\s+/).filter(Boolean).length; }
  getReadingTimeSeconds() { return Math.ceil(this.getWordCount() / 3); }
  clear() { this.transcript = ""; this.interimTranscript = ""; this.wordTimestamps = []; }

  exportSRT() {
    return this.wordTimestamps.map((w, i) => {
      const start = this._msToSRT(w.time);
      const end = this._msToSRT(w.time + 2000);
      return `${i + 1}\n${start} --> ${end}\n${w.text}\n`;
    }).join("\n");
  }

  _msToSRT(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  }
}

export async function transcribeWithWhisper(audioBlob, apiKey, language = "en") {
  if (!apiKey) return { success: false, error: "No HuggingFace API key", fallback: "Use browser speech recognition" };
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "audio/wav" },
      body: arrayBuffer,
    });
    if (!response.ok) throw new Error(`Whisper API error: ${response.status}`);
    const result = await response.json();
    return { success: true, text: result.text || "", language };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function detectLanguageFromText(text) {
  const patterns = {
    sw: /\b(habari|asante|karibu|tafadhali|ndiyo|hapana|ninakupenda|rafiki)\b/i,
    fr: /\b(bonjour|merci|oui|non|je|tu|nous|vous|c'est|qui|que)\b/i,
    ar: /[\u0600-\u06ff]/,
    zh: /[\u4e00-\u9fff]/,
    hi: /[\u0900-\u097f]/,
  };
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang;
  }
  return "en";
}

export const realTimeTranscriber = new RealTimeTranscriber();
