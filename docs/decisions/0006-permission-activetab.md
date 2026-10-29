# 0006 Permission: activeTab

Status: accepted.

**Why:** lets the extension act on the current tab at the moment the user presses the toolbar button or the keyboard shortcut, without a broad host grant.

**What it allows:** temporary access to the tab the user acted on. It ends when the tab navigates to a different site or closes. It is not granted on `chrome://` pages or the Chrome Web Store.

**What it does not cover:** a later navigation to another site. Decision 0005 covers that gap.

**Alternative rejected:** `host_permissions: ["<all_urls>"]`. It would let the extension read every page without a user action.
