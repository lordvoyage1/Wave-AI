/**
 * Wave AI — ZIP Analysis — Archive Statistics Engine
 */
export function calculateArchiveStats(entries, originalSize) {
  const files = entries.filter(e => !e.isDirectory);
  const dirs = entries.filter(e => e.isDirectory);
  const totalUncompressed = files.reduce((s, f) => s + (f.size || 0), 0);
  const totalCompressed = files.reduce((s, f) => s + (f.compressedSize || 0), 0);
  const compressionRatio = totalCompressed > 0 ? ((1 - totalCompressed / totalUncompressed) * 100).toFixed(1) : "0";
  const extFreq = {};
  files.forEach(f => { const ext = f.name.split(".").pop()?.toLowerCase() || "no-ext"; extFreq[ext] = (extFreq[ext] || 0) + 1; });
  const topExtensions = Object.entries(extFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const deepestPath = files.reduce((d, f) => { const depth = (f.name.match(/\//g) || []).length; return depth > d.depth ? { path: f.name, depth } : d; }, { path: "", depth: 0 });
  return { totalFiles: files.length, totalDirs: dirs.length, totalEntries: entries.length, uncompressedSize: totalUncompressed, compressedSize: totalCompressed, compressionRatio: `${compressionRatio}%`, spaceSaved: formatSize(Math.max(0, totalUncompressed - totalCompressed)), originalFileSize: originalSize, topExtensions, averageFileSize: files.length ? Math.round(totalUncompressed / files.length) : 0, largestFile: files.reduce((max, f) => (f.size || 0) > (max.size || 0) ? f : max, {}), smallestFile: files.reduce((min, f) => (f.size || 0) < (min.size || Infinity) ? f : min, {}), deepestPath: deepestPath.path };
}
function formatSize(bytes) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
export function getFileDistribution(files) {
  const buckets = { "< 1KB": 0, "1-10KB": 0, "10-100KB": 0, "100KB-1MB": 0, "> 1MB": 0 };
  files.forEach(f => {
    const s = f.size || 0;
    if (s < 1024) buckets["< 1KB"]++;
    else if (s < 10240) buckets["1-10KB"]++;
    else if (s < 102400) buckets["10-100KB"]++;
    else if (s < 1048576) buckets["100KB-1MB"]++;
    else buckets["> 1MB"]++;
  });
  return buckets;
}
export function findDuplicates(textFiles) {
  const contentMap = new Map();
  textFiles.forEach(f => { const key = f.content?.slice(0, 500); if (key) { if (!contentMap.has(key)) contentMap.set(key, []); contentMap.get(key).push(f.name); } });
  return [...contentMap.entries()].filter(([, files]) => files.length > 1).map(([, files]) => ({ files, count: files.length }));
}
