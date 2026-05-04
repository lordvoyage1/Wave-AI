/**
 * Wave AI — Image Generation — Avatar Generator
 * Create unique avatars from initials, patterns, or AI generation.
 */
export class AvatarGenerator {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  fromInitials(name, size = 128, options = {}) {
    const { bgColor, textColor = "#ffffff", fontSize } = options;
    const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["#4f7fff", "#9b5cff", "#f472b6", "#06d6a0", "#ff6b35", "#ffd166", "#ef476f", "#118ab2"];
    const bg = bgColor || colors[name.charCodeAt(0) % colors.length];
    this.canvas.width = this.canvas.height = size;
    this.ctx.fillStyle = bg; this.ctx.beginPath(); this.ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.font = `bold ${fontSize || Math.round(size * 0.42)}px Arial`;
    this.ctx.fillStyle = textColor; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
    this.ctx.fillText(initials, size / 2, size / 2);
    return { dataURL: this.canvas.toDataURL("image/png"), initials, bg };
  }

  geometric(seed = 42, size = 128) {
    this.canvas.width = this.canvas.height = size;
    const ctx = this.ctx;
    const rng = (n) => ((Math.sin(seed + n) + 1) / 2);
    ctx.fillStyle = `hsl(${rng(0) * 360}, 60%, 15%)`; ctx.fillRect(0, 0, size, size);
    const shapes = 8;
    for (let i = 0; i < shapes; i++) {
      ctx.fillStyle = `hsla(${rng(i) * 360}, 70%, 60%, 0.7)`;
      const x = rng(i * 3) * size, y = rng(i * 3 + 1) * size, r = rng(i * 3 + 2) * size * 0.4;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return { dataURL: this.canvas.toDataURL("image/png"), seed };
  }

  async fromAI(description, apiKey) {
    if (!apiKey) return this.geometric(Math.random() * 1000);
    const prompt = `Profile avatar portrait: ${description}, minimalist, clean background, centered, professional`;
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { width: 512, height: 512, num_inference_steps: 25 } }),
    });
    if (!response.ok) return this.geometric(description.charCodeAt(0));
    const blob = await response.blob();
    return { blob, url: URL.createObjectURL(blob), description };
  }

  waveAIAvatar() {
    const size = 128;
    this.canvas.width = this.canvas.height = size;
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#4f7fff"); grad.addColorStop(0.5, "#9b5cff"); grad.addColorStop(1, "#f472b6");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold ${Math.round(size * 0.35)}px Arial`;
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("W", size / 2, size / 2);
    return { dataURL: this.canvas.toDataURL("image/png") };
  }
}
export const avatarGenerator = new AvatarGenerator();
