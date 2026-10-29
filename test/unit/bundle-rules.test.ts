import { describe, expect, it } from 'vitest';
import { checkManifest, hasModuleSyntax, scanSource } from '../../scripts/lib/bundle-rules.ts';

const rules = (text: string): string[] => scanSource('x.js', text).map((f) => f.rule);

describe('scanSource', () => {
  it.each([
    ['fetch("/a")', 'fetch'],
    ['new XMLHttpRequest()', 'XMLHttpRequest'],
    ['new WebSocket(u)', 'WebSocket'],
    ['navigator.sendBeacon(u, d)', 'sendBeacon'],
    ['eval("1")', 'eval'],
    ['new Function("return 1")', 'Function constructor'],
    ['importScripts("a.js")', 'importScripts'],
    ['const u = "https://example.com/x.js"', 'remote URL'],
    ['const u = "//cdn.example.com/x.js"', 'protocol-relative URL'],
  ])('flags %s', (text, rule) => {
    expect(rules(text)).toContain(rule);
  });

  it.each([
    'const prefetched = 1',
    'const s = "chrome-extension://abc/popup.html"',
    'const ns = "http://www.w3.org/2000/svg"',
    'el.matches(".a")',
    'const total = a / b / c',
  ])('does not flag %s', (text) => {
    expect(rules(text)).toEqual([]);
  });
});

describe('hasModuleSyntax', () => {
  it('detects import and export statements', () => {
    expect(hasModuleSyntax('import{a}from"./a.js";a()')).toBe(true);
    expect(hasModuleSyntax('const a=1;export{a};')).toBe(true);
    expect(hasModuleSyntax('const m = await import("./a.js")')).toBe(true);
  });

  it('accepts plain scripts', () => {
    expect(hasModuleSyntax('(()=>{const important = 1; return important})()')).toBe(false);
    expect(hasModuleSyntax('')).toBe(false);
  });
});

describe('checkManifest', () => {
  const good = {
    permissions: ['activeTab', 'scripting', 'storage'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    content_security_policy: { extension_pages: "default-src 'none'; script-src 'self'" },
  };

  it('accepts the approved manifest shape', () => {
    expect(checkManifest(good)).toEqual([]);
  });

  it('rejects widened permissions', () => {
    expect(checkManifest({ ...good, permissions: [...good.permissions, 'tabs'] })).not.toEqual([]);
    expect(checkManifest({ ...good, host_permissions: ['<all_urls>'] })).not.toEqual([]);
  });

  it('rejects a weak or missing CSP', () => {
    expect(checkManifest({ ...good, content_security_policy: {} })).not.toEqual([]);
    const csp = (extension_pages: string) => ({
      ...good,
      content_security_policy: { extension_pages },
    });
    expect(checkManifest(csp("default-src 'none'; script-src 'unsafe-eval'"))).not.toEqual([]);
    expect(checkManifest(csp("default-src 'none'; script-src https://a.com"))).not.toEqual([]);
    expect(checkManifest(csp("script-src 'self'"))).not.toEqual([]);
  });
});
