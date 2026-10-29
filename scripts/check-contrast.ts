import { readFileSync } from 'node:fs';
import { contrastRatio } from './lib/contrast.ts';
import { parseBrand, renderCss, type ColorKey, type ThemeColors } from './lib/tokens.ts';

interface Pair {
  use: string;
  fg: ColorKey;
  bg: ColorKey;
  min: number;
}

const TEXT = 4.5;
const CONTROL = 3;

const PAIRS: Pair[] = [
  { use: 'body text on page', fg: 'text', bg: 'bg', min: TEXT },
  { use: 'body text on panel', fg: 'text', bg: 'surface', min: TEXT },
  { use: 'muted text on page', fg: 'textMuted', bg: 'bg', min: TEXT },
  { use: 'muted text on panel', fg: 'textMuted', bg: 'surface', min: TEXT },
  { use: 'link on page', fg: 'accent', bg: 'bg', min: TEXT },
  { use: 'link on panel', fg: 'accent', bg: 'surface', min: TEXT },
  { use: 'primary button label', fg: 'onInk', bg: 'ink', min: TEXT },
  { use: 'error text on page', fg: 'error', bg: 'bg', min: TEXT },
  { use: 'error text on panel', fg: 'error', bg: 'surface', min: TEXT },
  { use: 'warning text on page', fg: 'warning', bg: 'bg', min: TEXT },
  { use: 'warning text on panel', fg: 'warning', bg: 'surface', min: TEXT },
  { use: 'success text on page', fg: 'success', bg: 'bg', min: TEXT },
  { use: 'success text on panel', fg: 'success', bg: 'surface', min: TEXT },
  { use: 'ink indicator and switch fill on panel', fg: 'ink', bg: 'surface', min: CONTROL },
  { use: 'switch outline (muted) on panel', fg: 'textMuted', bg: 'surface', min: CONTROL },
  { use: 'focus ring on page', fg: 'accent', bg: 'bg', min: CONTROL },
  { use: 'focus ring on panel', fg: 'accent', bg: 'surface', min: CONTROL },
];

// Borders only separate panels and rows. They do not identify a control, so WCAG 1.4.11 does
// not apply; the ratios are printed for information.
const INFO: Pair[] = [
  { use: 'panel border on page', fg: 'border', bg: 'bg', min: 0 },
  { use: 'panel border on panel', fg: 'border', bg: 'surface', min: 0 },
];

const brandTokens = parseBrand(readFileSync('docs/BRAND.md', 'utf8'));
let failures = 0;

if (readFileSync('src/extension/tokens.css', 'utf8') !== renderCss(brandTokens)) {
  process.stdout.write('FAIL  src/extension/tokens.css is out of date. Run npm run gen:tokens.\n');
  failures += 1;
}

function report(name: string, colors: ThemeColors): void {
  process.stdout.write(`\n${name}\n`);
  for (const pair of [...PAIRS, ...INFO]) {
    const ratio = contrastRatio(colors[pair.fg], colors[pair.bg]);
    const info = pair.min === 0;
    const ok = ratio >= pair.min;
    if (!ok) failures += 1;
    const status = info ? 'info' : ok ? 'pass' : 'FAIL';
    const need = info ? '  -  ' : `${pair.min.toFixed(1)}:1`;
    process.stdout.write(
      `  ${status.padEnd(4)}  ${ratio.toFixed(2).padStart(5)}:1  need ${need}  ${pair.use}` +
        `  (${colors[pair.fg]} on ${colors[pair.bg]})\n`,
    );
  }
}

report('Light', brandTokens.light);
report('Dark', brandTokens.dark);
process.stdout.write(failures === 0 ? '\nContrast check passed.\n' : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);
