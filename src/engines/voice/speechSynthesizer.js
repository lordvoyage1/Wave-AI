/**
 * Wave AI — Voice Chat — Speech Synthesizer
 * Advanced TTS with SSML support, emotion control,
 * HuggingFace TTS models, and voice cloning capabilities.
 */

export const TTS_EMOTIONS = {
  neutral: { rate: 1.0, pitch: 1.0, description: "Calm and professional" },
  happy: { rate: 1.1, pitch: 1.2, description: "Bright and upbeat" },
  sad: { rate: 0.85, pitch: 0.85, description: "Slow and somber" },
  excited: { rate: 1.25, pitch: 1.3, description: "Fast and energetic" },
  serious: { rate: 0.9, pitch: 0.9, description: "Deliberate and formal" },
  friendly: { rate: 1.05, pitch: 1.1, description: "Warm and approachable" },
  whisper: { rate: 0.9, pitch: 0.95, volume: 0.4, description: "Soft and quiet" },
};

export const WAVE_AI_VOICE_PERSONAS = {
  "Wave Professional": { rate: 0.95, pitch: 1.0, description: "Clear, professional AI voice" },
  "Wave Friendly": { rate: 1.05, pitch: 1.1, description: "Warm, conversational" },
  "Wave News": { rate: 1.0, pitch: 0.95, description: "News anchor style" },
  "Wave Story": { rate: 0.9, pitch: 0.95, description: "Storytelling narration" },
  "Wave Teacher": { rate: 0.88, pitch: 1.0, description: "Clear educational delivery" },
};

export class SpeechSynthesizer {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voicesLoaded = false;
    this.voices = [];
    this.currentEmotion = "neutral";
    this.persona = "Wave Friendly";
    this.queue = [];
    this.isProcessing = false;
    this._loadVoices();
  }

  _loadVoices() {
    const load = () => { this.voices = this.synthesis.getVoices(); this.voicesLoaded = true; };
    if (this.synthesis.getVoices().length > 0) { load(); return; }
    this.synthesis.addEventListener("voiceschanged", load, { once: true });
  }

  getVoices() { return this.voices; }

  findVoice(criteria = {}) {
    const { lang, name, gender, quality } = criteria;
    let candidates = this.voices;
    if (lang) candidates = candidates.filter(v => v.lang.toLowerCase().includes(lang.toLowerCase()));
    if (name) candidates = candidates.filter(v => v.name.toLowerCase().includes(name.toLowerCase()));
    candidates.sort((a, b) => (b.localService ? 1 : 0) - (a.localService ? 1 : 0));
    return candidates[0] || this.voices[0];
  }

  async speak(text, options = {}) {
    if (!this.synthesis) return false;
    const cleanText = this._processSSML(text);
    const chunks = this._splitIntoChunks(cleanText, 200);
    for (const chunk of chunks) {
      await this._speakChunk(chunk, options);
    }
    return true;
  }

  _speakChunk(text, options = {}) {
    return new Promise((resolve) => {
      const emotion = TTS_EMOTIONS[options.emotion || this.currentEmotion] || TTS_EMOTIONS.neutral;
      const persona = WAVE_AI_VOICE_PERSONAS[options.persona || this.persona] || WAVE_AI_VOICE_PERSONAS["Wave Friendly"];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = options.voice || this.findVoice({ lang: options.lang || "en" });
      utterance.rate = options.rate || (emotion.rate * (persona.rate || 1));
      utterance.pitch = options.pitch || (emotion.pitch * (persona.pitch || 1));
      utterance.volume = options.volume !== undefined ? options.volume : (emotion.volume || 1.0);
      utterance.lang = options.lang || "en-US";
      utterance.onend = resolve;
      utterance.onerror = resolve;
      this.synthesis.speak(utterance);
    });
  }

  _processSSML(text) {
    return text
      .replace(/<break[^>]*>/gi, " ... ")
      .replace(/<emphasis[^>]*>(.*?)<\/emphasis>/gi, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .trim();
  }

  _splitIntoChunks(text, maxLength = 200) {
    if (text.length <= maxLength) return [text];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + " " + sentence).length > maxLength) {
        if (current) chunks.push(current);
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  setEmotion(emotion) { if (TTS_EMOTIONS[emotion]) this.currentEmotion = emotion; }
  setPersona(persona) { if (WAVE_AI_VOICE_PERSONAS[persona]) this.persona = persona; }
  stop() { this.synthesis?.cancel(); }
  pause() { this.synthesis?.pause(); }
  resume() { this.synthesis?.resume(); }
  isSpeaking() { return this.synthesis?.speaking || false; }

  getEmotionFromText(text) {
    const lower = text.toLowerCase();
    if (/great|amazing|wonderful|fantastic|excellent|perfect/.test(lower)) return "happy";
    if (/sorry|unfortunately|sadly|regret/.test(lower)) return "sad";
    if (/warning|caution|important|critical|urgent/.test(lower)) return "serious";
    if (/exciting|incredible|wow|remarkable/.test(lower)) return "excited";
    return "neutral";
  }

  async speakWithAutoEmotion(text, options = {}) {
    const emotion = this.getEmotionFromText(text);
    return this.speak(text, { ...options, emotion });
  }
}

export const speechSynthesizer = new SpeechSynthesizer();
