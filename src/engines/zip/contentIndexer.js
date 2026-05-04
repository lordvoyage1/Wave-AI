/**
 * Wave AI — ZIP Analysis — Content Indexer
 */
export class ContentIndexer {
  constructor() { this.wordIndex = new Map(); this.fileIndex = new Map(); this.built = false; }
  build(textFiles) {
    this.wordIndex.clear(); this.fileIndex.clear();
    for (const file of textFiles) {
      const words = file.content.toLowerCase().match(/\b[a-zA-Z_$][a-zA-Z0-9_$]{2,}\b/g) || [];
      const unique = new Set(words);
      this.fileIndex.set(file.name, { filename: file.name, wordCount: words.length, uniqueWords: unique.size, lines: file.lines, size: file.size });
      unique.forEach(word => { if (!this.wordIndex.has(word)) this.wordIndex.set(word, []); this.wordIndex.get(word).push(file.name); });
    }
    this.built = true;
    return this;
  }
  search(term) { return this.wordIndex.get(term.toLowerCase()) || []; }
  searchPrefix(prefix) { const p = prefix.toLowerCase(); return [...this.wordIndex.keys()].filter(w => w.startsWith(p)).slice(0, 20); }
  getTopWords(n = 30) {
    return [...this.wordIndex.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, n).map(([word, files]) => ({ word, occurrences: files.length, files: [...new Set(files)] }));
  }
  getFileStats(filename) { return this.fileIndex.get(filename) || null; }
  getTopFiles(n = 10) { return [...this.fileIndex.values()].sort((a, b) => b.wordCount - a.wordCount).slice(0, n); }
  getSummary() { return { totalWords: this.wordIndex.size, totalFiles: this.fileIndex.size, built: this.built }; }
  clear() { this.wordIndex.clear(); this.fileIndex.clear(); this.built = false; }
}
export const contentIndexer = new ContentIndexer();
