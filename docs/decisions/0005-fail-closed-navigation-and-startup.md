# 0005 Navigation gap, startup race and fail-closed

Status: proposed.

## Problems

1. With `activeTab` only, a navigation to a different site in a covered tab leaves the next page uncovered.
2. The content script must know cover state before first paint. The service worker may be asleep and messaging is async.
3. Errors and slow scans must not leave content visible.

## Decisions

Navigation gap
- Sites the user has turned "Cover automatically" on for keep a registered content script, so navigation within them stays covered.
- For a tab with cover on that navigates to an origin without a grant, VEIL cannot inject. This is a documented limit, not hidden. State for that tab is marked unverified until the new document's content script reports in. If none does by load complete, the toolbar badge shows the real state ("off") and the popup shows the no-host-permission state with a grant button.

Startup race
- Per-tab state and the per-site list live in `storage.session` and `storage.local`. The worker calls `storage.session.setAccessLevel` for content scripts on every start.
- The registered script runs at `document_start`. For origins in the auto list it starts covered synchronously: it adopts a stylesheet that makes the root invisible, with no DOM change, until the first scan finishes or fails. For per-tab cover mode on other origins it does the same until it has read tab state, which is one storage read.
- Once the first scan completes, the stylesheet is removed and the covers stay.

Fail closed
- Any thrown error, a scan over its time budget, or a failed highlight registration while cover mode is on shows the fail-closed screen (BRAND) in a closed-mode shadow host and reports the error type to the popup. Nothing is skipped silently.
- The screen uses the system font stack, not bundled fonts, to avoid exposing extension resources to the page.
