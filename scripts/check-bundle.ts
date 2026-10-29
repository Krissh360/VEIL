import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import {
  checkManifest,
  hasModuleSyntax,
  scanSource,
  type Finding,
  type ManifestLike,
} from './lib/bundle-rules.ts';

const DIST = 'dist';
const SCANNED = new Set(['.js', '.mjs', '.html', '.css', '.json']);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

if (!existsSync(DIST)) {
  process.stderr.write('dist/ does not exist. Run npm run build first.\n');
  process.exit(1);
}

const findings: Finding[] = [];
const problems: string[] = [];
let scanned = 0;

for (const path of files(DIST)) {
  const name = relative(DIST, path).replaceAll('\\', '/');
  // Font license texts are documentation and contain URLs.
  if (name.startsWith('licenses/') || name === 'manifest.json' || !SCANNED.has(extname(path))) {
    continue;
  }
  const text = readFileSync(path, 'utf8');
  scanned += 1;
  findings.push(...scanSource(name, text));
  if (name === 'content.js' && hasModuleSyntax(text)) {
    problems.push('content.js contains module syntax; it is injected as a classic script');
  }
}

const manifestPath = join(DIST, 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestLike;
  problems.push(...checkManifest(manifest));
  // Host patterns are permissions, not requests. Everything else in the manifest is scanned.
  const rest = { ...manifest };
  delete rest.optional_host_permissions;
  findings.push(...scanSource('manifest.json', JSON.stringify(rest)));
} else {
  problems.push('dist/manifest.json is missing');
}

for (const f of findings) process.stdout.write(`FAIL  ${f.file}: ${f.rule}: ${f.match}\n`);
for (const p of problems) process.stdout.write(`FAIL  ${p}\n`);
const failed = findings.length + problems.length;
process.stdout.write(
  failed === 0
    ? `Bundle check passed (${scanned} files scanned).\n`
    : `Bundle check failed: ${failed} problem(s).\n`,
);
process.exit(failed === 0 ? 0 : 1);
