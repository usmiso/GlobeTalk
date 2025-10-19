#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
let semver;
try {
  semver = require('semver');
} catch (e) {
  console.error('Missing dependency: semver. Install it with: npm i -D semver');
  process.exit(2);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadSpecs(arg) {
  if (!arg) return [];
  if (arg.endsWith('.json')) return readJson(arg);
  return arg.split(',').map(s => {
    const at = s.lastIndexOf('@');
    if (at > 0) return { name: s.slice(0, at), range: s.slice(at + 1) };
    return { name: s, range: '*' };
  });
}

function collectInstalledFromLock(lock) {
  const map = new Map();
  const entries = [];

  if (lock.packages) {
    for (const [pkgPath, info] of Object.entries(lock.packages)) {
      if (!info || !info.version) continue;
      if (!pkgPath || !pkgPath.startsWith('node_modules/')) continue;
      const name = pkgPath.replace(/^node_modules\//, '').split('node_modules/').pop();
      const version = info.version;
      entries.push({ name, version, from: pkgPath });
      if (!map.has(name)) map.set(name, new Set());
      map.get(name).add(version);
    }
  } else if (lock.dependencies) {
    function walk(depTree, parents = []) {
      for (const [name, info] of Object.entries(depTree)) {
        if (!info || !info.version) continue;
        const version = info.version;
        entries.push({ name, version, from: [...parents, name].join(' > ') });
        if (!map.has(name)) map.set(name, new Set());
        map.get(name).add(version);
        if (info.dependencies) walk(info.dependencies, [...parents, name]);
      }
    }
    walk(lock.dependencies);
  }

  return { entries, map };
}

function classifyDirectness(pkgJson, name) {
  const direct =
    (pkgJson.dependencies && Object.prototype.hasOwnProperty.call(pkgJson.dependencies, name)) ||
    (pkgJson.devDependencies && Object.prototype.hasOwnProperty.call(pkgJson.devDependencies, name)) ||
    (pkgJson.optionalDependencies && Object.prototype.hasOwnProperty.call(pkgJson.optionalDependencies, name)) ||
    (pkgJson.peerDependencies && Object.prototype.hasOwnProperty.call(pkgJson.peerDependencies, name));
  return direct ? 'direct' : 'transitive';
}

function generateReport({ pkgJson, specs, hits, outputPath }) {
  const lines = [];
  const now = new Date().toISOString();

  lines.push('# Supply Chain Audit Report');
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push('');
  lines.push('## Input (Compromised Packages)');
  specs.forEach(s => lines.push(`- ${s.name} (${s.range || '*'})`));
  if (!specs.length) lines.push('- (none provided)');
  lines.push('');

  lines.push('## Findings');
  if (!hits.length) {
    lines.push('- No matches found in installed dependency graph.');
  } else {
    for (const h of hits) {
      lines.push(`- ${h.name}@${h.version} — ${h.directness} dependency`);
      if (h.instances && h.instances.length) {
        h.instances.slice(0, 10).forEach(inst => lines.push(`  - via: ${inst.from}`));
        if (h.instances.length > 10) {
          lines.push(`  - ...and ${h.instances.length - 10} more instances`);
        }
      }
    }
  }
  lines.push('');

  lines.push('## Recommendations');
  if (hits.length) {
    lines.push('- Update to a safe version or replace the package.');
    lines.push('- If transitive, use "overrides" in package.json to pin safe versions.');
    lines.push('- Run: npm dedupe && npm install && npm audit');
    lines.push('- In CI, run with lifecycle scripts disabled: npm ci --ignore-scripts');
  } else {
    lines.push('- Keep dependencies pinned and lockfile committed.');
    lines.push('- Enable CI guardrails (see Measures below).');
  }
  lines.push('');

  lines.push('## Measures to avoid infection from upstream packages');
  lines.push('- Pin exact versions; commit package-lock.json; use "npm ci".');
  lines.push('- Enforce provenance/sig verification for npm publishes.');
  lines.push('- Disable lifecycle scripts in CI: npm ci --ignore-scripts.');
  lines.push('- Restrict registry to https://registry.npmjs.org/.');
  lines.push('- Enable Dependabot/Snyk/Socket alerts.');
  lines.push('- Use "overrides" to force safe transitive versions.');
  lines.push('');

  lines.push('## Measures to avoid infection from source');
  lines.push('- Code review and least-privilege on repo/CI tokens.');
  lines.push('- Secret scanning and pre-commit hooks.');
  lines.push('- Run dep scans on each PR.');
  lines.push('- Sandbox builds; avoid prod secrets on dev machines.');
  lines.push('- Verify integrity fields in lockfile.');
  lines.push('');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join(os.EOL), 'utf8');
  return outputPath;
}

async function main() {
  const root = process.cwd();
  const pkgJsonPath = path.join(root, 'package.json');
  const lockPath = path.join(root, 'package-lock.json');

  if (!fs.existsSync(pkgJsonPath) || !fs.existsSync(lockPath)) {
    console.error('Missing package.json or package-lock.json in current directory.');
    process.exit(2);
  }

  const pkgJson = readJson(pkgJsonPath);
  const lock = readJson(lockPath);

  const arg = process.argv[2] || path.join(root, 'security', 'compromised.json');
  const specs = loadSpecs(arg);

  const { entries, map } = collectInstalledFromLock(lock);

  const hitList = [];
  for (const spec of specs) {
    const installedVersions = map.get(spec.name);
    if (!installedVersions) continue;
    const instances = entries.filter(e => e.name === spec.name);
    const matches = [];
    for (const v of installedVersions) {
      const coerced = semver.coerce(v) || v;
      const ok = spec.range && spec.range !== '*'
        ? semver.satisfies(coerced, spec.range, { includePrerelease: true, loose: true })
        : true;
      if (ok) matches.push(v);
    }
    if (matches.length) {
      const directness = classifyDirectness(pkgJson, spec.name);
      hitList.push({ name: spec.name, version: [...new Set(matches)].join(', '), directness, instances });
    }
  }

  const outDir = path.join(root, 'security');
  const p = generateReport({ pkgJson, specs, hits: hitList, outputPath: path.join(outDir, 'compromised-report.md') });
  console.log(`Report written to: ${p}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
