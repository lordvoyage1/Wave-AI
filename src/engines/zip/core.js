/**
 * Wave AI — ZIP Analysis Engine Core
 * Extract, analyze, and understand ZIP/archive contents.
 * Supports ZIP, detect file types, code analysis, and AI summarization.
 */

export const SUPPORTED_ARCHIVES = ["zip", "cbz", "cbr", "jar", "apk", "docx", "xlsx", "pptx", "odt", "ods"];

export const FILE_CATEGORIES = {
  code: ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "h", "cs", "go", "rs", "rb", "php", "swift", "kt", "scala", "r", "m", "sh", "bash", "ps1"],
  web: ["html", "htm", "css", "scss", "sass", "less", "vue", "svelte"],
  data: ["json", "xml", "csv", "tsv", "yaml", "yml", "toml", "ini", "env", "sql"],
  docs: ["txt", "md", "pdf", "doc", "docx", "rst", "tex", "org"],
  images: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff"],
  audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
  video: ["mp4", "webm", "avi", "mov", "mkv", "flv"],
  config: ["config", "cfg", "conf", "properties", "plist", "gitignore", "dockerignore", "editorconfig"],
  archives: ["zip", "tar", "gz", "bz2", "7z", "rar", "cbz", "cbr"],
  executables: ["exe", "dmg", "deb", "rpm", "pkg", "msi", "bat", "cmd"],
};

export function getFileCategory(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  for (const [category, exts] of Object.entries(FILE_CATEGORIES)) {
    if (exts.includes(ext)) return category;
  }
  return "other";
}

export function getFileIcon(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const icons = {
    js: "📜", ts: "🔷", jsx: "⚛️", tsx: "⚛️", py: "🐍", java: "☕",
    html: "🌐", css: "🎨", json: "📋", md: "📝", txt: "📄",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🎞️", svg: "🎨",
    mp3: "🎵", wav: "🎵", mp4: "🎬", zip: "📦", pdf: "📑",
    csv: "📊", xlsx: "📊", xml: "📋", sql: "🗄️", go: "🐹",
    rs: "🦀", cpp: "⚙️", sh: "💻", bash: "💻", yml: "⚙️",
    yaml: "⚙️", env: "🔧", docker: "🐳", git: "🌿",
  };
  return icons[ext] || "📄";
}

export async function readZipFile(file) {
  if (!window.JSZip) {
    return { success: false, error: "JSZip library not loaded. Files will be analyzed by name and size only." };
  }
  try {
    const JSZip = window.JSZip;
    const zip = await JSZip.loadAsync(file);
    const entries = [];
    for (const [name, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        entries.push({
          name,
          path: name,
          size: zipEntry._data?.uncompressedSize || 0,
          compressedSize: zipEntry._data?.compressedSize || 0,
          category: getFileCategory(name),
          icon: getFileIcon(name),
          isDirectory: false,
          date: zipEntry.date,
        });
      } else {
        entries.push({ name, path: name, isDirectory: true, category: "folder", icon: "📁" });
      }
    }
    return { success: true, entries, totalFiles: entries.filter(e => !e.isDirectory).length, zip };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function extractTextFiles(zip, maxFiles = 20, maxSizeKB = 50) {
  const textContent = [];
  const textCategories = new Set(["code", "web", "data", "docs", "config"]);
  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const category = getFileCategory(name);
    if (!textCategories.has(category)) continue;
    if (textContent.length >= maxFiles) break;
    try {
      const text = await zipEntry.async("string");
      if (text.length > maxSizeKB * 1024) continue;
      textContent.push({ name, path: name, category, content: text, size: text.length, lines: text.split("\n").length });
    } catch {}
  }
  return textContent;
}

export function analyzeZipStructure(entries) {
  const files = entries.filter(e => !e.isDirectory);
  const dirs = entries.filter(e => e.isDirectory);
  const byCategory = {};
  for (const file of files) {
    if (!byCategory[file.category]) byCategory[file.category] = [];
    byCategory[file.category].push(file);
  }
  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
  const largestFiles = [...files].sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 5);
  return {
    totalFiles: files.length,
    totalDirs: dirs.length,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(1),
    byCategory,
    largestFiles,
    categoryCount: Object.keys(byCategory).length,
    fileTypes: [...new Set(files.map(f => f.name.split(".").pop()?.toLowerCase()).filter(Boolean))],
    hasPackageJson: files.some(f => f.name.endsWith("package.json")),
    hasRequirements: files.some(f => f.name === "requirements.txt"),
    hasReadme: files.some(f => f.name.toLowerCase().startsWith("readme")),
    hasDockerfile: files.some(f => f.name === "Dockerfile"),
    hasGitIgnore: files.some(f => f.name === ".gitignore"),
    isNodeProject: files.some(f => f.name === "package.json"),
    isPythonProject: files.some(f => f.name === "requirements.txt" || f.name === "setup.py"),
    isWebProject: Object.keys(byCategory).some(c => ["web", "code"].includes(c)),
  };
}

export function detectProjectType(structure) {
  if (structure.hasPackageJson) return "Node.js / JavaScript project";
  if (structure.isPythonProject) return "Python project";
  if (structure.hasDockerfile) return "Dockerized application";
  if (structure.byCategory?.images?.length > 0 && structure.totalFiles < 10) return "Image collection";
  if (structure.byCategory?.data?.length > 0) return "Data/Dataset package";
  if (structure.byCategory?.docs?.length > 0) return "Documentation package";
  if (structure.isWebProject) return "Web application";
  return "Mixed archive";
}
