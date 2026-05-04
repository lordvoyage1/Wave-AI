/**
 * Wave AI — Image Generation — Gallery Manager
 * IndexedDB gallery storage, collections, favorites,
 * search, and sharing for generated images.
 */

const DB_NAME = "wave_image_gallery";
const DB_VERSION = 1;

export class ImageGallery {
  constructor() { this.db = null; this._init(); }

  async _init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("images")) {
          const store = db.createObjectStore("images", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("favorite", "favorite");
          store.createIndex("collection", "collection");
        }
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "id" });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      req.onerror = reject;
    });
  }

  async save(imageData) {
    await this._init();
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const record = { id, createdAt: Date.now(), favorite: false, collection: "default", views: 0, downloads: 0, ...imageData };
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error("DB not ready")); return; }
      const tx = this.db.transaction("images", "readwrite");
      const req = tx.objectStore("images").add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(limit = 50, offset = 0) {
    await this._init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("images", "readonly");
      const req = tx.objectStore("images").getAll();
      req.onsuccess = () => {
        const all = req.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(all.slice(offset, offset + limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async get(id) {
    await this._init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("images", "readonly");
      const req = tx.objectStore("images").get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async toggleFavorite(id) {
    const image = await this.get(id);
    if (!image) return null;
    return this.update(id, { favorite: !image.favorite });
  }

  async update(id, updates) {
    const image = await this.get(id);
    if (!image) return null;
    const updated = { ...image, ...updates, updatedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("images", "readwrite");
      const req = tx.objectStore("images").put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id) {
    await this._init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("images", "readwrite");
      const req = tx.objectStore("images").delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async getFavorites() {
    const all = await this.getAll(200);
    return all.filter(img => img.favorite);
  }

  async search(query) {
    const all = await this.getAll(200);
    const q = query.toLowerCase();
    return all.filter(img =>
      img.prompt?.toLowerCase().includes(q) ||
      img.collection?.toLowerCase().includes(q) ||
      img.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  async getStats() {
    const all = await this.getAll(1000);
    return {
      total: all.length,
      favorites: all.filter(i => i.favorite).length,
      collections: [...new Set(all.map(i => i.collection))].length,
      totalDownloads: all.reduce((s, i) => s + (i.downloads || 0), 0),
    };
  }

  async createCollection(name, description = "") {
    await this._init();
    const id = `col_${Date.now()}`;
    const collection = { id, name, description, createdAt: Date.now(), imageCount: 0 };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("collections", "readwrite");
      const req = tx.objectStore("collections").add(collection);
      req.onsuccess = () => resolve(collection);
      req.onerror = () => reject(req.error);
    });
  }

  download(url, filename = "wave-ai-generated.png") {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
}

export const imageGallery = new ImageGallery();
