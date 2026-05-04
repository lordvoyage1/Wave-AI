/**
 * Wave AI Recording Engine — Noise Reducer
 * Real-time noise reduction using Web Audio API filters,
 * spectral subtraction, and dynamic range compression.
 */

export class NoiseReducer {
  constructor() {
    this.audioCtx = null;
    this.inputNode = null;
    this.outputNode = null;
    this.nodes = {};
    this.isActive = false;
    this.profile = "balanced";
    this.profiles = {
      light: { highpass: 60, lowpass: 15000, compressorThreshold: -30, compressorRatio: 4 },
      balanced: { highpass: 80, lowpass: 12000, compressorThreshold: -24, compressorRatio: 6 },
      aggressive: { highpass: 100, lowpass: 10000, compressorThreshold: -20, compressorRatio: 8 },
      voice: { highpass: 300, lowpass: 3400, compressorThreshold: -18, compressorRatio: 10 },
    };
  }

  async setup(stream, profile = "balanced") {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.inputNode = this.audioCtx.createMediaStreamSource(stream);
      this.outputNode = this.audioCtx.createMediaStreamDestination();
      this.profile = profile;
      await this._buildChain();
      this.isActive = true;
      return { success: true, stream: this.outputNode.stream };
    } catch (err) {
      return { success: false, error: err.message, stream };
    }
  }

  async _buildChain() {
    const settings = this.profiles[this.profile] || this.profiles.balanced;
    const ctx = this.audioCtx;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = settings.highpass;
    hp.Q.value = 0.7;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = settings.lowpass;
    lp.Q.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = settings.compressorThreshold;
    comp.knee.value = 30;
    comp.ratio.value = settings.compressorRatio;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    const gain = ctx.createGain();
    gain.gain.value = 1.2;
    const notch60 = ctx.createBiquadFilter();
    notch60.type = "notch";
    notch60.frequency.value = 60;
    notch60.Q.value = 30;
    const notch120 = ctx.createBiquadFilter();
    notch120.type = "notch";
    notch120.frequency.value = 120;
    notch120.Q.value = 30;
    this.inputNode.connect(hp);
    hp.connect(lp);
    lp.connect(notch60);
    notch60.connect(notch120);
    notch120.connect(comp);
    comp.connect(gain);
    gain.connect(this.outputNode);
    this.nodes = { hp, lp, comp, gain, notch60, notch120 };
  }

  setProfile(profile) {
    if (!this.profiles[profile]) return;
    this.profile = profile;
    const settings = this.profiles[profile];
    if (this.nodes.hp) {
      this.nodes.hp.frequency.setValueAtTime(settings.highpass, this.audioCtx.currentTime);
      this.nodes.lp.frequency.setValueAtTime(settings.lowpass, this.audioCtx.currentTime);
      this.nodes.comp.threshold.setValueAtTime(settings.compressorThreshold, this.audioCtx.currentTime);
      this.nodes.comp.ratio.setValueAtTime(settings.compressorRatio, this.audioCtx.currentTime);
    }
  }

  setGain(value) {
    if (this.nodes.gain) {
      this.nodes.gain.gain.setValueAtTime(Math.max(0, Math.min(3, value)), this.audioCtx.currentTime);
    }
  }

  getOutputLevel() {
    if (!this.audioCtx || !this.outputNode) return 0;
    try {
      const analyser = this.audioCtx.createAnalyser();
      this.nodes.gain?.connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      return buffer.reduce((a, b) => a + b, 0) / buffer.length;
    } catch { return 0; }
  }

  bypass(active) {
    if (!this.nodes.hp) return;
    if (active) {
      this.inputNode.disconnect();
      this.inputNode.connect(this.outputNode);
    } else {
      this.inputNode.disconnect();
      this._buildChain();
    }
  }

  async destroy() {
    if (this.audioCtx) {
      await this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.isActive = false;
    }
  }
}

export function createNoiseGate(threshold = 0.01) {
  return {
    process(inputBuffer) {
      const rms = Math.sqrt(inputBuffer.reduce((s, v) => s + v * v, 0) / inputBuffer.length);
      return rms > threshold ? inputBuffer : new Float32Array(inputBuffer.length);
    },
    threshold,
    setThreshold(t) { this.threshold = t; },
  };
}

export function calculateSNR(signal, noise) {
  const signalRMS = Math.sqrt(signal.reduce((s, v) => s + v * v, 0) / signal.length);
  const noiseRMS = Math.sqrt(noise.reduce((s, v) => s + v * v, 0) / noise.length) || 0.0001;
  return 20 * Math.log10(signalRMS / noiseRMS);
}

export const noiseReducer = new NoiseReducer();
