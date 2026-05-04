/**
 * Wave AI — Voice Chat — Voice History Manager
 */
const HISTORY_KEY = "wave_voice_history";
const MAX_ENTRIES = 200;

export class VoiceHistory {
  constructor() { this.history = this._load(); }

  _load() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }

  _save() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-MAX_ENTRIES))); } catch {}
  }

  addSession(transcript, response, metadata = {}) {
    const entry = { id: `vh_${Date.now()}`, transcript, response, timestamp: Date.now(), duration: metadata.duration || 0, language: metadata.language || "en-US", emotion: metadata.emotion || "neutral", wordCount: transcript.split(/\s+/).length };
    this.history.unshift(entry);
    this._save();
    return entry;
  }

  getAll() { return [...this.history]; }
  getRecent(count = 20) { return this.history.slice(0, count); }
  search(query) { const q = query.toLowerCase(); return this.history.filter(h => h.transcript.toLowerCase().includes(q) || h.response.toLowerCase().includes(q)); }
  delete(id) { this.history = this.history.filter(h => h.id !== id); this._save(); }
  clear() { this.history = []; this._save(); }
  getStats() { return { total: this.history.length, avgWords: this.history.length ? Math.round(this.history.reduce((s, h) => s + h.wordCount, 0) / this.history.length) : 0, languages: [...new Set(this.history.map(h => h.language))], totalDuration: this.history.reduce((s, h) => s + h.duration, 0) }; }
  exportAsText() { return this.history.map(h => `[${new Date(h.timestamp).toLocaleString()}]\nUser: ${h.transcript}\nWave AI: ${h.response}\n`).join("\n---\n"); }
}
export const voiceHistory = new VoiceHistory();
