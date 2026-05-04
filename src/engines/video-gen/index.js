/**
 * Wave AI — Video Generation Engine Index
 */
export * from "./core.js";

export async function generateVideo(prompt, options = {}) {
  const { generateVideoHuggingFace, canvasVideoGenerator, VIDEO_STYLES } = await import("./core.js");
  const style = VIDEO_STYLES[options.style] || "";
  const fullPrompt = style ? `${prompt}, ${style}` : prompt;
  const hfResult = await generateVideoHuggingFace(fullPrompt, options);
  if (hfResult.success) return hfResult;
  const template = options.template || "textAnimation";
  return canvasVideoGenerator.generate(template, { ...options, text: prompt });
}

export async function createSlideshowVideo(images, options = {}) {
  const { CanvasVideoGenerator } = await import("./core.js");
  const gen = new CanvasVideoGenerator();
  const canvas = gen.setup(options.width || 854, options.height || 480);
  const duration = images.length * (options.durationPerSlide || 3);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const chunks = [];
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(100);
  const loadedImages = await Promise.all(images.map(src => new Promise((res, rej) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = () => res(null); img.src = src;
  })));
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  await new Promise(resolve => {
    const startTime = Date.now();
    const totalMs = duration * 1000;
    const msPerSlide = totalMs / images.length;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalMs) { recorder.stop(); setTimeout(resolve, 200); return; }
      const slideIndex = Math.min(images.length - 1, Math.floor(elapsed / msPerSlide));
      const slideProgress = (elapsed % msPerSlide) / msPerSlide;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const img = loadedImages[slideIndex];
      if (img) ctx.drawImage(img, 0, 0, W, H);
      if (slideProgress < 0.1) {
        ctx.fillStyle = `rgba(0,0,0,${1 - slideProgress * 10})`;
        ctx.fillRect(0, 0, W, H);
      } else if (slideProgress > 0.9) {
        ctx.fillStyle = `rgba(0,0,0,${(slideProgress - 0.9) * 10})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (options.caption) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, H - 60, W, 60);
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(options.caption, W / 2, H - 25);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  });
  const blob = new Blob(chunks, { type: mimeType });
  return { success: true, blob, url: URL.createObjectURL(blob), duration };
}
