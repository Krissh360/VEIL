# 0010 Design tokens

Status: accepted.

`src/extension/tokens.css` is generated from `docs/BRAND.md` by `npm run gen:tokens` (parser in `scripts/lib/tokens.ts`). `npm run check:contrast` fails if the file is out of date.

Values BRAND.md does not give, chosen here:

- `--color-on-ink`: the same theme's page background, so text on the ink fill is paper on ink in light and ink-dark on pale ink in dark, as BRAND.md describes.
- Status colours (BRAND.md says only that the tokens exist). Light: error #B3261E, warning #8A5A00, success #2F6B3B. Dark: error #F2A39D, warning #E3B65C, success #8CCB98. All pass 4.5:1 on both the page and panel backgrounds.
- Spacing, radius, type sizes, weights and the 150ms duration come from DESIGN.md.

Border contrast: BRAND.md's border colours measure 1.2 to 1.4:1 against their backgrounds. Borders only separate panels and rows, so WCAG 1.4.11 does not require more, and the values are printed as information. If the popup ends up looking too faint, change them in BRAND.md.

The cover colour (`--cover-color`, #111110) is a constant for web pages and does not change with the theme.
