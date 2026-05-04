/**
 * Wave AI Recording Engine — Audio Recorder
 * High-quality audio recording with waveform visualization,
 * noise reduction, and real-time level monitoring.
 */

import { RecordingCore } from "./core.js";

export class AudioRecorder extends RecordingCore {
  constructor() {
    super();
    this.waveformData = [];
    this.peakLevel = 0;
    this.silenceThreshold = 5;
    this.autoStopOnSilence = false;
    this.silenceTimer = null;
    this.silenceDuration = 3000;
    this.sampleRate = 44100;
    this.channels = 1;
  }

  async startAudio(options = {}) {
    this.autoStopOnSilence = options.autoStopOnSilence || false;
    this.silenceDuration = options.silenceDuration || 3000;
    const constraints = {
      audio: {
        echoCancellation: options.echoCancellation !== false,
        noiseSuppression: options.noiseSuppression !== false,
        autoGainControl: options.autoGainControl !== false,
        sampleRate: options.sampleRate || 44100,
        channelCount: options.stereo ? 2 : 1,
      },
    };
    const result = await this.requestPermissions(constraints);
    if (!result.success) return result;
    this.setupAnalyser();
    this.startLevelMonitoring((level) => {
      this.peakLevel = Math.max(this.peakLevel, level);
      this.waveformData.push(level);
      if (this.waveformData.length > 200) this.waveformData.shift();
      this.emit("level", { level, peak: this.peakLevel, waveform: [...this.waveformData] });
      if (this.autoStopOnSilence) this._handleSilence(level);
    });
    return this.start({ ...options, audio: true });
  }

  _handleSilence(level) {
    if (level < this.silenceThreshold) {
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          if (this.state === "recording") {
            this.stop();
            this.emit("auto-stopped", { reason: "silence" });
          }
        }, this.silenceDuration);
      }
    } else {
      if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
    }
  }

  getWaveformSnapshot() {
    return [...this.waveformData];
  }

  getPeakLevel() { return this.peakLevel; }

  resetPeak() { this.peakLevel = 0; }

  async exportAs(targetFormat = "wav") {
    if (!this.currentBlob) return null;
    if (targetFormat === "wav") {
      return this._convertToWav(this.currentBlob);
    }
    return this.currentBlob;
  }

  async _convertToWav(blob) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const wavBuffer = this._encodeWav(decoded);
      return new Blob([wavBuffer], { type: "audio/wav" });
    } catch {
      return blob;
    }
  }

  _encodeWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const numSamples = audioBuffer.length;
    const dataSize = numSamples * numChannels * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const write = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    write(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    write(36, "data");
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = audioBuffer.getChannelData(ch)[i];
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return buffer;
  }

  getStats() {
    return {
      duration: this.getDuration(),
      state: this.state,
      peakLevel: this.peakLevel,
      chunks: this.chunks.length,
      size: this.chunks.reduce((s, c) => s + c.size, 0),
      avgLevel: this.waveformData.length > 0 ? Math.round(this.waveformData.reduce((a, b) => a + b, 0) / this.waveformData.length) : 0,
    };
  }
}

export const audioRecorder = new AudioRecorder();
