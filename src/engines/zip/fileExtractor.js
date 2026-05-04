/**
 * Wave AI — ZIP Analysis — File Extractor
 */
export class FileExtractor {
  async extractFile(zip, filename) {
    if (!zip) return null;
    try {
      const entry = Object.entries(zip.files).find(([name]) => name === filename || name.endsWith(`/${filename}`))?.[1];
      if (!entry) return null;
      const text = await entry.async("string").catch(() => null);
      const blob = await entry.async("blob").catch(() => null);
      return { text, blob, filename, size: blob?.size || text?.length || 0 };
    } catch { return null; }
  }
  async extractByPattern(zip, pattern) {
    if (!zip) return [];
    const results = [];
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && pattern.test(name)) {
        try { const text = await entry.async("string"); results.push({ filename: name, content: text, size: text.length }); } catch {}
      }
    }
    return results;
  }
  async extractAll(zip, maxSizeKB = 100) {
    if (!zip) return [];
    const results = [];
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      try {
        const blob = await entry.async("blob");
        if (blob.size > maxSizeKB * 1024) { results.push({ filename: name, size: blob.size, skipped: true, reason: "Too large" }); continue; }
        const text = await blob.text();
        results.push({ filename: name, content: text, size: blob.size, blob });
      } catch {}
    }
    return results;
  }
  async extractImage(zip, filename) {
    const file = await this.extractFile(zip, filename);
    if (!file?.blob) return null;
    const url = URL.createObjectURL(file.blob);
    return { url, blob: file.blob, filename };
  }
  listFiles(zip) {
    if (!zip) return [];
    return Object.keys(zip.files).filter(name => !zip.files[name].dir).map(name => ({ name, size: zip.files[name]._data?.uncompressedSize || 0, compressed: zip.files[name]._data?.compressedSize || 0 }));
  }
}
export const fileExtractor = new FileExtractor();
