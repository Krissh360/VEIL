# 0001 Tooling

Status: accepted.

- Vite 8 builds the extension from `src/extension/` (background, content script, popup). It was chosen by the owner over esbuild. Build settings: `target: chrome119`, no source maps, no module-preload polyfill (the polyfill uses a network API and would fail the bundle check), assets never inlined.
- TypeScript is pinned to 6.0.x because `typescript-eslint` 8.72 declares support for `<6.1.0`. TypeScript 7 is out; revisit when typescript-eslint supports it.
- Two tsconfigs: `tsconfig.json` for `src/` (DOM and `chrome` types only) and `tsconfig.node.json` for scripts, tests and config (adds `node`). The engine will get its own DOM-free config when it exists.
- Scripts in `scripts/` are TypeScript run directly by Node (type stripping, Node 22.18 or later), so there is no second build step. Imports use `.ts` extensions and `erasableSyntaxOnly` is on.
- Vitest runs unit tests for the scripts and, later, the engine. DOM and extension behaviour is tested in real Chromium with Playwright, because jsdom has no layout, no Range painting and no Highlight API.
- ESLint (type-aware `recommendedTypeChecked`) forbids `any` and non-null assertions. Prettier owns formatting; `docs/` and `CLAUDE.md` are excluded so prose is not reflowed.
- `npm run check` runs every check in order.
