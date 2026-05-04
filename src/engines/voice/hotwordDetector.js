/**
 * Wave AI — Voice Chat — Hotword Detector
 * Wake-word detection for hands-free voice activation.
 */
export const WAKE_WORDS = ["wave ai", "hey wave", "hi wave", "okay wave", "wave help", "wave listen"];

export class HotwordDetector {
  constructor() { this.recognition = null; this.isActive = false; this.wakeWords = [...WAKE_WORDS]; this.sensitivity = 0.8; this.callbacks = {}; this.SR = window.SpeechRecognition || window.webkitSpeechRecognition; }

  get isSupported() { return !!this.SR; }

  start(callbacks = {}) {
    if (!this.isSupported || this.isActive) return false;
    this.callbacks = callbacks;
    this.isActive = true;
    this._listen();
    return true;
  }

  _listen() {
    if (!this.isActive) return;
    this.recognition = new this.SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    this.recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase().trim();
      const detected = this.wakeWords.find(w => text.includes(w));
      if (detected) { this.callbacks.onWakeWord?.({ wakeWord: detected, fullText: text }); }
      else { this.callbacks.onTranscript?.({ text }); }
    };
    this.recognition.onend = () => { if (this.isActive) setTimeout(() => this._listen(), 300); };
    this.recognition.onerror = () => { if (this.isActive) setTimeout(() => this._listen(), 1000); };
    try { this.recognition.start(); } catch {}
  }

  stop() { this.isActive = false; this.recognition?.abort(); }
  addWakeWord(word) { this.wakeWords.push(word.toLowerCase()); }
  removeWakeWord(word) { this.wakeWords = this.wakeWords.filter(w => w !== word.toLowerCase()); }
  getWakeWords() { return [...this.wakeWords]; }
  isDetecting() { return this.isActive; }
}
export const hotwordDetector = new HotwordDetector();
