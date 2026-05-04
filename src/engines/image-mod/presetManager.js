/**
 * Wave AI — Image Modification — Preset Manager
 */
const PRESETS_KEY = "wave_img_presets";
export const BUILT_IN_PRESETS = {
  "Instagram Warm": [{ type: "brightness", amount: 15 }, { type: "filter", filter: "saturate", value: 1.2 }],
  "Cinematic": [{ type: "contrast", amount: 20 }, { type: "filter", filter: "sepia" }, { type: "brightness", amount: -10 }],
  "Black & White": [{ type: "filter", filter: "grayscale" }, { type: "contrast", amount: 15 }],
  "Vivid": [{ type: "filter", filter: "saturate", value: 1.6 }, { type: "contrast", amount: 10 }],
  "Vintage": [{ type: "filter", filter: "sepia" }, { type: "brightness", amount: 10 }, { type: "contrast", amount: -10 }],
  "Cold Blue": [{ type: "filter", filter: "hueRotate", value: 200 }, { type: "filter", filter: "saturate", value: 1.2 }],
};
export class ImagePresetManager {
  constructor() { this.customPresets = this._load(); }
  _load() { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || "{}"); } catch { return {}; } }
  _save() { try { localStorage.setItem(PRESETS_KEY, JSON.stringify(this.customPresets)); } catch {} }
  getAllPresets() { return { ...BUILT_IN_PRESETS, ...this.customPresets }; }
  getPreset(name) { return BUILT_IN_PRESETS[name] || this.customPresets[name] || null; }
  saveCustomPreset(name, operations) { this.customPresets[name] = operations; this._save(); return name; }
  deleteCustomPreset(name) { delete this.customPresets[name]; this._save(); }
  isBuiltIn(name) { return !!BUILT_IN_PRESETS[name]; }
  getPresetNames() { return Object.keys(this.getAllPresets()); }
}
export const imagePresetManager = new ImagePresetManager();
