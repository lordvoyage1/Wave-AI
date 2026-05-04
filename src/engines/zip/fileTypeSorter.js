/**
 * Wave AI — ZIP Analysis — File Type Sorter
 */
import { getFileCategory, getFileIcon } from "./core.js";
export function sortByType(entries) {
  return [...entries].sort((a, b) => { if (a.isDirectory && !b.isDirectory) return -1; if (!a.isDirectory && b.isDirectory) return 1; const ca = getFileCategory(a.name), cb = getFileCategory(b.name); if (ca !== cb) return ca.localeCompare(cb); return a.name.localeCompare(b.name); });
}
export function sortBySize(entries, desc = true) { return [...entries].filter(e => !e.isDirectory).sort((a, b) => desc ? (b.size || 0) - (a.size || 0) : (a.size || 0) - (b.size || 0)); }
export function sortByDate(entries, desc = true) { return [...entries].sort((a, b) => { const da = new Date(a.date || 0), db = new Date(b.date || 0); return desc ? db - da : da - db; }); }
export function sortByName(entries, asc = true) { return [...entries].sort((a, b) => asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)); }
export function groupByCategory(entries) {
  const groups = {};
  for (const entry of entries.filter(e => !e.isDirectory)) {
    const cat = getFileCategory(entry.name);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ ...entry, icon: getFileIcon(entry.name) });
  }
  return groups;
}
export function filterByCategory(entries, category) { return entries.filter(e => !e.isDirectory && getFileCategory(e.name) === category); }
export function filterByExtension(entries, ext) { return entries.filter(e => e.name.toLowerCase().endsWith(`.${ext.replace(/^\./, "")}`)); }
export function filterBySize(entries, minBytes = 0, maxBytes = Infinity) { return entries.filter(e => (e.size || 0) >= minBytes && (e.size || 0) <= maxBytes); }
export function getFileSummary(entries) {
  const files = entries.filter(e => !e.isDirectory);
  const groups = groupByCategory(files);
  return Object.entries(groups).map(([cat, items]) => ({ category: cat, count: items.length, totalSize: items.reduce((s, f) => s + (f.size || 0), 0), extensions: [...new Set(items.map(f => f.name.split(".").pop()?.toLowerCase()).filter(Boolean))] })).sort((a, b) => b.count - a.count);
}
