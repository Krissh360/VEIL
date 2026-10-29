# 0009 Permission: optional_host_permissions

Status: accepted.

**Why:** "Cover automatically on this site" needs access to one origin that persists across navigations and sessions. The patterns `http://*/*` and `https://*/*` are only declared as optional, so nothing is granted at install. The popup requests one exact origin at runtime, from a button click (a user gesture, which `permissions.request()` requires). Turning the switch off removes it.

**What it allows:** only the origins the user has approved. An approved origin gets a registered content script, including its frames.

**Not requested:** any host access at install; `<all_urls>`.

**Not verified:** whether a keyboard command counts as a user gesture for `permissions.request()` from the service worker. Assumed not; the request is made from the popup.
