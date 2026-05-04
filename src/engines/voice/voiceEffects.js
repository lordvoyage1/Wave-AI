/**
 * Wave AI — Voice Chat — Voice Effects
 * Real-time audio effects: reverb, echo, pitch shift, robot voice.
 */
export class VoiceEffectsProcessor {
  constructor() { this.audioCtx = null; this.effects = {}; this.active = new Set(); }

  async setup(stream) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioCtx.createMediaStreamSource(stream);
    const dest = this.audioCtx.createMediaStreamDestination();
    const gain = this.audioCtx.createGain(); gain.gain.value = 1;
    source.connect(gain); gain.connect(dest);
    this.effects = { source, dest, gain };
    return { success: true, stream: dest.stream };
  }

  addReverb(duration = 2) {
    if (!this.audioCtx) return;
    const convolver = this.audioCtx.createConvolver();
    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioCtx.createBuffer(2, length, sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    convolver.buffer = impulse;
    if (this.effects.gain) {
      this.effects.gain.connect(convolver);
      convolver.connect(this.effects.dest);
    }
    this.active.add("reverb");
    return convolver;
  }

  addEcho(delay = 0.3, feedback = 0.4) {
    if (!this.audioCtx) return;
    const delayNode = this.audioCtx.createDelay(1);
    const fbGain = this.audioCtx.createGain();
    delayNode.delayTime.value = delay;
    fbGain.gain.value = feedback;
    delayNode.connect(fbGain);
    fbGain.connect(delayNode);
    if (this.effects.gain) {
      this.effects.gain.connect(delayNode);
      delayNode.connect(this.effects.dest);
    }
    this.active.add("echo");
    return { delayNode, fbGain };
  }

  robotEffect() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const mod = this.audioCtx.createGain();
    osc.frequency.value = 100;
    mod.gain.value = 5;
    osc.connect(mod);
    this.active.add("robot");
    return { osc, mod };
  }

  getActiveEffects() { return [...this.active]; }
  removeEffect(name) { this.active.delete(name); }
  async destroy() { await this.audioCtx?.close().catch(() => {}); }
}
export const voiceEffectsProcessor = new VoiceEffectsProcessor();
