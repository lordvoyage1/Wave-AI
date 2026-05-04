/**
 * Wave AI — Image Generation — Generation History
 */
const HISTORY_KEY = "wave_img_history";
const MAX_HISTORY = 100;

export class GenerationHistory {
  constructor() { this.history = this._load(); }

  _load() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }

  _save() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-MAX_HISTORY))); }
    catch {}
  }

  add(entry) {
    this.history.unshift({ id: `hist_${Date.now()}`, ...entry, createdAt: Date.now() });
    if (this.history.length > MAX_HISTORY) this.history = this.history.slice(0, MAX_HISTORY);
    this._save();
    return this.history[0];
  }

  getAll() { return [...this.history]; }
  getRecent(count = 10) { return this.history.slice(0, count); }
  search(query) { const q = query.toLowerCase(); return this.history.filter(h => h.prompt?.toLowerCase().includes(q) || h.style?.toLowerCase().includes(q)); }
  delete(id) { this.history = this.history.filter(h => h.id !== id); this._save(); }
  clear() { this.history = []; this._save(); }
  getStats() { return { total: this.history.length, models: [...new Set(this.history.map(h => h.model).filter(Boolean))], avgGenTime: this.history.reduce((s, h) => s + (h.genTime || 0), 0) / (this.history.length || 1) }; }
}
export const generationHistory = new GenerationHistory();
