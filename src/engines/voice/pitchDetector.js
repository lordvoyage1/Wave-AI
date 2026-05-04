/**
 * Wave AI — Voice Chat — Pitch Detector
 */
export class VoicePitchDetector {
  constructor() { this.audioCtx = null; this.analyser = null; this.buffer = null; this.sampleRate = 44100; }

  async connect(stream) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioCtx.sampleRate;
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
    const source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(this.analyser);
    return this;
  }

  detectPitch() {
    if (!this.analyser) return null;
    this.analyser.getFloatTimeDomainData(this.buffer);
    return this._autocorrelate(this.buffer, this.sampleRate);
  }

  _autocorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1, best_correlation = 0, rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return null;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) correlation += Math.abs(buf[i] - buf[i + offset]);
      correlation = 1 - (correlation / MAX_SAMPLES);
      if (correlation > best_correlation) { best_correlation = correlation; best_offset = offset; }
    }
    if (best_correlation > 0.9) {
      const freq = sampleRate / best_offset;
      return { frequency: Math.round(freq), note: this._freqToNote(freq), confidence: best_correlation };
    }
    return null;
  }

  _freqToNote(freq) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitone = 12 * (Math.log(freq / 440) / Math.log(2));
    const note = notes[((Math.round(semitone) % 12) + 12) % 12];
    const octave = Math.floor(Math.round(semitone) / 12) + 4;
    return `${note}${octave}`;
  }

  classifyVoice(avgFreq) {
    if (avgFreq < 110) return "Bass";
    if (avgFreq < 155) return "Baritone";
    if (avgFreq < 210) return "Tenor";
    if (avgFreq < 265) return "Mezzo-Soprano";
    if (avgFreq < 350) return "Soprano";
    return "High Soprano";
  }

  async destroy() { await this.audioCtx?.close().catch(() => {}); }
}
export const voicePitchDetector = new VoicePitchDetector();
