/**
 * Wave AI — Voice Chat — Audio Mixer
 */
export class VoiceAudioMixer {
  constructor() { this.audioCtx = null; this.channels = new Map(); this.masterGain = null; }
  async init() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
  }
  async addChannel(id, stream, volume = 1) {
    if (!this.audioCtx) await this.init();
    const gain = this.audioCtx.createGain(); gain.gain.value = volume;
    const source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(gain); gain.connect(this.masterGain);
    this.channels.set(id, { source, gain, stream });
    return id;
  }
  setChannelVolume(id, volume) { const ch = this.channels.get(id); if (ch) ch.gain.gain.setValueAtTime(Math.max(0, Math.min(2, volume)), this.audioCtx?.currentTime || 0); }
  setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(2, v)), this.audioCtx?.currentTime || 0); }
  removeChannel(id) { const ch = this.channels.get(id); if (ch) { try { ch.source.disconnect(); ch.gain.disconnect(); } catch {} this.channels.delete(id); } }
  getChannels() { return [...this.channels.keys()]; }
  async destroy() { await this.audioCtx?.close().catch(() => {}); }
}
export const voiceAudioMixer = new VoiceAudioMixer();
