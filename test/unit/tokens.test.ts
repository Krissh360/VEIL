import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BrandParseError, parseBrand, renderCss } from '../../scripts/lib/tokens.ts';

const SAMPLE = `
Light: bg #F7F6F3, surface #FFFFFF, border #E2DFD8, text-muted #6B675E, text #1A1917, ink #111110
Dark: bg #121211, surface #1A1A18, border #2E2D2A, text-muted #A19D93, text #EDEBE6, ink #EDEBE6 (note)
Accent (one): light #2E4A7D, dark #8FA9DA. Used only for links.
Cover color is a separate constant, #111110, fully opaque.
`;

describe('parseBrand', () => {
  it('reads both themes, the accent and the cover colour', () => {
    const tokens = parseBrand(SAMPLE);
    expect(tokens.light.bg).toBe('#F7F6F3');
    expect(tokens.dark.ink).toBe('#EDEBE6');
    expect(tokens.light.accent).toBe('#2E4A7D');
    expect(tokens.dark.accent).toBe('#8FA9DA');
    expect(tokens.cover).toBe('#111110');
  });

  it('uses the page background as the text colour on ink', () => {
    const tokens = parseBrand(SAMPLE);
    expect(tokens.dark.onInk).toBe(tokens.dark.bg);
  });

  it('fails when a required token is missing', () => {
    expect(() => parseBrand(SAMPLE.replace('surface #FFFFFF, ', ''))).toThrow(BrandParseError);
    expect(() => parseBrand('nothing here')).toThrow(BrandParseError);
  });

  it('parses the real BRAND.md', () => {
    const tokens = parseBrand(readFileSync('docs/BRAND.md', 'utf8'));
    expect(tokens.cover).toBe('#111110');
  });
});

describe('renderCss', () => {
  it('emits light values in :root and dark values in a media query', () => {
    const css = renderCss(parseBrand(SAMPLE));
    expect(css).toContain('--color-bg: #F7F6F3;');
    expect(css).toMatch(/prefers-color-scheme: dark\) \{\s+:root \{\s+--color-bg: #121211;/);
    expect(css).toContain('--cover-color: #111110;');
  });
});
