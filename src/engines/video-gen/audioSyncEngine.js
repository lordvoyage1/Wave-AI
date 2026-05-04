/**
 * Wave AI — Video Generation — Audio Sync Engine
 */
export class AudioSyncEngine {
  constructor() { this.audioCtx = null; this.sources = []; this.masterGain = null; this.analyser = null; this.bpm = 120; this.beatInterval = 60000 / 120; }

  async init() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    return this;
  }

  async loadAudio(url) {
    if (!this.audioCtx) await this.init();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  async playAudio(audioBuffer, startAt = 0) {
    if (!this.audioCtx) await this.init();
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.masterGain);
    source.start(startAt);
    this.sources.push(source);
    return source;
  }

  setBPM(bpm) { this.bpm = bpm; this.beatInterval = 60000 / bpm; }

  getBeatProgress(currentTimeMs) {
    const beat = (currentTimeMs % this.beatInterval) / this.beatInterval;
    const beatNumber = Math.floor(currentTimeMs / this.beatInterval);
    return { beat, beatNumber, isOnBeat: beat < 0.05 };
  }

  getCurrentLevel() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(2, v)), this.audioCtx?.currentTime || 0); }
  stopAll() { this.sources.forEach(s => { try { s.stop(); } catch {} }); this.sources = []; }
  async destroy() { this.stopAll(); await this.audioCtx?.close(); }
}
export const audioSyncEngine = new AudioSyncEngine();
