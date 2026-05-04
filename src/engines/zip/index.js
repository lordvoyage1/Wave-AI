/**
 * Wave AI — ZIP Analysis Engine Index
 */
export * from "./core.js";
export * from "./aiAnalyzer.js";

export async function analyzeZip(file, options = {}) {
  const { readZipFile, analyzeZipStructure, detectProjectType, extractTextFiles } = await import("./core.js");
  const { generateZipSummary, extractDependencies, calculateCodeMetrics } = await import("./aiAnalyzer.js");
  const zipResult = await readZipFile(file);
  if (!zipResult.success) return { error: zipResult.error, entries: [], structure: null };
  const structure = analyzeZipStructure(zipResult.entries);
  const projectType = detectProjectType(structure);
  let textFiles = [];
  if (zipResult.zip) {
    textFiles = await extractTextFiles(zipResult.zip, 20, 50);
  }
  const summary = options.generateSummary !== false ? await generateZipSummary(structure, projectType) : { success: false, summary: "" };
  const deps = extractDependencies(textFiles);
  const metrics = calculateCodeMetrics(textFiles);
  return {
    success: true,
    file: { name: file.name, size: file.size, type: file.type },
    entries: zipResult.entries,
    structure,
    projectType,
    textFiles,
    deps,
    metrics,
    aiSummary: summary.summary,
  };
}
