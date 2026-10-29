# Threat model

First draft. It will be revised as the detectors and the cover layer are built.

## What VEIL is for

VEIL covers sensitive content on a web page with solid fills while cover mode is on, so that a screenshot, a recording or a screen share of that tab does not show it. A Chrome extension cannot intercept operating-system screenshots, so VEIL does not try. It keeps the page covered all the time instead, and a capture taken while cover mode is on shows the covers.

It covers what it detects. It does not guarantee that nothing is exposed.

## What it covers

Text that matches a detector: email addresses, phone numbers (Indian mobile and a general international pattern), Aadhaar numbers (12 digits that pass the Verhoeff check), PAN, payment card numbers (Luhn), IFSC codes, UPI IDs, and common API keys and tokens. It also covers form fields by their type or autocomplete token: password inputs and fields marked as card number, one-time code or current password. It reads text nodes, form fields, open shadow roots and frames it can reach, and it keeps up with content that changes after load.

All of this happens inside the page's content script, on the device. Detected values are not sent anywhere, not logged and not stored. The popup and the service worker receive only counts by type and timings. The extension contains no network code, which the bundle check enforces.

## What it cannot cover

Text drawn inside images, canvas, video and PDFs is not covered, and there is no OCR. Names and addresses in free text are not covered because there is no reliable pattern for them. Browser interface outside the page, such as the address bar, tab titles, autofill suggestions and other extensions' popups, is outside the page and cannot be covered. Closed shadow roots cannot be read. Frames from another origin are covered only if the user has granted access to that origin. Values that no detector recognises are not covered, and the detectors have false positives and misses; their measured rates come from the metrics script and are reported with the results.

## Timing and navigation

Cover mode works per tab. A capture taken before cover mode is on, or before the first scan of a page has finished, shows the page as it is. To shorten that window, a page on a site with automatic cover keeps its content invisible until the first scan completes.

Access granted through the toolbar button or the keyboard shortcut lasts only until the tab goes to a different site. After that, the extension cannot touch the new page unless the user has turned on automatic cover for that site. VEIL reports this state in the popup and on the toolbar badge instead of implying the page is covered. See decision 0005.

## When something goes wrong

If the engine or the cover layer fails, or a scan takes longer than its time budget, while cover mode is on, VEIL covers the whole viewport and reports the error. It does not leave the page partly covered.

## Assumptions

The user's browser and operating system are not compromised. The page is not actively hostile: its scripts share the `CSS.highlights` registry with VEIL and could read which ranges are covered or clear them, and overlay elements for form fields exist in the page's DOM where page scripts can see them. A page built to defeat VEIL is outside Stage 1. The user turns cover mode on before showing or capturing anything.

## Related records

0003 highlight findings, 0004 permissions, 0005 fail-closed, navigation and startup, 0011 content security policy.
