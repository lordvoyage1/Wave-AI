/**
 * Wave AI — Image Modification — Image Share Engine
 */
export class ImageShareEngine {
  async share(dataURL, title = "Wave AI Image") {
    if (!navigator.share) return { success: false, error: "Web Share API not supported" };
    try {
      const blob = await this._dataURLToBlob(dataURL);
      const file = new File([blob], "wave-ai-image.png", { type: "image/png" });
      await navigator.share({ title, files: [file] });
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  }
  download(dataURL, filename = "wave-ai-image.png") {
    const a = document.createElement("a"); a.href = dataURL; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  async copyToClipboard(dataURL) {
    try {
      const blob = await this._dataURLToBlob(dataURL);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  }
  _dataURLToBlob(dataURL) {
    const arr = dataURL.split(","); const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]); const n = bstr.length; const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  }
  async getImageAsBase64(blob) { return new Promise(r => { const reader = new FileReader(); reader.onloadend = () => r(reader.result); reader.readAsDataURL(blob); }); }
  getShareText(prompt = "") { return `Check out this AI-generated image from Wave AI! ${prompt ? `"${prompt}"` : ""} — Created with Wave AI by Wave Platforms, Inc.`; }
}
export const imageShareEngine = new ImageShareEngine();
