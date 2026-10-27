# {VEIL}

Chrome extension (Manifest V3, TypeScript) that covers sensitive content on a page with opaque fills so screenshots, recordings and screen shares of the tab never show it. Detection runs from the DOM, on the device only.

Read `docs/DESIGN.md` before touching any UI. Read `docs/threat-model.md` before touching the engine, the cover layer or permissions.

## Invariants

Breaking any of these is a bug, even if tests pass.

- No network code anywhere: no fetch, XMLHttpRequest, WebSocket, sendBeacon, remote scripts or remote fonts. The bundle check must stay green.
- Detected values never leave the content script, are never logged, and are never persisted. Messages to the popup and background carry counts by type and timings only.
- Covers are fully opaque. No blur, no partial transparency.
- Fail closed: if the engine errors while cover mode is on, cover the whole viewport and report the error.
- Narrowest permissions that work. Every permission has a written reason in `docs/decisions/`.
- No eval, no remote code, strict CSP.
- No real personal data in code, tests, fixtures or commits. Fake data comes from the seeded generator in `scripts/`.

## Commands

Defined in `package.json` (keep this list current when scripts change):

- `npm run build` builds the extension
- `npm run test` unit and property tests
- `npm run test:e2e` Playwright tests against the built extension
- `npm run lint` and `npm run typecheck`
- `npm run check:bundle` fails on network APIs in the bundle
- `npm run check:contrast` verifies design token contrast
- `npm run metrics` prints precision, recall and scan time per detector and fixture

Run lint, typecheck, test and check:bundle before every commit.

## Structure

- `src/engine/` pure, DOM-free detection. No browser APIs here.
- `src/dom/` scanner, cover layer, observers.
- `src/extension/` content script, service worker, popup, messaging, settings.
- `src/shared/` types shared across contexts.
- `test/fixtures/` synthetic pages with ground-truth JSON.
- `docs/decisions/` short records of real choices.

## How to work

- Read the existing code before changing it. Do not rewrite what you have not read.
- Verify current documentation for any browser or library API before using it. Do not rely on memory. If behavior differs from expectation, record it in `docs/decisions/`.
- Small, focused changes. One concern per commit, conventional commit messages.
- Work milestone by milestone. At the end of each: tests passing, a short summary of what changed and what you verified, then stop for review.
- Ask before adding a dependency, widening a permission, or changing an invariant.
- When a request conflicts with an invariant, say so and stop. Do not work around it.
- Do not claim something works unless you ran it. If you could not verify, say so.

## Code standards

- TypeScript strict. No `any`, no non-null assertions without a reason in a comment.
- Small modules, clear names, no dead or commented-out code, no TODO comments.
- Comments explain why, never what. No banners or decorative headers.
- No speculative abstraction. Add structure when there are two real uses.
- Detectors are pure functions with a validator where one exists, plus positive and negative test tables. Property tests cover checksum-based detectors.
- Typed errors where callers need to react. No silent catch blocks.

## Design

- Follow `docs/DESIGN.md` exactly. Tokens live in one CSS file and are used everywhere.
- Theme is a redacted document: ink on paper. The solid ink bar is the only recurring motif and appears only where it reflects real state.
- No emoji, gradients, shadows, illustrations or decorative badges. No control that does nothing.
- Copy is plain, specific and in sentence case. Banned words are listed in `docs/DESIGN.md`.

## Measurement and claims

- Any number in the README or the UI comes from `npm run metrics` or a real measurement. Never estimate.
- Report misses and false positives alongside the results.
- Known limits stay documented in `docs/threat-model.md`: text in images and canvas, names in free text, browser UI outside the page, closed shadow roots, inaccessible cross-origin frames, OS capture timing.

## Out of scope until told otherwise

OCR, face detection, the extension's own capture button, post-capture leak check, any AI feature, Firefox, any server or account system.