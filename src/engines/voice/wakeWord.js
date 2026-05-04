/**
 * Wave AI — Voice Chat — Wake Word Engine
 */
export const WAKE_PHRASES = { primary: ["wave ai", "hey wave"], secondary: ["wave help", "okay wave", "hi wave", "wave listen"] };
export function matchesWakePhrase(text) { const lower = text.toLowerCase().trim(); return [...WAKE_PHRASES.primary, ...WAKE_PHRASES.secondary].some(p => lower.includes(p)); }
export function extractCommandAfterWake(text) { const lower = text.toLowerCase(); for (const phrase of [...WAKE_PHRASES.primary, ...WAKE_PHRASES.secondary]) { const idx = lower.indexOf(phrase); if (idx !== -1) return text.slice(idx + phrase.length).trim(); } return text; }
export class WakeWordEngine {
  constructor() { this.active = false; this.callbacks = {}; this.SR = window.SpeechRecognition || window.webkitSpeechRecognition; }
  start(callbacks = {}) { this.active = true; this.callbacks = callbacks; this._listen(); }
  _listen() {
    if (!this.active || !this.SR) return;
    const r = new this.SR(); r.continuous = false; r.lang = "en-US";
    r.onresult = (e) => { const text = e.results[0][0].transcript; if (matchesWakePhrase(text)) { const cmd = extractCommandAfterWake(text); this.callbacks.onActivated?.({ command: cmd, raw: text }); } };
    r.onend = () => { if (this.active) setTimeout(() => this._listen(), 200); };
    r.onerror = () => { if (this.active) setTimeout(() => this._listen(), 1000); };
    try { r.start(); } catch {}
  }
  stop() { this.active = false; }
}
export const wakeWordEngine = new WakeWordEngine();
