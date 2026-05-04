/**
 * Wave AI — Voice Chat — Audio Equalizer
 */
export const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  voice_boost: [0, 0, 2, 4, 6, 4, 2, 0, -2, -2],
  bass_boost: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  treble_boost: [0, 0, 0, 0, 0, 2, 4, 6, 8, 8],
  podcast: [-2, 0, 4, 6, 5, 3, 2, 0, -1, -2],
  radio: [-4, 2, 6, 8, 6, 4, 2, 0, -2, -4],
  warmth: [4, 4, 2, 0, 0, -2, -2, -4, -4, -6],
};

export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class AudioEqualizer {
  constructor() { this.audioCtx = null; this.filters = []; this.gains = new Array(10).fill(0); }

  async setup(stream) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioCtx.createMediaStreamSource(stream);
    const dest = this.audioCtx.createMediaStreamDestination();
    this.filters = EQ_BANDS.map((freq, i) => {
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = i === 0 ? "lowshelf" : i === EQ_BANDS.length - 1 ? "highshelf" : "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });
    let prev = source;
    for (const filter of this.filters) { prev.connect(filter); prev = filter; }
    prev.connect(dest);
    return { success: true, stream: dest.stream };
  }

  setGain(bandIndex, gainDb) {
    if (bandIndex < 0 || bandIndex >= this.filters.length) return;
    this.gains[bandIndex] = gainDb;
    const filter = this.filters[bandIndex];
    if (filter) filter.gain.setValueAtTime(gainDb, this.audioCtx?.currentTime || 0);
  }

  applyPreset(presetName) {
    const preset = EQ_PRESETS[presetName];
    if (!preset) return false;
    preset.forEach((gain, i) => this.setGain(i, gain));
    return true;
  }

  getGains() { return [...this.gains]; }
  getPresets() { return Object.keys(EQ_PRESETS); }
  reset() { EQ_BANDS.forEach((_, i) => this.setGain(i, 0)); }
  async destroy() { await this.audioCtx?.close().catch(() => {}); }
}
export const audioEqualizer = new AudioEqualizer();
