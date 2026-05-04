/**
 * Wave AI — Voice Chat — Voice Authentication (Speaker Verification)
 */
export class VoiceAuthenticator {
  constructor() { this.voiceprint = null; this.enrolled = false; this.threshold = 0.75; }

  async enroll(stream, durationMs = 5000) {
    const features = await this._extractFeatures(stream, durationMs);
    if (!features) return { success: false, error: "Could not extract voice features" };
    this.voiceprint = features;
    this.enrolled = true;
    try { localStorage.setItem("wave_voiceprint", JSON.stringify(features)); } catch {}
    return { success: true, message: "Voice enrolled successfully. Say 'Wave AI verify' to authenticate." };
  }

  loadEnrolled() {
    try {
      const stored = localStorage.getItem("wave_voiceprint");
      if (stored) { this.voiceprint = JSON.parse(stored); this.enrolled = true; return true; }
    } catch {}
    return false;
  }

  async verify(stream, durationMs = 3000) {
    if (!this.enrolled || !this.voiceprint) return { success: false, error: "No voice enrolled" };
    const features = await this._extractFeatures(stream, durationMs);
    if (!features) return { success: false, error: "Could not extract features" };
    const similarity = this._cosineSimilarity(this.voiceprint, features);
    const verified = similarity >= this.threshold;
    return { verified, similarity, threshold: this.threshold, confidence: similarity };
  }

  async _extractFeatures(stream, durationMs) {
    return new Promise((resolve) => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const frames = [];
      const interval = setInterval(() => {
        const data = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(data);
        frames.push([...data]);
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        audioCtx.close();
        if (!frames.length) { resolve(null); return; }
        const avg = new Array(frames[0].length).fill(0);
        frames.forEach(frame => frame.forEach((v, i) => { avg[i] += v; }));
        resolve(avg.map(v => v / frames.length));
      }, durationMs);
    });
  }

  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  clearEnrollment() { this.voiceprint = null; this.enrolled = false; try { localStorage.removeItem("wave_voiceprint"); } catch {} }
  isEnrolled() { return this.enrolled; }
}
export const voiceAuthenticator = new VoiceAuthenticator();
