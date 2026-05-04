/**
 * Wave AI — ZIP Analysis — README Parser
 */
export function parseReadme(content) {
  const sections = {}; let currentSection = "intro"; const lines = content.split("\n");
  lines.forEach(line => {
    const h = line.match(/^#{1,3}\s+(.+)/);
    if (h) { currentSection = h[1].toLowerCase().replace(/\s+/g, "_"); sections[currentSection] = ""; }
    else { sections[currentSection] = (sections[currentSection] || "") + line + "\n"; }
  });
  const title = lines.find(l => l.startsWith("# "))?.slice(2).trim();
  const description = sections["intro"]?.split("\n").filter(l => l.trim() && !l.startsWith("#"))[0]?.trim();
  const hasInstall = !!sections.installation || !!sections.install || content.toLowerCase().includes("npm install") || content.toLowerCase().includes("pip install");
  const hasUsage = !!sections.usage || !!sections.getting_started;
  const badges = [...content.matchAll(/!\[.*?\]\(https?:\/\/[^)]+\)/g)].map(m => m[0]);
  const links = [...content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(m => ({ text: m[1], url: m[2] }));
  const codeBlocks = [...content.matchAll(/```(\w+)?\n([\s\S]*?)```/g)].map(m => ({ language: m[1] || "text", code: m[2] }));
  return { title, description, sections: Object.keys(sections), hasInstall, hasUsage, badges: badges.slice(0, 10), links: links.slice(0, 20), codeBlocks: codeBlocks.slice(0, 5), wordCount: content.split(/\s+/).length, lineCount: lines.length };
}
export function extractInstallCommands(readmeContent) {
  const cmds = [];
  const patterns = [ /npm install[^\n]*/g, /yarn add[^\n]*/g, /pip install[^\n]*/g, /cargo add[^\n]*/g, /go get[^\n]*/g, /composer require[^\n]*/g ];
  patterns.forEach(p => { const matches = readmeContent.match(p) || []; cmds.push(...matches.map(m => m.trim())); });
  return [...new Set(cmds)];
}
export function extractTechStack(readmeContent) {
  const techs = [];
  const techPatterns = { react: /\breact\b/i, vue: /\bvue\b/i, angular: /\bangular\b/i, svelte: /\bsvelte\b/i, nextjs: /\bnext\.js\b|\bnextjs\b/i, nodejs: /\bnode\.?js\b/i, python: /\bpython\b/i, typescript: /\btypescript\b|\bts\b/i, docker: /\bdocker\b/i, kubernetes: /\bkubernetes\b|\bk8s\b/i, postgresql: /\bpostgresql\b|\bpostgres\b/i, mongodb: /\bmongodb\b/i };
  for (const [tech, pattern] of Object.entries(techPatterns)) { if (pattern.test(readmeContent)) techs.push(tech); }
  return techs;
}
