import { readFileSync, writeFileSync } from 'node:fs';
import { parseBrand, renderCss } from './lib/tokens.ts';

const brand = readFileSync('docs/BRAND.md', 'utf8');
writeFileSync('src/extension/tokens.css', renderCss(parseBrand(brand)));
process.stdout.write('Wrote src/extension/tokens.css\n');
