export const COLOR_KEYS = [
  'bg',
  'surface',
  'border',
  'textMuted',
  'text',
  'ink',
  'onInk',
  'accent',
  'error',
  'warning',
  'success',
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];
export type ThemeColors = Record<ColorKey, string>;

export interface Tokens {
  light: ThemeColors;
  dark: ThemeColors;
  cover: string;
}

export class BrandParseError extends Error {}

// BRAND.md gives no status colours. These are chosen here and checked by check-contrast.
const STATUS = {
  light: { error: '#B3261E', warning: '#8A5A00', success: '#2F6B3B' },
  dark: { error: '#F2A39D', warning: '#E3B65C', success: '#8CCB98' },
} as const;

const HEX = '#[0-9A-Fa-f]{6}';

function readTokenLine(markdown: string, label: string): Map<string, string> {
  const line = new RegExp(`^${label}:\\s*(.+)$`, 'm').exec(markdown)?.[1];
  if (line === undefined) throw new BrandParseError(`BRAND.md has no "${label}:" token line`);
  const pairs = new Map<string, string>();
  for (const match of line.matchAll(new RegExp(`([a-z-]+)\\s+(${HEX})`, 'g'))) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) pairs.set(name, value.toUpperCase());
  }
  return pairs;
}

function need(pairs: Map<string, string>, name: string, label: string): string {
  const value = pairs.get(name);
  if (value === undefined) throw new BrandParseError(`BRAND.md "${label}:" line has no "${name}"`);
  return value;
}

function theme(
  pairs: Map<string, string>,
  label: 'Light' | 'Dark',
  accent: string,
  status: Pick<ThemeColors, 'error' | 'warning' | 'success'>,
): ThemeColors {
  const bg = need(pairs, 'bg', label);
  return {
    bg,
    surface: need(pairs, 'surface', label),
    border: need(pairs, 'border', label),
    textMuted: need(pairs, 'text-muted', label),
    text: need(pairs, 'text', label),
    ink: need(pairs, 'ink', label),
    // Text on an ink fill uses the page background colour of the same theme.
    onInk: bg,
    accent,
    ...status,
  };
}

export function parseBrand(markdown: string): Tokens {
  const accentMatch = new RegExp(`^Accent[^\\n]*light\\s+(${HEX}),\\s*dark\\s+(${HEX})`, 'm').exec(
    markdown,
  );
  const coverMatch = new RegExp(`separate constant,\\s*(${HEX})`).exec(markdown);
  if (!accentMatch?.[1] || !accentMatch[2])
    throw new BrandParseError('BRAND.md has no accent line');
  if (!coverMatch?.[1]) throw new BrandParseError('BRAND.md has no cover colour constant');
  return {
    light: theme(
      readTokenLine(markdown, 'Light'),
      'Light',
      accentMatch[1].toUpperCase(),
      STATUS.light,
    ),
    dark: theme(readTokenLine(markdown, 'Dark'), 'Dark', accentMatch[2].toUpperCase(), STATUS.dark),
    cover: coverMatch[1].toUpperCase(),
  };
}

const VAR_NAMES: Record<ColorKey, string> = {
  bg: '--color-bg',
  surface: '--color-surface',
  border: '--color-border',
  textMuted: '--color-text-muted',
  text: '--color-text',
  ink: '--color-ink',
  onInk: '--color-on-ink',
  accent: '--color-accent',
  error: '--color-error',
  warning: '--color-warning',
  success: '--color-success',
};

function colorBlock(colors: ThemeColors, indent: string): string {
  return COLOR_KEYS.map((key) => `${indent}${VAR_NAMES[key]}: ${colors[key]};`).join('\n');
}

export function renderCss(tokens: Tokens): string {
  return `/* Generated from docs/BRAND.md by scripts/gen-tokens.ts. Edit BRAND.md, then run npm run gen:tokens. */
:root {
  color-scheme: light dark;
${colorBlock(tokens.light, '  ')}

  --cover-color: ${tokens.cover};

  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --space-32: 32px;
  --space-48: 48px;
  --space-64: 64px;

  --radius-sm: 8px;
  --radius-lg: 12px;

  --font-sans: 'Geist', system-ui, sans-serif;
  --font-serif: 'Newsreader', Georgia, serif;
  --font-size-12: 12px;
  --font-size-14: 14px;
  --font-size-16: 16px;
  --font-size-24: 24px;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  --duration-fast: 150ms;
  --ease-out: ease-out;
}

@media (prefers-color-scheme: dark) {
  :root {
${colorBlock(tokens.dark, '    ')}
  }
}
`;
}
