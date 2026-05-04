/**
 * Wave AI Recording Engine — Permission Manager
 * Browser permission state tracking for microphone,
 * camera, and screen capture with user guidance.
 */

export class PermissionManager {
  constructor() {
    this.permissions = { microphone: "unknown", camera: "unknown", screen: "not-applicable" };
    this.listeners = new Map();
  }

  async checkAll() {
    await Promise.all([this.checkMicrophone(), this.checkCamera()]);
    return this.permissions;
  }

  async checkMicrophone() {
    try {
      const status = await navigator.permissions.query({ name: "microphone" });
      this.permissions.microphone = status.state;
      status.onchange = () => { this.permissions.microphone = status.state; this._notify("microphone", status.state); };
    } catch { this.permissions.microphone = "unknown"; }
    return this.permissions.microphone;
  }

  async checkCamera() {
    try {
      const status = await navigator.permissions.query({ name: "camera" });
      this.permissions.camera = status.state;
      status.onchange = () => { this.permissions.camera = status.state; this._notify("camera", status.state); };
    } catch { this.permissions.camera = "unknown"; }
    return this.permissions.camera;
  }

  _notify(permission, state) {
    (this.listeners.get(permission) || []).forEach(cb => { try { cb(state); } catch {} });
  }

  onChange(permission, callback) {
    if (!this.listeners.has(permission)) this.listeners.set(permission, []);
    this.listeners.get(permission).push(callback);
  }

  async requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      this.permissions.microphone = "granted";
      return { granted: true };
    } catch (err) {
      this.permissions.microphone = "denied";
      return { granted: false, error: this._getUserFriendlyError(err) };
    }
  }

  async requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      this.permissions.camera = "granted";
      return { granted: true };
    } catch (err) {
      this.permissions.camera = "denied";
      return { granted: false, error: this._getUserFriendlyError(err) };
    }
  }

  async requestBoth() {
    const [mic, cam] = await Promise.all([this.requestMicrophone(), this.requestCamera()]);
    return { microphone: mic, camera: cam, allGranted: mic.granted && cam.granted };
  }

  _getUserFriendlyError(err) {
    const map = {
      NotAllowedError: "Permission was denied. Please click the camera/mic icon in your browser's address bar and allow access.",
      NotFoundError: "No microphone or camera found on your device.",
      NotReadableError: "Your microphone or camera is already in use by another application.",
      OverconstrainedError: "The requested media settings are not supported by your device.",
      SecurityError: "Media access is blocked for security reasons. Try using HTTPS.",
    };
    return map[err.name] || `Could not access device: ${err.message}`;
  }

  getGuidanceSteps(device) {
    const steps = {
      microphone: [
        "1. Look for a 🎤 or 🔒 icon in your browser's address bar",
        "2. Click it and select 'Allow' for microphone",
        "3. Refresh the page if needed",
        "4. On mobile: Settings → Browser → Permissions → Microphone",
      ],
      camera: [
        "1. Look for a 📷 or 🔒 icon in your browser's address bar",
        "2. Click it and select 'Allow' for camera",
        "3. Refresh the page if needed",
        "4. On mobile: Settings → Browser → Permissions → Camera",
      ],
    };
    return steps[device] || steps.microphone;
  }

  isGranted(device) { return this.permissions[device] === "granted"; }
  isDenied(device) { return this.permissions[device] === "denied"; }
  getAll() { return { ...this.permissions }; }
}

export async function enumerateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      microphones: devices.filter(d => d.kind === "audioinput").map(d => ({ id: d.deviceId, label: d.label || "Microphone", groupId: d.groupId })),
      cameras: devices.filter(d => d.kind === "videoinput").map(d => ({ id: d.deviceId, label: d.label || "Camera", groupId: d.groupId })),
      speakers: devices.filter(d => d.kind === "audiooutput").map(d => ({ id: d.deviceId, label: d.label || "Speaker", groupId: d.groupId })),
    };
  } catch { return { microphones: [], cameras: [], speakers: [] }; }
}

export const permissionManager = new PermissionManager();
