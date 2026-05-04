/**
 * Wave AI — Video Generation Engine Core
 * Text-to-video, image-to-video, canvas animation,
 * and HuggingFace video generation models.
 */

export const VIDEO_MODELS = {
  "zeroscope": { id: "cerspense/zeroscope_v2_576w", name: "Zeroscope v2", quality: "★★★★", free: true, maxFrames: 36 },
  "animatediff": { id: "guoyww/animatediff-motion-adapter-v1-5-2", name: "AnimateDiff", quality: "★★★★", free: true },
  "stable-video": { id: "stabilityai/stable-video-diffusion-img2vid", name: "SVD Img2Vid", quality: "★★★★★", free: true },
};

export const VIDEO_STYLES = {
  cinematic: "cinematic, film grain, dramatic lighting, shallow depth of field, movie quality",
  animation: "smooth animation, vibrant colors, cartoon style, fluid motion",
  nature: "nature documentary, wildlife, 4K, golden hour, atmospheric",
  timelapse: "timelapse, fast motion, dramatic changes, epic scale",
  abstract: "abstract motion graphics, flowing shapes, color transitions, artistic",
};

export const CANVAS_VIDEO_TEMPLATES = {
  slideshow: {
    name: "Slideshow",
    description: "Images with transitions and text overlays",
    duration: 10,
    fps: 30,
  },
  textAnimation: {
    name: "Text Animation",
    description: "Animated text with background",
    duration: 5,
    fps: 30,
  },
  particleEffect: {
    name: "Particle Effect",
    description: "Animated particles and motion",
    duration: 8,
    fps: 30,
  },
  countdown: {
    name: "Countdown Timer",
    description: "Animated countdown with effects",
    duration: 10,
    fps: 30,
  },
};

export async function generateVideoHuggingFace(prompt, options = {}) {
  const apiKey = options.apiKey || import.meta?.env?.VITE_HF_API_KEY;
  if (!apiKey) return { success: false, error: "No HuggingFace API key", useFallback: true };
  const modelId = options.modelId || VIDEO_MODELS["zeroscope"].id;
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_frames: options.numFrames || 16,
          num_inference_steps: options.steps || 25,
          guidance_scale: options.guidanceScale || 7.5,
          width: options.width || 576,
          height: options.height || 320,
        },
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (err.error?.includes("loading")) return { success: false, error: "Model loading, retry in 30s", loading: true };
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { success: true, url, blob, prompt, model: modelId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export class CanvasVideoGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.recorder = null;
    this.chunks = [];
    this.animFrame = null;
    this.isRecording = false;
    this.fps = 30;
    this.duration = 10;
  }

  setup(width = 854, height = 480) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
    return this.canvas;
  }

  async generate(template, options = {}) {
    if (!this.canvas) this.setup(options.width || 854, options.height || 480);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    this.chunks = [];
    this.recorder = new MediaRecorder(this.canvas.captureStream(this.fps), { mimeType, videoBitsPerSecond: 2500000 });
    this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.start(100);
    this.isRecording = true;
    const duration = (options.duration || this.duration) * 1000;
    const startTime = Date.now();
    await new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        this._renderFrame(template, progress, options);
        if (elapsed < duration) {
          this.animFrame = requestAnimationFrame(animate);
        } else {
          this.recorder.stop();
          this.isRecording = false;
          setTimeout(resolve, 200);
        }
      };
      this.animFrame = requestAnimationFrame(animate);
    });
    const blob = new Blob(this.chunks, { type: mimeType });
    return { success: true, blob, url: URL.createObjectURL(blob), duration: options.duration || this.duration };
  }

  _renderFrame(template, progress, options = {}) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    switch (template) {
      case "textAnimation":
        this._renderTextAnimation(progress, options);
        break;
      case "particleEffect":
        this._renderParticles(progress, options);
        break;
      case "countdown":
        this._renderCountdown(progress, options);
        break;
      default:
        this._renderDefaultAnimation(progress, options);
    }
  }

  _renderTextAnimation(progress, options) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, `hsl(${progress * 360}, 70%, 15%)`);
    grad.addColorStop(1, `hsl(${(progress * 360 + 120) % 360}, 70%, 20%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const text = options.text || "Wave AI";
    const scale = 0.5 + progress * 0.5;
    const alpha = Math.min(1, progress * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.font = `bold ${Math.min(W / text.length * 1.2, 80)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#4f7fff";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "white";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  _renderParticles(progress, options) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);
    const seed = 42;
    const count = 80;
    for (let i = 0; i < count; i++) {
      const x = ((i * 137.508 + progress * 200) % W);
      const y = ((i * 97.531 + progress * 150) % H);
      const size = 2 + (i % 5);
      const hue = (i * 15 + progress * 180) % 360;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      ctx.fill();
    }
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(options.text || "Generated by Wave AI", W / 2, H - 40);
  }

  _renderCountdown(progress, options) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    const total = options.from || 10;
    const current = Math.ceil(total * (1 - progress));
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    grad.addColorStop(0, "#1a0a2e");
    grad.addColorStop(1, "#0a0a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const ring = progress * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 120, -Math.PI / 2, -Math.PI / 2 + ring);
    ctx.strokeStyle = "#4f7fff";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.font = "bold 96px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(current > 0 ? current : "GO!", W / 2, H / 2);
  }

  _renderDefaultAnimation(progress, options) {
    const { width: W, height: H } = this.canvas;
    const ctx = this.ctx;
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);
    const t = progress * Math.PI * 4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(W / 2 + Math.sin(t + i) * 100, H / 2 + Math.cos(t * 0.7 + i) * 80, 20 + i * 10, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${i * 72 + t * 20}, 80%, 60%, 0.6)`;
      ctx.fill();
    }
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("Wave AI — Video Generation", W / 2, H - 30);
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.isRecording = false;
  }
}

export const canvasVideoGenerator = new CanvasVideoGenerator();
