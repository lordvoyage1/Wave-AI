/**
 * Wave AI — ZIP Analysis — AI Analyzer
 * Uses Wave AI to analyze ZIP contents, explain code,
 * generate summaries, and answer questions about archives.
 */

import { sendChatMessage } from "@/lib/aiService";
import { analyzeZipStructure, detectProjectType, extractTextFiles } from "./core.js";

export async function generateZipSummary(structure, projectType) {
  const prompt = `Analyze this ZIP archive structure and provide a concise summary:

**Project Type**: ${projectType}
**Total Files**: ${structure.totalFiles}
**Total Size**: ${structure.totalSizeKB} KB
**File Categories**: ${JSON.stringify(Object.fromEntries(Object.entries(structure.byCategory).map(([k, v]) => [k, v.length])))}
**Has README**: ${structure.hasReadme}
**Has Package.json**: ${structure.hasPackageJson}
**Has Requirements.txt**: ${structure.hasRequirements}
**File Types Found**: ${structure.fileTypes.slice(0, 20).join(", ")}

Provide:
1. What this archive likely contains
2. Its purpose/use case
3. Key observations
4. Recommended next steps

Keep it concise and practical.`;

  try {
    const response = await sendChatMessage(prompt);
    return { success: true, summary: response };
  } catch (err) {
    return { success: false, summary: generateLocalSummary(structure, projectType) };
  }
}

export function generateLocalSummary(structure, projectType) {
  const { totalFiles, totalSizeKB, byCategory, hasReadme, hasPackageJson, hasRequirements, fileTypes } = structure;
  let summary = `## ZIP Archive Analysis\n\n`;
  summary += `**Type**: ${projectType}\n`;
  summary += `**Files**: ${totalFiles} files, ${totalSizeKB} KB total\n\n`;
  summary += `### File Breakdown\n`;
  for (const [cat, files] of Object.entries(byCategory)) {
    summary += `- **${cat}**: ${files.length} file${files.length !== 1 ? "s" : ""}\n`;
  }
  summary += "\n### Key Findings\n";
  if (hasReadme) summary += "- ✅ README file found — documentation included\n";
  if (hasPackageJson) summary += "- ✅ package.json found — Node.js/npm project\n";
  if (hasRequirements) summary += "- ✅ requirements.txt — Python project dependencies\n";
  if (structure.hasDockerfile) summary += "- 🐳 Dockerfile found — containerized setup\n";
  summary += `\n### File Types\n\`${fileTypes.slice(0, 15).join(", ")}\`\n`;
  return summary;
}

export async function analyzeCodeFile(filename, content, question = null) {
  const prompt = question
    ? `Analyze this ${filename} file and answer: "${question}"\n\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``
    : `Analyze this ${filename} file. Explain what it does, key patterns, potential issues, and suggestions:\n\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``;
  try {
    const response = await sendChatMessage(prompt);
    return { success: true, analysis: response, filename };
  } catch {
    return { success: false, analysis: `Could not analyze ${filename} automatically.`, filename };
  }
}

export async function findBugsInCode(content, language = "javascript") {
  const prompt = `Review this ${language} code for bugs, security issues, and improvements:\n\n\`\`\`${language}\n${content.slice(0, 4000)}\n\`\`\`\n\nList any issues found with severity levels.`;
  try {
    const response = await sendChatMessage(prompt);
    return { success: true, review: response };
  } catch {
    return { success: false, review: "Could not perform automated code review." };
  }
}

export async function generateProjectReadme(structure, textFiles = []) {
  const codeFiles = textFiles.filter(f => f.category === "code").slice(0, 3);
  const prompt = `Generate a professional README.md for this project:

**Project Type**: ${detectProjectType(structure)}
**Files**: ${structure.totalFiles} files
**Technologies**: ${structure.fileTypes.join(", ")}
**Has existing README**: ${structure.hasReadme}
**Key files**: ${codeFiles.map(f => f.name).join(", ")}

${codeFiles[0] ? `**Main file sample**:\n\`\`\`\n${codeFiles[0].content.slice(0, 500)}\n\`\`\`` : ""}

Create a complete README with: title, description, features, installation, usage, and contributing sections.`;

  try {
    const response = await sendChatMessage(prompt);
    return { success: true, readme: response };
  } catch {
    return { success: false, readme: "# Project README\n\nCould not generate README automatically." };
  }
}

export async function askAboutArchive(question, structure, textFiles = []) {
  const contextSummary = generateLocalSummary(structure, detectProjectType(structure));
  const relevantFiles = textFiles.filter(f => {
    const qLower = question.toLowerCase();
    return f.name.toLowerCase().includes(qLower.split(" ")[0]) || f.category === "code";
  }).slice(0, 3);
  const prompt = `Given this ZIP archive, answer: "${question}"\n\n${contextSummary}\n\n${relevantFiles.map(f => `**${f.name}**:\n\`\`\`\n${f.content.slice(0, 800)}\n\`\`\``).join("\n\n")}`;
  try {
    const response = await sendChatMessage(prompt);
    return { success: true, answer: response };
  } catch {
    return { success: false, answer: "Could not answer that question about the archive." };
  }
}

export function extractDependencies(textFiles) {
  const deps = { npm: [], python: [], other: [] };
  const pkgJson = textFiles.find(f => f.name === "package.json");
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson.content);
      deps.npm = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    } catch {}
  }
  const reqTxt = textFiles.find(f => f.name === "requirements.txt");
  if (reqTxt) {
    deps.python = reqTxt.content.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("==")[0].trim());
  }
  return deps;
}

export function calculateCodeMetrics(textFiles) {
  const codeFiles = textFiles.filter(f => f.category === "code");
  const totalLines = codeFiles.reduce((s, f) => s + f.lines, 0);
  const totalChars = codeFiles.reduce((s, f) => s + f.size, 0);
  const avgComplexity = codeFiles.map(f => {
    const content = f.content;
    const ifCount = (content.match(/\bif\b/g) || []).length;
    const loopCount = (content.match(/\bfor\b|\bwhile\b/g) || []).length;
    const funcCount = (content.match(/\bfunction\b|\bdef\b|\b=>\b/g) || []).length;
    return { name: f.name, complexity: ifCount + loopCount * 1.5, functions: funcCount, lines: f.lines };
  });
  return {
    totalFiles: codeFiles.length,
    totalLines,
    totalChars,
    avgLines: codeFiles.length > 0 ? Math.round(totalLines / codeFiles.length) : 0,
    fileMetrics: avgComplexity,
    mostComplex: avgComplexity.sort((a, b) => b.complexity - a.complexity)[0],
  };
}
