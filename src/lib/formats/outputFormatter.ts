/* ═══════════════════════════════════════════════════════════════
   Wave AI — Output Formatter
   Formats AI responses for different output types and contexts.
   Handles markdown, code, tables, citations, and rich content.
═══════════════════════════════════════════════════════════════ */

export type OutputFormat = "markdown" | "plain" | "html" | "json" | "code" | "structured";

export interface FormattedOutput {
  format: OutputFormat;
  content: string;
  sections: OutputSection[];
  hasCode: boolean;
  hasTable: boolean;
  hasList: boolean;
  wordCount: number;
  readingTimeMin: number;
}

export interface OutputSection {
  type: "heading" | "paragraph" | "code" | "list" | "table" | "blockquote" | "hr" | "image";
  level?: number;
  content: string;
  language?: string;
  items?: string[];
  rows?: string[][];
  headers?: string[];
}

/* ── Parse markdown into sections ────────────────────────────── */
export function parseMarkdown(text: string): OutputSection[] {
  const lines = text.split("\n");
  const sections: OutputSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      sections.push({ type: "code", content: codeLines.join("\n"), language: lang });
      i++;
      continue;
    }

    if (line.startsWith("### ")) { sections.push({ type: "heading", level: 3, content: line.slice(4) }); i++; continue; }
    if (line.startsWith("## ")) { sections.push({ type: "heading", level: 2, content: line.slice(3) }); i++; continue; }
    if (line.startsWith("# ")) { sections.push({ type: "heading", level: 1, content: line.slice(2) }); i++; continue; }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      sections.push({ type: "list", content: items.join("\n"), items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      sections.push({ type: "list", content: items.join("\n"), items });
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      const rows: string[][] = [];
      i++;
      if (i < lines.length && /^[|\s-:]+$/.test(lines[i])) i++;
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()));
        i++;
      }
      sections.push({ type: "table", content: line, headers, rows });
      continue;
    }

    if (line.startsWith("> ")) {
      sections.push({ type: "blockquote", content: line.slice(2) });
      i++;
      continue;
    }

    if (line === "---" || line === "***" || line === "___") {
      sections.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    if (line.trim()) {
      sections.push({ type: "paragraph", content: line });
    }

    i++;
  }

  return sections;
}

/* ── Format output ───────────────────────────────────────────── */
export function formatOutput(text: string, format: OutputFormat = "markdown"): FormattedOutput {
  const sections = parseMarkdown(text);
  const hasCode = sections.some(s => s.type === "code");
  const hasTable = sections.some(s => s.type === "table");
  const hasList = sections.some(s => s.type === "list");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  let content = text;

  if (format === "plain") {
    content = sections.map(s => {
      switch (s.type) {
        case "code": return `\n${s.content}\n`;
        case "list": return s.items?.map(item => `• ${item}`).join("\n") ?? s.content;
        default: return s.content;
      }
    }).join("\n\n");
  } else if (format === "html") {
    content = sections.map(s => {
      switch (s.type) {
        case "heading": return `<h${s.level}>${escapeHtml(s.content)}</h${s.level}>`;
        case "paragraph": return `<p>${escapeHtml(s.content)}</p>`;
        case "code": return `<pre><code class="language-${s.language}">${escapeHtml(s.content)}</code></pre>`;
        case "list": return `<ul>${s.items?.map(i => `<li>${escapeHtml(i)}</li>`).join("") ?? ""}</ul>`;
        case "blockquote": return `<blockquote>${escapeHtml(s.content)}</blockquote>`;
        case "hr": return "<hr>";
        case "table": return formatTableHtml(s);
        default: return `<p>${escapeHtml(s.content)}</p>`;
      }
    }).join("\n");
  }

  return { format, content, sections, hasCode, hasTable, hasList, wordCount, readingTimeMin };
}

function formatTableHtml(section: OutputSection): string {
  const headers = section.headers?.map(h => `<th>${escapeHtml(h)}</th>`).join("") ?? "";
  const rows = section.rows?.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("") ?? "";
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── Code formatter ──────────────────────────────────────────── */
export function formatCodeResponse(code: string, language: string): string {
  const clean = code.trim();
  if (clean.startsWith("```")) return clean;
  return `\`\`\`${language}\n${clean}\n\`\`\``;
}

/* ── Citation formatter ──────────────────────────────────────── */
export function addCitations(text: string, sources: Array<{ title: string; url?: string }>): string {
  if (sources.length === 0) return text;
  const citations = sources.map((s, i) =>
    s.url ? `[${i + 1}] [${s.title}](${s.url})` : `[${i + 1}] ${s.title}`
  ).join("\n");
  return `${text}\n\n---\n**Sources:**\n${citations}`;
}

/* ── Truncate for display ────────────────────────────────────── */
export function truncateForDisplay(text: string, maxLength = 8192): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastNewline = truncated.lastIndexOf("\n");
  return (lastNewline > maxLength * 0.8 ? truncated.slice(0, lastNewline) : truncated) + "\n\n_[Response truncated]_";
}
