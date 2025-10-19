#!/usr/bin/env python3
import argparse
import json
import os
from datetime import datetime


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


essential_dep_keys = [
    'dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'
]


def classify_directness(pkg_json, name):
    for key in essential_dep_keys:
        deps = pkg_json.get(key, {})
        if name in deps:
            return 'direct'
    return 'transitive'


def collect_from_lock(lock):
    entries = []
    if isinstance(lock, dict) and 'packages' in lock:  # npm lockfile v2+
        for pkg_path, info in lock.get('packages', {}).items():
            if not info or not isinstance(info, dict):
                continue
            version = info.get('version')
            if not version:
                continue
            if not pkg_path or not pkg_path.startswith('node_modules/'):
                continue
            # normalize name for nested node_modules paths
            name = pkg_path.replace('node_modules/', '').split('node_modules/')[-1]
            entries.append({'name': name, 'version': version, 'from': pkg_path})
    elif isinstance(lock, dict) and 'dependencies' in lock:  # npm lockfile v1
        def walk(dep_tree, parents=None):
            parents = parents or []
            for name, info in dep_tree.items():
                if not info or not isinstance(info, dict):
                    continue
                version = info.get('version')
                if version:
                    entries.append({'name': name, 'version': version, 'from': ' > '.join(parents + [name])})
                if 'dependencies' in info:
                    walk(info['dependencies'], parents + [name])
        walk(lock['dependencies'])
    return entries


def version_matches(version: str, rng: str | None) -> bool:
    """Simple matcher for the ranges used in security/compromised.json.
    Supports:
      - exact version: "1.2.3" or "=1.2.3"
      - OR lists with "||" (e.g., "=4.1.1 || =4.1.2")
      - wildcard "*" or missing range => match any installed version
    """
    if not rng or rng.strip() == '*' or rng.strip() == '':
        return True
    parts = [p.strip() for p in rng.split('||')]
    for part in parts:
        if part.startswith('='):
            target = part[1:].strip()
        else:
            target = part
        if version == target:
            return True
    return False


def scan(root_dir: str, compromised_path: str) -> dict:
    pkg_json_path = os.path.join(root_dir, 'package.json')
    lock_path = os.path.join(root_dir, 'package-lock.json')
    if not (os.path.exists(pkg_json_path) and os.path.exists(lock_path)):
        raise SystemExit('Missing package.json or package-lock.json in ' + root_dir)

    pkg_json = load_json(pkg_json_path)
    lock = load_json(lock_path)
    specs = load_json(compromised_path)

    entries = collect_from_lock(lock)
    # name -> [instances]
    from collections import defaultdict
    instances_by_name = defaultdict(list)
    versions_by_name = defaultdict(set)
    for e in entries:
        instances_by_name[e['name']].append(e)
        versions_by_name[e['name']].add(e['version'])

    hits = []
    for spec in specs:
        name = spec.get('name')
        rng = spec.get('range')
        if not name:
            continue
        installed = versions_by_name.get(name)
        if not installed:
            continue
        matched_versions = sorted({v for v in installed if version_matches(v, rng)})
        if matched_versions:
            directness = classify_directness(pkg_json, name)
            hits.append({
                'name': name,
                'versions': matched_versions,
                'directness': directness,
                'instances': instances_by_name.get(name, [])
            })

    return {
        'root': root_dir,
        'specs': specs,
        'hits': hits,
    }


def write_report(root_dir: str, result: dict, out_rel: str = os.path.join('security', 'compromised-report-python.md')) -> str:
    out_path = os.path.join(root_dir, out_rel)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    lines = []
    lines.append('# Supply Chain Audit Report (Python)')
    lines.append('')
    lines.append(f'Generated: {datetime.utcnow().isoformat()}Z')
    lines.append('')
    lines.append('## Input (Compromised Packages)')
    for s in result['specs']:
        nm = s.get('name', '')
        rng = s.get('range', '*')
        lines.append(f'- {nm} ({rng})')
    lines.append('')

    lines.append('## Findings')
    if not result['hits']:
        lines.append('- No matches found in installed dependency graph.')
    else:
        for h in result['hits']:
            joined_versions = ', '.join(h['versions'])
            lines.append(f"- {h['name']}@{joined_versions} — {h['directness']} dependency")
            for inst in h['instances'][:10]:
                lines.append(f"  - via: {inst.get('from')}")
            extra = len(h['instances']) - 10
            if extra > 0:
                lines.append(f"  - ...and {extra} more instances")
    lines.append('')

    lines.append('## Recommendations')
    if result['hits']:
        lines.append('- Update to a safe version or replace the package.')
        lines.append('- If transitive, use "overrides" in package.json to pin safe versions.')
        lines.append('- Run: npm dedupe && npm install && npm audit')
        lines.append('- In CI, run with lifecycle scripts disabled: npm ci --ignore-scripts')
    else:
        lines.append('- Keep dependencies pinned and lockfile committed.')
        lines.append('- Enable CI guardrails (see Measures below).')
    lines.append('')

    lines.append('## Measures to avoid infection from upstream packages')
    lines.append('- Pin exact versions; commit package-lock.json; use "npm ci".')
    lines.append('- Enforce provenance/sig verification for npm publishes.')
    lines.append('- Disable lifecycle scripts in CI: npm ci --ignore-scripts.')
    lines.append('- Restrict registry to https://registry.npmjs.org/.')
    lines.append('- Enable Dependabot/Snyk/Socket alerts.')
    lines.append('- Use "overrides" to force safe transitive versions.')
    lines.append('')

    lines.append('## Measures to avoid infection from source')
    lines.append('- Code review and least-privilege on repo/CI tokens.')
    lines.append('- Secret scanning and pre-commit hooks.')
    lines.append('- Run dep scans on each PR.')
    lines.append('- Sandbox builds; avoid prod secrets on dev machines.')
    lines.append('- Verify integrity fields in lockfile.')

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    return out_path


def main():
    parser = argparse.ArgumentParser(description='Scan for compromised packages using package-lock.json')
    parser.add_argument('--root', default='.', help='Project root containing package.json and package-lock.json')
    parser.add_argument('--compromised', default=os.path.join('security', 'compromised.json'), help='Path to compromised.json list')
    parser.add_argument('--out', default=os.path.join('security', 'compromised-report-python.md'), help='Report output relative path under root')
    args = parser.parse_args()

    result = scan(args.root, args.compromised)
    path = write_report(args.root, result, args.out)
    print(f'Report written to: {path}')


if __name__ == '__main__':
    main()
