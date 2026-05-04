/**
 * Wave AI Recording Engine — Video Recorder
 * Screen + camera recording, picture-in-picture,
 * resolution selection, and frame-rate control.
 */

import { RecordingCore, getSupportedMimeType } from "./core.js";

export const VIDEO_QUALITIES = {
  "4K": { width: 3840, height: 2160, frameRate: 30, videoBitsPerSecond: 15000000 },
  "1080p": { width: 1920, height: 1080, frameRate: 30, videoBitsPerSecond: 5000000 },
  "720p": { width: 1280, height: 720, frameRate: 30, videoBitsPerSecond: 2500000 },
  "480p": { width: 854, height: 480, frameRate: 30, videoBitsPerSecond: 1500000 },
  "360p": { width: 640, height: 360, frameRate: 30, videoBitsPerSecond: 800000 },
};

export class VideoRecorder extends RecordingCore {
  constructor() {
    super();
    this.cameraStream = null;
    this.screenStream = null;
    this.combinedStream = null;
    this.canvas = null;
    this.ctx = null;
    this.animFrame = null;
    this.quality = "720p";
    this.mode = "camera"; // camera | screen | both
    this.pipPosition = "bottom-right"; // bottom-right | bottom-left | top-right | top-left
  }

  async startCamera(quality = "720p") {
    this.quality = quality;
    this.mode = "camera";
    const { width, height, frameRate } = VIDEO_QUALITIES[quality] || VIDEO_QUALITIES["720p"];
    const constraints = {
      video: { width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: frameRate }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true },
    };
    const perm = await this.requestPermissions(constraints);
    if (!perm.success) return perm;
    return this.start({ video: true, quality });
  }

  async startScreen(withAudio = true) {
    this.mode = "screen";
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor", width: 1920, height: 1080, frameRate: 30 },
        audio: withAudio,
      });
      const format = getSupportedMimeType("video");
      this.chunks = [];
      const { videoBitsPerSecond } = VIDEO_QUALITIES["720p"];
      this.mediaRecorder = new MediaRecorder(this.screenStream, { mimeType: format.mime, videoBitsPerSecond });
      this.mediaRecorder.ondataavailable = (e) => { if (e.data?.size > 0) this.chunks.push(e.data); };
      this.mediaRecorder.onstop = () => this._onStop(format);
      this.mediaRecorder.start(100);
      this.startTime = Date.now();
      this.state = "recording";
      this.screenStream.getVideoTracks()[0].onended = () => this.stop();
      this.emit("start", { mode: "screen", format });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async startScreenWithCamera(quality = "720p") {
    this.mode = "both";
    this.quality = quality;
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      await this._setupCanvas();
      return { success: true, mode: "both" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _setupCanvas() {
    const q = VIDEO_QUALITIES[this.quality] || VIDEO_QUALITIES["720p"];
    this.canvas = document.createElement("canvas");
    this.canvas.width = q.width;
    this.canvas.height = q.height;
    this.ctx = this.canvas.getContext("2d");
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = this.screenStream;
    await screenVideo.play();
    const camVideo = document.createElement("video");
    camVideo.srcObject = this.cameraStream;
    await camVideo.play();
    const pipW = Math.round(q.width * 0.25);
    const pipH = Math.round(q.height * 0.25);
    const margin = 16;
    const pipPositions = {
      "bottom-right": { x: q.width - pipW - margin, y: q.height - pipH - margin },
      "bottom-left": { x: margin, y: q.height - pipH - margin },
      "top-right": { x: q.width - pipW - margin, y: margin },
      "top-left": { x: margin, y: margin },
    };
    const drawFrame = () => {
      this.ctx.drawImage(screenVideo, 0, 0, q.width, q.height);
      const pos = pipPositions[this.pipPosition] || pipPositions["bottom-right"];
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.roundRect(pos.x, pos.y, pipW, pipH, 12);
      this.ctx.clip();
      this.ctx.drawImage(camVideo, pos.x, pos.y, pipW, pipH);
      this.ctx.restore();
      this.ctx.strokeStyle = "rgba(79,127,255,0.8)";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(pos.x, pos.y, pipW, pipH, 12);
      this.ctx.stroke();
      this.animFrame = requestAnimationFrame(drawFrame);
    };
    drawFrame();
    this.combinedStream = this.canvas.captureStream(30);
    const audioTracks = [...(this.screenStream.getAudioTracks() || [])];
    audioTracks.forEach(t => this.combinedStream.addTrack(t));
    const format = getSupportedMimeType("video");
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.combinedStream, { mimeType: format.mime, videoBitsPerSecond: 5000000 });
    this.mediaRecorder.ondataavailable = (e) => { if (e.data?.size > 0) this.chunks.push(e.data); };
    this.mediaRecorder.onstop = () => { if (this.animFrame) cancelAnimationFrame(this.animFrame); this._onStop(format); };
    this.mediaRecorder.start(100);
    this.startTime = Date.now();
    this.state = "recording";
    this.emit("start", { mode: "both", format });
  }

  async takeSnapshot() {
    if (!this.canvas) return null;
    return new Promise(resolve => this.canvas.toBlob(resolve, "image/png"));
  }

  setPipPosition(position) {
    const valid = ["bottom-right", "bottom-left", "top-right", "top-left"];
    if (valid.includes(position)) this.pipPosition = position;
  }

  getThumbnail() {
    if (!this.canvas) return null;
    return this.canvas.toDataURL("image/jpeg", 0.5);
  }
}

export const videoRecorder = new VideoRecorder();
