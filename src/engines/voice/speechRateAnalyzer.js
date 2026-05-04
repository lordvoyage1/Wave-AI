/**
 * Wave AI — Voice Chat — Speech Rate Analyzer
 */
export class SpeechRateAnalyzer {
  constructor() { this.samples = []; this.maxSamples = 20; }

  addSample(wordCount, durationMs) {
    const wpm = (wordCount / durationMs) * 60000;
    this.samples.push({ wpm, wordCount, durationMs, timestamp: Date.now() });
    if (this.samples.length > this.maxSamples) this.samples.shift();
    return wpm;
  }

  getAverageWPM() {
    if (!this.samples.length) return 0;
    return Math.round(this.samples.reduce((s, sample) => s + sample.wpm, 0) / this.samples.length);
  }

  analyzeRate(wpm) {
    if (wpm < 100) return { category: "slow", label: "Very slow", suggestion: "Try speaking a bit faster for natural flow", ideal: false };
    if (wpm < 130) return { category: "slow-normal", label: "Slightly slow", suggestion: "Good for clarity, slightly increase pace", ideal: true };
    if (wpm <= 160) return { category: "normal", label: "Perfect pace", suggestion: "Excellent speaking rate!", ideal: true };
    if (wpm <= 200) return { category: "fast-normal", label: "Slightly fast", suggestion: "Consider slowing down slightly", ideal: true };
    return { category: "fast", label: "Very fast", suggestion: "Slow down — you may be hard to follow", ideal: false };
  }

  getRecommendedTTSRate(currentWPM) {
    if (currentWPM < 100) return 0.9;
    if (currentWPM > 180) return 1.2;
    return 1.0;
  }

  getStats() {
    if (!this.samples.length) return { avgWPM: 0, minWPM: 0, maxWPM: 0, samples: 0 };
    const wpms = this.samples.map(s => s.wpm);
    return { avgWPM: this.getAverageWPM(), minWPM: Math.round(Math.min(...wpms)), maxWPM: Math.round(Math.max(...wpms)), samples: this.samples.length };
  }

  clear() { this.samples = []; }
}
export const speechRateAnalyzer = new SpeechRateAnalyzer();
