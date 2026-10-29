# VEIL plan

Approved plan for Stage 1, kept here so it survives a context reset. The rules live in `CLAUDE.md`, `docs/DESIGN.md` and `docs/BRAND.md`. Choices are recorded in `docs/decisions/`.

## Goal

A Chrome extension (Manifest V3, TypeScript) that covers sensitive content on a page with opaque fills so screenshots, recordings and screen shares of the tab do not show it. Detection runs from the DOM, on the device. The mechanism is a live per-tab "cover mode".

Out of scope: images, canvas, video, PDFs, OCR, face detection, names and addresses in free text, the extension's own capture button, any AI feature, Firefox, any server or network code.

## Decisions made

- Per-site "Cover automatically on this site" is in Stage 1. It is the only way to avoid an uncovered page after navigating to another site (0005, 0009).
- Permissions: `activeTab`, `scripting`, `storage`, optional host access for `http://*/*` and `https://*/*`. Nothing else (0004, 0006 to 0009).
- Minimum Chrome 119. Default shortcut `Alt+Shift+V`. All detector types on by default.
- Fail-closed copy: "VEIL hit an error and has covered this page." (BRAND.md changed; "hiding" is a banned word.)
- Highlights cannot draw outlines. Form fields use an overlay. The dark-page outline question is settled by a screenshot test (0003, later 0012).
- Build with Vite (owner's choice), TypeScript 6.0.x, Prettier added (0001).
- No icon library. The popup uses no icons.
- Wordmark is plain "VEIL".

## Milestones

Each ends with passing tests, a short summary, and a stop for review.

1. Bootstrap (done when reviewed): tooling, manifest, build, tokens, fonts, bundle and contrast checks, threat model draft.
2. Engine: types, Verhoeff and Luhn validators, detectors (email, phone, Aadhaar, PAN, card, IFSC, UPI, API keys and tokens), field rules, overlap resolution. Tables and property tests.
3. Corpus and metrics: seeded generator, fixtures with ground truth, `npm run metrics`.
4. DOM scanner and highlight spike: text nodes, form fields, open shadow roots, frames. Spike: highlight style scoping in shadow roots, dark-page visibility.
5. Cover layer: highlights, overlay for form fields, fail-closed screen. Pixel tests.
6. Scheduler: mutation handling, scroll and resize, time budget that triggers fail-closed.
7. Extension wiring: per-tab state in `storage.session`, commands, messaging with counts and timings only, permissions, startup hold, end-to-end tests, manual checklist for the shortcut and the permission prompt.
8. Popup: layout from BRAND.md, states, toolbar icon.
9. Hardening and README: numbers from `npm run metrics`, final threat model, before-and-after fixture image.

## File tree (target)

```
CLAUDE.md
package.json  tsconfig.json  tsconfig.node.json  eslint.config.js
vite.config.ts  vitest.config.ts  playwright.config.ts
docs/        plan.md  DESIGN.md  BRAND.md  threat-model.md  decisions/
scripts/     gen-tokens.ts  check-bundle.ts  check-contrast.ts  lib/
             (later: gen-corpus, metrics, make-icons)
src/engine/      detectors, validators, field rules   (milestone 2)
src/dom/         scanner, cover layer, observers      (milestones 4 to 6)
src/extension/   manifest.json  background.ts  content.ts  tokens.css  popup/
src/shared/      shared types                         (when first needed)
test/            unit/  e2e/  fixtures/ (fixtures from milestone 3)
```

## Dependencies (all dev)

typescript 6.0.x, vite, vitest, @playwright/test, eslint with @eslint/js and typescript-eslint, prettier with eslint-config-prettier, @types/chrome, @types/node, @fontsource/geist-sans and @fontsource/newsreader (font files copied at build). Added later: fast-check (property tests, milestone 2).

## Open items

- Whether Geist's tabular numerals are present in the Latin subset: check in milestone 8.
- Whether a keyboard command counts as a user gesture for `permissions.request()`: test in milestone 7.
- Outline on dark pages: screenshot test in milestone 4 or 5.
