/**
 * Wave AI — ZIP Analysis — CSV/Data Analyzer
 */
export function analyzeCSV(content, filename) {
  const lines = content.trim().split("\n").filter(Boolean);
  if (!lines.length) return { success: false, error: "Empty CSV" };
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter);
  const rows = lines.slice(1).map(l => parseCSVLine(l, delimiter));
  const stats = headers.map((h, i) => {
    const values = rows.map(r => r[i] || "").filter(Boolean);
    const nums = values.map(Number).filter(v => !isNaN(v));
    return { column: h, count: values.length, empty: rows.length - values.length, unique: new Set(values).size, isNumeric: nums.length === values.length, min: nums.length ? Math.min(...nums) : null, max: nums.length ? Math.max(...nums) : null, avg: nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null };
  });
  return { success: true, filename, rows: rows.length, columns: headers.length, headers, sampleRows: rows.slice(0, 5), stats, delimiter: delimiter === "," ? "comma" : delimiter === "\t" ? "tab" : "semicolon" };
}
function detectDelimiter(line) { const counts = { ",": (line.match(/,/g) || []).length, "\t": (line.match(/\t/g) || []).length, ";": (line.match(/;/g) || []).length }; return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]; }
function parseCSVLine(line, delimiter) {
  const result = []; let current = ""; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += line[i]; }
  }
  result.push(current.trim()); return result;
}
export function detectDataTypes(sample) {
  const patterns = { number: /^\d+\.?\d*$/, date: /^\d{4}-\d{2}-\d{2}/, email: /^[^@]+@[^@]+\.[^@]+$/, url: /^https?:\/\//, boolean: /^(true|false|yes|no|1|0)$/i };
  for (const [type, pattern] of Object.entries(patterns)) { if (pattern.test(sample)) return type; }
  return "string";
}
export function generateCSVSummary(analysis) {
  return `**${analysis.filename}** — ${analysis.rows} rows × ${analysis.columns} columns\n\nColumns: ${analysis.headers.join(", ")}\n\nSample data:\n| ${analysis.headers.join(" | ")} |\n|${analysis.headers.map(() => "---").join("|")}|\n${analysis.sampleRows.slice(0, 3).map(r => `| ${r.join(" | ")} |`).join("\n")}`;
}
