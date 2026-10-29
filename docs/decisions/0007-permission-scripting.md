# 0007 Permission: scripting

Status: accepted.

**Why:** the content script is injected on demand with `chrome.scripting.executeScript` (with `activeTab`) and registered for sites the user has opted in with `registerContentScripts`. There is no static `content_scripts` entry, because that would need host permissions at install.

**What it allows:** injecting extension-owned files into tabs the extension already has access to. It grants no access on its own.

**Alternative rejected:** static content scripts matching all pages.
