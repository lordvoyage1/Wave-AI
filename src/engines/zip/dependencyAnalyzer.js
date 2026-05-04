/**
 * Wave AI — ZIP Analysis — Dependency Analyzer
 */
export function analyzeDependencies(textFiles) {
  const pkgJson = textFiles.find(f => f.name === "package.json");
  const reqTxt = textFiles.find(f => f.name === "requirements.txt");
  const pyprojectToml = textFiles.find(f => f.name === "pyproject.toml");
  const result = { type: null, runtime: [], dev: [], peer: [], optional: [], total: 0 };
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson.content);
      result.type = "npm"; result.packageName = pkg.name; result.version = pkg.version; result.description = pkg.description;
      result.runtime = Object.entries(pkg.dependencies || {}).map(([name, ver]) => ({ name, version: ver }));
      result.dev = Object.entries(pkg.devDependencies || {}).map(([name, ver]) => ({ name, version: ver }));
      result.peer = Object.entries(pkg.peerDependencies || {}).map(([name, ver]) => ({ name, version: ver }));
      result.scripts = Object.keys(pkg.scripts || {});
      result.engines = pkg.engines;
    } catch {}
  } else if (reqTxt) {
    result.type = "pip";
    const lines = reqTxt.content.split("\n").filter(l => l.trim() && !l.startsWith("#"));
    result.runtime = lines.map(l => { const [name, ver] = l.split("=="); return { name: name.trim(), version: ver?.trim() || "*" }; });
  }
  result.total = result.runtime.length + result.dev.length;
  return result;
}

export function checkOutdatedPackages(dependencies) {
  const commonLatest = { "react": "18", "vue": "3", "angular": "17", "express": "4", "typescript": "5", "webpack": "5", "vite": "5", "tailwindcss": "3", "next": "14", "nuxt": "3" };
  const potentially_outdated = [];
  for (const dep of dependencies) {
    const name = dep.name.replace(/@[^/]+\//, "");
    const latestMajor = commonLatest[name];
    if (latestMajor) {
      const currentMajor = dep.version?.match(/\d+/)?.[0];
      if (currentMajor && parseInt(currentMajor) < parseInt(latestMajor)) {
        potentially_outdated.push({ name: dep.name, current: dep.version, latestMajor: `^${latestMajor}.0.0`, note: "May have newer major version" });
      }
    }
  }
  return potentially_outdated;
}

export function categorizeDependencies(deps) {
  const ui = deps.filter(d => /react|vue|angular|svelte|bootstrap|tailwind|material|chakra|ant-design|radix/.test(d.name));
  const testing = deps.filter(d => /jest|vitest|mocha|chai|cypress|playwright|testing-library/.test(d.name));
  const build = deps.filter(d => /webpack|vite|rollup|esbuild|babel|typescript|eslint|prettier/.test(d.name));
  const database = deps.filter(d => /prisma|mongoose|sequelize|typeorm|drizzle|pg|mysql|sqlite|redis/.test(d.name));
  const auth = deps.filter(d => /auth|passport|jwt|oauth|session|bcrypt/.test(d.name));
  return { ui, testing, build, database, auth };
}
