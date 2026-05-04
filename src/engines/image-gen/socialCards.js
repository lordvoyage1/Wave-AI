/**
 * Wave AI — Image Generation — Social Cards Generator
 * Create professional social media cards for Instagram, Twitter, LinkedIn.
 */
export const SOCIAL_SIZES = {
  instagram_square: { width: 1080, height: 1080, label: "Instagram Post" },
  instagram_story: { width: 1080, height: 1920, label: "Instagram Story" },
  twitter_card: { width: 1200, height: 675, label: "Twitter Card" },
  linkedin_banner: { width: 1584, height: 396, label: "LinkedIn Banner" },
  facebook_cover: { width: 1640, height: 624, label: "Facebook Cover" },
  youtube_thumbnail: { width: 1280, height: 720, label: "YouTube Thumbnail" },
  og_image: { width: 1200, height: 630, label: "Open Graph Image" },
};

export class SocialCardGenerator {
  constructor() { this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d"); }

  async create(type, content = {}) {
    const size = SOCIAL_SIZES[type] || SOCIAL_SIZES.og_image;
    this.canvas.width = size.width; this.canvas.height = size.height;
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, size.width, size.height);
    (content.colors || ["#0d1117", "#1a1a2e"]).forEach((c, i, a) => grad.addColorStop(i / Math.max(1, a.length - 1), c));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, size.width, size.height);
    if (content.backgroundImage) {
      const bg = await this._loadImage(content.backgroundImage).catch(() => null);
      if (bg) { ctx.globalAlpha = 0.3; ctx.drawImage(bg, 0, 0, size.width, size.height); ctx.globalAlpha = 1; }
    }
    const titleSize = Math.round(size.width * 0.06);
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.fillStyle = content.titleColor || "#ffffff";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
    const title = content.title || "Wave AI";
    this._wrapText(ctx, title, size.width / 2, size.height / 2, size.width * 0.85, titleSize * 1.3);
    if (content.subtitle) {
      ctx.font = `${Math.round(titleSize * 0.55)}px Arial`;
      ctx.fillStyle = content.subtitleColor || "rgba(255,255,255,0.7)";
      ctx.fillText(content.subtitle, size.width / 2, size.height / 2 + titleSize * 1.8);
    }
    if (content.branding) {
      ctx.font = `bold ${Math.round(titleSize * 0.4)}px Arial`;
      ctx.fillStyle = "#4f7fff"; ctx.shadowBlur = 0;
      ctx.fillText(content.branding, size.width / 2, size.height - Math.round(size.height * 0.06));
    }
    ctx.shadowBlur = 0;
    const blob = await new Promise(r => this.canvas.toBlob(r, "image/jpeg", 0.95));
    return { blob, dataURL: this.canvas.toDataURL("image/jpeg", 0.95), url: URL.createObjectURL(blob), type, size };
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" "); let line = "";
    const lines = [];
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line !== "") { lines.push(line); line = word + " "; }
      else { line = test; }
    }
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l.trim(), x, startY + i * lineHeight));
  }

  _loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
  }

  download(dataURL, filename) { const a = document.createElement("a"); a.href = dataURL; a.download = filename || "wave-social-card.jpg"; a.click(); }
}
export const socialCardGenerator = new SocialCardGenerator();
