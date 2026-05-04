/**
 * Wave AI — ZIP Analysis — File Search Engine
 */
export class ZipFileSearcher {
  constructor() { this.index = new Map(); }
  buildIndex(textFiles) { this.index.clear(); for (const f of textFiles) { const words = f.content.toLowerCase().split(/\s+/); words.forEach(w => { if (w.length > 2) { if (!this.index.has(w)) this.index.set(w, []); this.index.get(w).push(f.name); } }); } }
  search(query, textFiles) {
    const q = query.toLowerCase();
    return textFiles.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.content.toLowerCase().includes(q) ||
      f.path?.toLowerCase().includes(q)
    ).map(f => {
      const lines = f.content.split("\n");
      const matchingLines = lines.map((l, i) => ({ line: i + 1, content: l.trim(), match: l.toLowerCase().includes(q) })).filter(l => l.match);
      return { ...f, matchCount: matchingLines.length, matchingLines: matchingLines.slice(0, 5) };
    }).sort((a, b) => b.matchCount - a.matchCount);
  }
  searchByFilename(pattern, entries) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern.replace(/\*/g, ".*"), "i");
    return entries.filter(e => regex.test(e.name));
  }
  findImports(textFiles) {
    const importMap = new Map();
    for (const f of textFiles) {
      const imports = [...f.content.matchAll(/(?:import|require)\s*(?:.*?\s*from\s*)?['"](.*?)['"]/g)].map(m => m[1]);
      if (imports.length) importMap.set(f.name, imports);
    }
    return importMap;
  }
  findExports(textFiles) {
    const exportMap = new Map();
    for (const f of textFiles) {
      const exports = [...f.content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)?\s+(\w+)/g)].map(m => m[1]);
      if (exports.length) exportMap.set(f.name, exports);
    }
    return exportMap;
  }
  searchTODOs(textFiles) {
    const todos = [];
    for (const f of textFiles) {
      const lines = f.content.split("\n");
      lines.forEach((line, i) => { if (/\b(TODO|FIXME|HACK|XXX|BUG|NOTE|REVIEW)\b/i.test(line)) todos.push({ file: f.name, line: i + 1, type: line.match(/\b(TODO|FIXME|HACK|XXX|BUG|NOTE|REVIEW)\b/i)?.[1], content: line.trim() }); });
    }
    return todos;
  }
}
export const zipFileSearcher = new ZipFileSearcher();
