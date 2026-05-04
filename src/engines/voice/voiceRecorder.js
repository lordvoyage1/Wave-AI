/**
 * Wave AI — Voice Chat — Voice Recorder (High Quality Audio)
 */
export class HighQualityVoiceRecorder {
  constructor() { this.recorder = null; this.stream = null; this.chunks = []; this.state = "idle"; this.startTime = null; }
  async start(options = {}) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: options.sampleRate || 44100, channelCount: 1 } });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      this.chunks = [];
      this.recorder = new MediaRecorder(this.stream, { mimeType: mime, audioBitsPerSecond: options.bitrate || 128000 });
      this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
      this.recorder.start(100);
      this.startTime = Date.now(); this.state = "recording";
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  }
  stop() {
    if (!this.recorder || this.state !== "recording") return Promise.resolve(null);
    return new Promise((resolve) => {
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType });
        this.stream?.getTracks().forEach(t => t.stop());
        this.state = "idle";
        resolve({ blob, duration: Date.now() - this.startTime, url: URL.createObjectURL(blob) });
      };
      this.recorder.stop(); this.state = "stopping";
    });
  }
  pause() { if (this.state === "recording") { this.recorder?.pause(); this.state = "paused"; } }
  resume() { if (this.state === "paused") { this.recorder?.resume(); this.state = "recording"; } }
  getDuration() { return this.startTime ? Date.now() - this.startTime : 0; }
  getState() { return this.state; }
}
export const highQualityVoiceRecorder = new HighQualityVoiceRecorder();
