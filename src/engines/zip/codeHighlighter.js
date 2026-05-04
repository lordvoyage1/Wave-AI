/**
 * Wave AI — ZIP Analysis — Code Syntax Highlighter
 */
export const LANGUAGE_TOKENS = {
  javascript: { keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|try|catch|new|this|typeof|instanceof)\b/g, strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, comments: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, numbers: /\b\d+\.?\d*\b/g, functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g },
  python: { keywords: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|with|in|not|and|or|True|False|None|lambda|yield|pass|break|continue)\b/g, strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, comments: /(#[^\n]*)/g, numbers: /\b\d+\.?\d*\b/g },
  html: { tags: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g, attributes: /\s([a-zA-Z-]+)=/g, strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g },
  css: { properties: /([a-zA-Z-]+)\s*:/g, values: /:\s*([^;{}]+)/g, selectors: /([.#:*a-zA-Z][^{]*){/g },
};

export function highlightCode(code, language) {
  const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lang = LANGUAGE_TOKENS[language?.toLowerCase()];
  if (!lang) return `<pre><code>${escaped}</code></pre>`;
  let highlighted = escaped;
  highlighted = highlighted.replace(lang.comments || /$.^/g, m => `<span class="cmt">${m}</span>`);
  highlighted = highlighted.replace(lang.strings || /$.^/g, m => `<span class="str">${m}</span>`);
  highlighted = highlighted.replace(lang.keywords || /$.^/g, m => `<span class="kw">${m}</span>`);
  highlighted = highlighted.replace(lang.numbers || /$.^/g, m => `<span class="num">${m}</span>`);
  return `<pre class="code-block lang-${language}"><code>${highlighted}</code></pre>`;
}

export function getLanguageFromExtension(ext) {
  const map = { js: "javascript", ts: "javascript", jsx: "javascript", tsx: "javascript", py: "python", html: "html", htm: "html", css: "css", scss: "css", json: "json", md: "markdown", sh: "bash", bash: "bash", go: "go", rs: "rust", java: "java", cpp: "cpp", c: "c", rb: "ruby", php: "php", swift: "swift", kt: "kotlin", yaml: "yaml", yml: "yaml", sql: "sql", xml: "xml" };
  return map[ext?.toLowerCase()] || "text";
}

export function truncateCode(code, maxLines = 50) {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;
  return lines.slice(0, maxLines).join("\n") + `\n\n... (${lines.length - maxLines} more lines)`;
}
