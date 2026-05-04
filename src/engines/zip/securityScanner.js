/**
 * Wave AI — ZIP Analysis — Security Scanner
 */
export const SECURITY_PATTERNS = [
  { id: "HARDCODED_SECRET", pattern: /(?:api_key|apikey|secret|password|passwd|token|auth)\s*[=:]\s*["'][A-Za-z0-9_\-]{8,}/gi, severity: "critical", description: "Possible hardcoded secret or API key" },
  { id: "SQL_INJECTION", pattern: /\b(SELECT|INSERT|UPDATE|DELETE)\b.*\+.*\bvar\b|\bexec\b.*\binput\b/gi, severity: "high", description: "Possible SQL injection vulnerability" },
  { id: "EVAL_USAGE", pattern: /\beval\s*\(/g, severity: "high", description: "eval() usage is a security risk" },
  { id: "CONSOLE_LOG_SECRET", pattern: /console\.log\s*\([^)]*(?:token|secret|password|key)[^)]*\)/gi, severity: "medium", description: "Sensitive data in console.log" },
  { id: "DANGEROUSLYSETINNERHTML", pattern: /dangerouslySetInnerHTML/g, severity: "medium", description: "React dangerouslySetInnerHTML — XSS risk" },
  { id: "WEAK_CRYPTO", pattern: /\b(md5|sha1)\b/gi, severity: "medium", description: "Weak cryptographic algorithm" },
  { id: "HTTP_NOT_HTTPS", pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g, severity: "low", description: "HTTP instead of HTTPS" },
  { id: "TODO_SECURITY", pattern: /\/\/\s*(TODO|FIXME).*(?:security|auth|password|token)/gi, severity: "low", description: "Security-related TODO comment" },
];

export function scanForVulnerabilities(textFiles) {
  const findings = [];
  for (const file of textFiles) {
    for (const rule of SECURITY_PATTERNS) {
      const matches = [...file.content.matchAll(rule.pattern)];
      for (const match of matches) {
        const lineNum = file.content.slice(0, match.index).split("\n").length;
        findings.push({ file: file.name, line: lineNum, rule: rule.id, severity: rule.severity, description: rule.description, snippet: match[0].slice(0, 80), path: file.path });
      }
    }
  }
  return findings.sort((a, b) => { const order = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity] || 4) - (order[b.severity] || 4); });
}

export function generateSecurityReport(findings) {
  if (!findings.length) return "✅ No obvious security issues detected. Manual review still recommended.";
  const bySeverity = { critical: [], high: [], medium: [], low: [] };
  findings.forEach(f => (bySeverity[f.severity] = bySeverity[f.severity] || []).push(f));
  let report = "## Security Scan Report\n\n";
  for (const [severity, items] of Object.entries(bySeverity)) {
    if (!items.length) continue;
    const emoji = { critical: "🚨", high: "❗", medium: "⚠️", low: "ℹ️" }[severity] || "•";
    report += `### ${emoji} ${severity.toUpperCase()} (${items.length})\n`;
    items.slice(0, 5).forEach(i => { report += `- **${i.rule}** in \`${i.file}\` (line ${i.line})\n  ${i.description}\n`; });
  }
  return report;
}
