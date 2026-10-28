# Threat model

VEIL covers detected sensitive content in a tab so that screenshots, recordings and screen shares of the tab do not show it. It covers what it detects. It does not guarantee that nothing is exposed.

## Assets

Text and form values on the page that match a detector or a field rule.

## In scope

- Screenshots, recordings and screen shares of a tab while cover mode is on.
- Content present at load and content added later by scripts.
- Detection and covering entirely on the device. Detected values never leave the content script, are never logged and are never persisted. Messages carry counts by type and timings.

## Known limits (documented, not fixed)

- Text inside images, canvas, video and PDFs.
- Names and addresses in free text.
- Browser UI outside the page (address bar, tab titles, autofill popups, extension popups).
- Closed shadow roots.
- Cross-origin frames the extension has no host access to.
- OS-level capture timing: a capture taken before cover mode is on, or before the first scan completes, shows the page.
- Navigation to an origin without host access: the content script is not injected, so that page is not covered. The popup and badge report this state; see decision 0005.
- Page scripts share `CSS.highlights` and can read the ranges VEIL registers (learning what was flagged) or clear them. A hostile page is out of scope for Stage 1.
- Overlay elements for form fields are in the page DOM and visible to page scripts.
- Regex detectors have false positives and misses. Measured numbers come from `npm run metrics`.

## Failure behavior

If the engine, scanner or scheduler errors, or a scan exceeds its time budget, while cover mode is on, VEIL covers the whole viewport with the fail-closed screen and reports the error.

## Related decisions

0003 highlight findings, 0004 permissions, 0005 fail-closed, navigation and startup.
