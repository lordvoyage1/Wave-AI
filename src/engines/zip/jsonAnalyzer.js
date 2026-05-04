/**
 * Wave AI — ZIP Analysis — JSON Analyzer
 */
export function analyzeJSON(content, filename) {
  try {
    const data = JSON.parse(content);
    const type = getJSONType(data, filename);
    const stats = getJSONStats(data);
    return { success: true, type, stats, data: typeof data === "object" ? data : null, keys: typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : null };
  } catch (err) { return { success: false, error: err.message, tip: "Invalid JSON — check for trailing commas, missing quotes, or syntax errors" }; }
}
function getJSONType(data, filename) {
  if (filename === "package.json") return "NPM Package Manifest";
  if (filename === "tsconfig.json") return "TypeScript Config";
  if (filename === ".eslintrc.json" || filename === ".eslintrc") return "ESLint Config";
  if (Array.isArray(data)) return `JSON Array (${data.length} items)`;
  if (typeof data === "object" && data !== null) {
    if (data.name && data.version) return "Package/Project Manifest";
    if (data.compilerOptions) return "TypeScript Config";
    if (data.rules || data.extends) return "Linting Config";
    return `JSON Object (${Object.keys(data).length} keys)`;
  }
  return "JSON Primitive";
}
function getJSONStats(data) {
  const str = JSON.stringify(data);
  const depth = getMaxDepth(data);
  return { size: str.length, depth, type: Array.isArray(data) ? "array" : typeof data, keys: typeof data === "object" ? Object.keys(data || {}).length : 0 };
}
function getMaxDepth(obj, depth = 0) {
  if (typeof obj !== "object" || obj === null) return depth;
  return Math.max(...Object.values(obj).map(v => getMaxDepth(v, depth + 1)));
}
export function prettyPrintJSON(data, indent = 2) { return JSON.stringify(data, null, indent); }
export function flattenJSON(obj, prefix = "", result = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) flattenJSON(v, key, result);
    else result[key] = v;
  }
  return result;
}
export function findJSONPath(data, targetKey) {
  const paths = [];
  const search = (obj, path) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (k === targetKey) paths.push(`${path}.${k}`.replace(/^\./, ""));
      if (typeof v === "object") search(v, `${path}.${k}`);
    }
  };
  search(data, ""); return paths;
}
