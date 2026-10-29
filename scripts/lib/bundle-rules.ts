export interface Finding {
  file: string;
  rule: string;
  match: string;
}

const RULES: { rule: string; pattern: RegExp }[] = [
  { rule: 'fetch', pattern: /\bfetch\b/g },
  { rule: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/g },
  { rule: 'WebSocket', pattern: /\bWebSocket\b/g },
  { rule: 'EventSource', pattern: /\bEventSource\b/g },
  { rule: 'sendBeacon', pattern: /\bsendBeacon\b/g },
  { rule: 'importScripts', pattern: /\bimportScripts\b/g },
  { rule: 'eval', pattern: /\beval\b/g },
  { rule: 'Function constructor', pattern: /\bnew\s+Function\b|(?<![.\w])Function\s*\(/g },
  { rule: 'remote URL', pattern: /\b(?:https?|wss?|ftp):\/\/[^\s"'`)<>]+/gi },
  { rule: 'protocol-relative URL', pattern: /["'`(]\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi },
];

// XML namespace identifiers look like URLs but are never requested.
const NAMESPACE =
  /^https?:\/\/www\.w3\.org\/(?:1999\/xhtml|2000\/svg|1999\/xlink|1998\/Math\/MathML)$/;

export function scanSource(file: string, text: string): Finding[] {
  const findings: Finding[] = [];
  for (const { rule, pattern } of RULES) {
    for (const match of text.matchAll(pattern)) {
      if (rule === 'remote URL' && NAMESPACE.test(match[0])) continue;
      findings.push({ file, rule, match: match[0] });
    }
  }
  return findings;
}

// Content scripts are injected as classic scripts, so any module syntax would break them.
export function hasModuleSyntax(text: string): boolean {
  return /(?:^|[;{}])\s*(?:import|export)\s*[{*\w"']|\bimport\s*\(/.test(text);
}

export const ALLOWED_PERMISSIONS = ['activeTab', 'scripting', 'storage'];
export const ALLOWED_OPTIONAL_HOSTS = ['http://*/*', 'https://*/*'];

export interface ManifestLike {
  permissions?: string[];
  optional_host_permissions?: string[];
  host_permissions?: string[];
  content_scripts?: unknown;
  content_security_policy?: { extension_pages?: string };
}

export function checkManifest(manifest: ManifestLike): string[] {
  const problems: string[] = [];
  const extra = (manifest.permissions ?? []).filter((p) => !ALLOWED_PERMISSIONS.includes(p));
  if (extra.length > 0) problems.push(`unexpected permissions: ${extra.join(', ')}`);
  const hosts = (manifest.optional_host_permissions ?? []).filter(
    (p) => !ALLOWED_OPTIONAL_HOSTS.includes(p),
  );
  if (hosts.length > 0) problems.push(`unexpected optional host permissions: ${hosts.join(', ')}`);
  if (manifest.host_permissions !== undefined) problems.push('host_permissions must not be set');
  if (manifest.content_scripts !== undefined) {
    problems.push('static content_scripts would need host permissions');
  }
  const csp = manifest.content_security_policy?.extension_pages;
  if (csp === undefined) {
    problems.push('extension_pages CSP is missing');
  } else {
    if (/unsafe-(?:eval|inline)|wasm-unsafe-eval/.test(csp))
      problems.push('CSP allows unsafe code');
    if (/https?:|\*/.test(csp)) problems.push('CSP names a remote source');
    if (!/default-src 'none'/.test(csp))
      problems.push("CSP does not start from default-src 'none'");
  }
  return problems;
}
