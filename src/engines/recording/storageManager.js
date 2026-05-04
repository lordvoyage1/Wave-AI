/**
 * Wave AI Recording Engine — Storage Manager
 * IndexedDB-based recording storage with metadata,
 * search, export, and quota management.
 */

const DB_NAME = "wave_recordings";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

export class RecordingStorageManager {
  constructor() {
    this.db = null;
    this.ready = false;
    this.initPromise = this._init();
  }

  async _init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("duration", "duration", { unique: false });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; this.ready = true; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
  }

  async save(blob, metadata = {}) {
    await this.initPromise;
    const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = {
      id,
      blob,
      type: metadata.type || "audio",
      name: metadata.name || `Recording ${new Date().toLocaleString()}`,
      duration: metadata.duration || 0,
      size: blob.size,
      mimeType: blob.type,
      createdAt: Date.now(),
      tags: metadata.tags || [],
      transcript: metadata.transcript || "",
      thumbnail: metadata.thumbnail || null,
      ...metadata,
    };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
      req.onerror = () => reject(req.error);
    });
  }

  async get(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async update(id, updates) {
    const record = await this.get(id);
    if (!record) return null;
    const updated = { ...record, ...updates };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  async search(query) {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.transcript?.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  async getByType(type) {
    const all = await this.getAll();
    return all.filter(r => r.type === type);
  }

  async getTotalSize() {
    const all = await this.getAll();
    return all.reduce((s, r) => s + (r.size || 0), 0);
  }

  async getStats() {
    const all = await this.getAll();
    const totalSize = all.reduce((s, r) => s + (r.size || 0), 0);
    const totalDuration = all.reduce((s, r) => s + (r.duration || 0), 0);
    return {
      count: all.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalDuration,
      byType: {
        audio: all.filter(r => r.type === "audio").length,
        video: all.filter(r => r.type === "video").length,
        screen: all.filter(r => r.type === "screen").length,
      },
    };
  }

  createObjectURL(blob) { return URL.createObjectURL(blob); }

  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export const recordingStorage = new RecordingStorageManager();
