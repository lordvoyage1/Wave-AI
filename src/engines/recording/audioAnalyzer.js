/**
 * Wave AI Recording Engine — Audio Analyzer
 * Real-time audio analysis: pitch detection, BPM, spectrum,
 * voice activity detection, and speech rate analysis.
 */

export class AudioAnalyzer {
  constructor(audioCtx, source) {
    this.audioCtx = audioCtx;
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    source?.connect(this.analyser);
    this.timeBuffer = new Float32Array(this.analyser.fftSize);
    this.freqBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.history = { levels: [], pitches: [], timestamps: [] };
  }

  getTimeDomain() {
    this.analyser.getFloatTimeDomainData(this.timeBuffer);
    return this.timeBuffer;
  }

  getFrequency() {
    this.analyser.getByteFrequencyData(this.freqBuffer);
    return this.freqBuffer;
  }

  getRMS() {
    const data = this.getTimeDomain();
    const sum = data.reduce((s, v) => s + v * v, 0);
    return Math.sqrt(sum / data.length);
  }

  getDecibels() {
    const rms = this.getRMS();
    return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  }

  detectPitch() {
    const data = this.getTimeDomain();
    const sampleRate = this.audioCtx.sampleRate;
    let bestOffset = -1, bestCorr = 0;
    const minFreq = 80, maxFreq = 1000;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    for (let offset = minPeriod; offset < maxPeriod && offset < data.length / 2; offset++) {
      let corr = 0;
      for (let i = 0; i < data.length - offset; i++) corr += data[i] * data[i + offset];
      corr /= (data.length - offset);
      if (corr > bestCorr) { bestCorr = corr; bestOffset = offset; }
    }
    if (bestOffset === -1 || bestCorr < 0.01) return null;
    const freq = sampleRate / bestOffset;
    return { frequency: Math.round(freq), note: this._freqToNote(freq), confidence: Math.min(1, bestCorr * 10) };
  }

  _freqToNote(freq) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitones = 12 * Math.log2(freq / 440) + 49;
    const index = Math.round(semitones) % 12;
    const octave = Math.floor(Math.round(semitones) / 12);
    return `${notes[(index + 12) % 12]}${octave}`;
  }

  detectVoiceActivity(threshold = 0.01) {
    const rms = this.getRMS();
    return { active: rms > threshold, level: rms, threshold };
  }

  getSpectralCentroid() {
    const data = this.getFrequency();
    const binSize = this.audioCtx.sampleRate / this.analyser.fftSize;
    let weightedSum = 0, magnitudeSum = 0;
    for (let i = 0; i < data.length; i++) {
      const mag = data[i] / 255;
      weightedSum += i * binSize * mag;
      magnitudeSum += mag;
    }
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  getBandLevels() {
    const data = this.getFrequency();
    const len = data.length;
    return {
      sub: this._bandAvg(data, 0, Math.floor(len * 0.02)),
      bass: this._bandAvg(data, Math.floor(len * 0.02), Math.floor(len * 0.08)),
      midLow: this._bandAvg(data, Math.floor(len * 0.08), Math.floor(len * 0.2)),
      mid: this._bandAvg(data, Math.floor(len * 0.2), Math.floor(len * 0.4)),
      midHigh: this._bandAvg(data, Math.floor(len * 0.4), Math.floor(len * 0.7)),
      high: this._bandAvg(data, Math.floor(len * 0.7), len),
    };
  }

  _bandAvg(data, start, end) {
    if (start >= end) return 0;
    const slice = Array.from(data.slice(start, end));
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  getFullSnapshot() {
    const pitch = this.detectPitch();
    return {
      rms: this.getRMS(),
      decibels: this.getDecibels(),
      pitch,
      spectralCentroid: this.getSpectralCentroid(),
      bands: this.getBandLevels(),
      voiceActivity: this.detectVoiceActivity(),
      timestamp: Date.now(),
    };
  }

  getSpeechRate(wordTimestamps, durationMs) {
    if (!wordTimestamps?.length || !durationMs) return 0;
    const wpm = (wordTimestamps.length / durationMs) * 60000;
    return Math.round(wpm);
  }

  getSpeechQuality(snapshots) {
    if (!snapshots?.length) return "unknown";
    const avgRMS = snapshots.reduce((s, s2) => s + s2.rms, 0) / snapshots.length;
    const avgDB = snapshots.reduce((s, s2) => s + (isFinite(s2.decibels) ? s2.decibels : -60), 0) / snapshots.length;
    if (avgDB > -20 && avgRMS > 0.1) return "excellent";
    if (avgDB > -30 && avgRMS > 0.05) return "good";
    if (avgDB > -40 && avgRMS > 0.02) return "fair";
    return "poor";
  }
}

export function detectSilenceGaps(levelHistory, threshold = 5, minGapMs = 500) {
  const gaps = [];
  let gapStart = null;
  levelHistory.forEach(({ level, time }) => {
    if (level < threshold) {
      if (!gapStart) gapStart = time;
    } else {
      if (gapStart && time - gapStart >= minGapMs) {
        gaps.push({ start: gapStart, end: time, durationMs: time - gapStart });
      }
      gapStart = null;
    }
  });
  return gaps;
}

export function estimateSpeechSegments(transcript, totalDurationMs) {
  const sentences = transcript.split(/[.!?]+/).filter(Boolean);
  if (!sentences.length) return [];
  const msPerSentence = totalDurationMs / sentences.length;
  return sentences.map((text, i) => ({
    index: i,
    text: text.trim(),
    startMs: i * msPerSentence,
    endMs: (i + 1) * msPerSentence,
    duration: msPerSentence,
  }));
}
