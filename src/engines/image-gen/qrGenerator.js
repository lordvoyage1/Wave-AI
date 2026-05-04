/**
 * Wave AI — Image Generation — QR Code Generator
 * Generate styled QR codes for URLs, text, and vCards.
 */
export async function generateQRCode(text, options = {}) {
  const { size = 256, color = "#000000", background = "#ffffff", style = "square" } = options;
  if (window.QRCode) {
    const canvas = document.createElement("canvas");
    const qr = new window.QRCode(canvas, { text, width: size, height: size, colorDark: color, colorLight: background, correctLevel: window.QRCode.CorrectLevel.H });
    return { dataURL: canvas.toDataURL(), blob: await new Promise(r => canvas.toBlob(r, "image/png")) };
  }
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color.replace("#", "")}&bgcolor=${background.replace("#", "")}`;
  const response = await fetch(url);
  const blob = await response.blob();
  return { dataURL: URL.createObjectURL(blob), blob, url: URL.createObjectURL(blob), source: "qrserver.com" };
}

export function generateVCard(name, email, phone, company = "Wave AI") {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nEMAIL:${email}\nTEL:${phone}\nORG:${company}\nEND:VCARD`;
}

export function generateWiFiQR(ssid, password, security = "WPA") {
  return `WIFI:T:${security};S:${ssid};P:${password};;`;
}
