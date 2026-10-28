# 0004 Permissions

Status: proposed, pending owner confirmation of "cover automatically on this site" in Stage 1.

## Findings

- `activeTab` is granted by the toolbar action or a `commands` shortcut and ends when the tab navigates to a different site.
- `permissions.request()` needs a user gesture; the popup button qualifies. Whether a `commands` event qualifies is not documented; assume it does not.
- `registerContentScripts` persists across sessions by default. One invalid entry fails the whole call.

## Decision

| Permission | Reason |
|---|---|
| `activeTab` | Cover the current tab at the moment the user acts, without any broad grant. |
| `scripting` | Inject the content script into the tab on first use and register per-site scripts. |
| `storage` | Settings, the per-site list, and per-tab state in `storage.session`. |
| `optional_host_permissions` `http://*/*`, `https://*/*` | Requested per origin at runtime, from the popup click, only when the user turns on "Cover automatically on this site". Origin patterns are the exact origin. |

No `tabs`, `webNavigation` or broad `host_permissions`. No `unlimitedStorage`.

Minimum Chrome version 119 (`matchOriginAsFallback` for `about:blank`, `data:` and `blob:` frames; Highlight API since 105).

On "Cover automatically" turned on: request the origin, register a content script for it (`allFrames`, `matchOriginAsFallback`, `document_start`). On turned off: unregister and remove the origin permission. Hostnames are persisted; detected values never are.
