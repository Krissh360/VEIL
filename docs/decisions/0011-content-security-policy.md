# 0011 Content security policy

Status: accepted.

Extension pages use:

`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`

- Starts from `'none'`, so each source type is opened explicitly and only to the extension's own files.
- No `unsafe-inline`, no `unsafe-eval`, no `wasm-unsafe-eval`, no remote origins. `connect-src 'none'` blocks network requests from extension pages.
- Because inline styles are blocked, popup styling lives in CSS files.
- `npm run check:bundle` fails if the built manifest weakens any of this.

The policy applies to extension pages (the popup and service worker). Content scripts run in web pages and are not covered by it; their rule is the bundle check against network APIs.
