/**
 * Wave AI — Voice Chat — Keyboard Shortcuts
 */
export const SHORTCUTS = {
  "Space": { action: "toggle_listen", description: "Start/Stop listening" },
  "Escape": { action: "stop_all", description: "Stop all voice activity" },
  "KeyS": { action: "stop_speaking", description: "Stop AI from speaking (with Ctrl)" },
  "KeyR": { action: "repeat_last", description: "Repeat last AI response (with Ctrl)" },
  "KeyN": { action: "new_conversation", description: "New conversation (with Ctrl+Shift)" },
};
export class VoiceKeyboardShortcuts {
  constructor() { this.handlers = new Map(); this.enabled = false; this._boundHandler = this._handle.bind(this); }
  enable() { if (!this.enabled) { document.addEventListener("keydown", this._boundHandler); this.enabled = true; } }
  disable() { document.removeEventListener("keydown", this._boundHandler); this.enabled = false; }
  on(action, callback) { this.handlers.set(action, callback); }
  off(action) { this.handlers.delete(action); }
  _handle(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this.handlers.get("toggle_listen")?.(); }
    else if (e.code === "Escape") { this.handlers.get("stop_all")?.(); }
    else if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.handlers.get("stop_speaking")?.(); }
    else if (e.code === "KeyR" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.handlers.get("repeat_last")?.(); }
    else if (e.code === "KeyN" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); this.handlers.get("new_conversation")?.(); }
  }
  getShortcuts() { return Object.entries(SHORTCUTS).map(([key, val]) => ({ key, ...val })); }
}
export const voiceKeyboardShortcuts = new VoiceKeyboardShortcuts();
