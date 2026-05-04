/**
 * Wave AI — Voice Chat — Noise Filter (Voice-specific)
 */
export class VoiceNoiseFilter {
  constructor() { this.audioCtx = null; this.nodes = {}; this.stream = null; this.outputStream = null; this.profiles = {
    gentle: { highpass: 80, lowpass: 12000, compThreshold: -28, compRatio: 5 },
    moderate: { highpass: 100, lowpass: 10000, compThreshold: -24, compRatio: 7 },
    aggressive: { highpass: 150, lowpass: 8000, compThreshold: -20, compRatio: 10 },
    telephone: { highpass: 300, lowpass: 3400, compThreshold: -18, compRatio: 12 },
  }; }

  async process(stream, profile = "moderate") {
    this.stream = stream;
    const settings = this.profiles[profile] || this.profiles.moderate;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(stream);
      const dest = this.audioCtx.createMediaStreamDestination();
      const hp = Object.assign(this.audioCtx.createBiquadFilter(), { type: "highpass" }); hp.frequency.value = settings.highpass;
      const lp = Object.assign(this.audioCtx.createBiquadFilter(), { type: "lowpass" }); lp.frequency.value = settings.lowpass;
      const comp = this.audioCtx.createDynamicsCompressor();
      comp.threshold.value = settings.compThreshold; comp.ratio.value = settings.compRatio; comp.knee.value = 30;
      comp.attack.value = 0.003; comp.release.value = 0.25;
      const notch = Object.assign(this.audioCtx.createBiquadFilter(), { type: "notch" }); notch.frequency.value = 60; notch.Q.value = 30;
      source.connect(hp); hp.connect(lp); lp.connect(notch); notch.connect(comp); comp.connect(dest);
      this.nodes = { source, hp, lp, notch, comp, dest };
      this.outputStream = dest.stream;
      return { success: true, stream: dest.stream };
    } catch (err) {
      return { success: false, stream, error: err.message };
    }
  }

  setHighpassFreq(freq) { if (this.nodes.hp) this.nodes.hp.frequency.setValueAtTime(freq, this.audioCtx.currentTime); }
  setLowpassFreq(freq) { if (this.nodes.lp) this.nodes.lp.frequency.setValueAtTime(freq, this.audioCtx.currentTime); }
  async destroy() { await this.audioCtx?.close().catch(() => {}); }
}
export const voiceNoiseFilter = new VoiceNoiseFilter();
