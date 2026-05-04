/**
 * Wave AI — Voice Chat — Voice Settings Manager
 */
const SETTINGS_KEY = "wave_voice_settings";

export const DEFAULT_SETTINGS = {
  language: "en-US",
  voiceName: null,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  mode: "turn_based",
  autoPlay: true,
  noiseReduction: true,
  noiseProfile: "moderate",
  emotion: "neutral",
  persona: "Wave Friendly",
  autoDetectLanguage: true,
  silenceThreshold: 10,
  silenceDuration: 1500,
  maxResponseLength: "concise",
  showTranscript: true,
  saveHistory: true,
};

export class VoiceSettingsManager {
  constructor() { this.settings = this._load(); }

  _load() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  }

  _save() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch {}
  }

  get(key) { return this.settings[key] ?? DEFAULT_SETTINGS[key]; }

  set(key, value) {
    if (key in DEFAULT_SETTINGS) { this.settings[key] = value; this._save(); return true; }
    return false;
  }

  update(updates) {
    Object.entries(updates).forEach(([k, v]) => { if (k in DEFAULT_SETTINGS) this.settings[k] = v; });
    this._save();
  }

  reset(key = null) {
    if (key) { this.settings[key] = DEFAULT_SETTINGS[key]; }
    else { this.settings = { ...DEFAULT_SETTINGS }; }
    this._save();
  }

  getAll() { return { ...this.settings }; }

  getForVoiceCore() {
    return { language: this.settings.language, rate: this.settings.rate, pitch: this.settings.pitch, volume: this.settings.volume, mode: this.settings.mode, emotion: this.settings.emotion, persona: this.settings.persona };
  }

  validate(settings) {
    const errors = [];
    if (settings.rate && (settings.rate < 0.25 || settings.rate > 4)) errors.push("Rate must be between 0.25 and 4");
    if (settings.pitch && (settings.pitch < 0.5 || settings.pitch > 2)) errors.push("Pitch must be between 0.5 and 2");
    if (settings.volume && (settings.volume < 0 || settings.volume > 1)) errors.push("Volume must be between 0 and 1");
    return { valid: errors.length === 0, errors };
  }
}
export const voiceSettings = new VoiceSettingsManager();
