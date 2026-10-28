# VEIL: brand and interface

Applies on top of DESIGN.md. DESIGN.md sets the general rules; this file sets what is specific to VEIL. If the two conflict, stop and tell me instead of choosing.

## Concept

A redacted document: ink on paper. The product covers things with solid ink, so the interface uses paper-toned surfaces, ink-toned text, and one recurring element, the solid ink bar. The bar appears only where it reports real state or marks something that is covered. Restraint is the theme.

Not allowed: padlocks, shields, eyes, ghosts, keyholes or any other privacy cliché; stamps, "CLASSIFIED" or "CONFIDENTIAL" text; typewriter fonts; torn paper, scanlines, noise textures; spy or hacker imagery.

## Terminology

One vocabulary, used everywhere (UI, README, code comments, commit messages):

- "Cover" is the action. "Covered" is the state. "Cover mode" is the feature.
- "Detected" means found by the scanner. "Covered" means currently hidden on the page.
- "Item" is one covered piece of content.
- Do not use redact, blur, mask, hide or protect in the UI.
- Never claim safety. No "secure", "safe", "protected", "private" or "100%". The tool covers what it detects. It does not guarantee that nothing is exposed.

## Color tokens

Define as CSS variables in one file. Starting values; verify contrast with scripts/contrast-check and adjust by eye. Do not trust these numbers blindly.

Light: bg #F7F6F3, surface #FFFFFF, border #E2DFD8, text-muted #6B675E, text #1A1917, ink #111110
Dark: bg #121211, surface #1A1A18, border #2E2D2A, text-muted #A19D93, text #EDEBE6, ink #EDEBE6 (used for the primary button fill, with dark text on it)
Accent (one, muted ink blue): light #2E4A7D, dark #8FA9DA. Used only for links, focus rings and selected state.
Status colors exist as tokens (error, warning, success) and are used only for real status.

Cover color on web pages is a separate constant, #111110, fully opaque, in every theme and on every page. It does not follow the extension theme.

Open question to settle with a screenshot test: on a dark page, a near-black cover can disappear into the background and look like missing content. Evaluate a 1px light inset outline applied only when the local background is dark. Default is no outline. Record the outcome in docs/decisions.

## Type

Geist, bundled locally, weights 400, 500, 600, sizes 12/14/16/24 only. Tabular numerals for every count and duration.
One serif is allowed, for the wordmark only, at 16px/600. Choose an open-licensed serif (Newsreader or Source Serif 4 are candidates), bundle it locally, and verify its license in a decision record.
No monospace, no display sizes.

## The ink bar: exhaustive list of uses

1. The cover-mode indicator in the popup: solid ink block when cover mode is on, 1px outlined block when off. It always reflects real state.
2. The toolbar icon (see below).
3. The top edge of the fail-closed screen.

Nowhere else. No bars as dividers, bullets, loading indicators, chart fills or decoration. Counts are shown as numbers, not bars.

## On-page behavior

- Covers appear instantly. No fade, no transition, no animation of any kind, because content must never be visible during a transition.
- Stage 1 adds no on-page UI other than the covers themselves and the fail-closed screen. No badges, no tooltips, no hover reveal. Anything injected into the page can end up in a screenshot.
- Fail-closed screen: full viewport, paper background, an 8px ink bar across the top, then two lines of text at 16px and 14px: "Cover paused" and "VEIL hit an error and has covered this page. Turn cover mode off from the toolbar to continue." Provide a dark variant.

## Toolbar icon

Handwritten SVG, flat, no gradient. Three lines of ragged-length text. Off state: all three lines outlined or thin. On state: the middle line is a solid bar. Export 16, 32, 48 and 128 px from a script and open the 16px version to check legibility. Align strokes to the pixel grid at 16px. Chrome gives no theme signal to the service worker, so choose a color that stays legible on both light and dark toolbars, test on both, and record the decision. Use the extension badge only for real state, never for decoration.

## Popup layout (360px wide)

Follow DESIGN.md for spacing, radius, borders and states. Structure, top to bottom:

1. Header row: wordmark (serif), and the current site's hostname in muted 12px text, right-aligned.
2. One dominant panel (12px radius, 1px border): the ink indicator, the status line ("Cover is on" or "Cover is off"), the count line ("7 items covered on this page", or "—" with the muted line "No scan has run on this tab yet."), and one primary button ("Turn cover on" or "Turn cover off") with the real keyboard shortcut shown beside it in muted text.
3. Section "Types to cover": a plain list, not cards. Each row has the type name, the count from the last scan (tabular, right-aligned) and a switch. Types: Email, Phone number, Aadhaar, PAN, Card number, IFSC, UPI ID, API keys and tokens, Password and payment fields.
4. Section "This site": one switch, "Cover automatically on this site".
5. Footer: last scan duration from the real measurement (for example "Last scan 12 ms"), muted, and the version.

States to design: off, on, scanning (skeleton for the counts), error (one line plus a retry button), restricted page ("This page can't be covered. Chrome blocks extensions here."), no host permission yet for this site (one line plus a button to grant it).

## Copy

Plain, short, specific, sentence case. Examples: "Cover is on", "7 items covered on this page", "No items found on this page", "Scan failed. Try again." Do not use exclamation marks. Do not address the user with filler ("Hey there"). Banned words are in DESIGN.md.

## README and docs

Plain markdown. No emoji, no banner image, no decorative badges (a real CI status badge is fine). The first line says what the tool does. The only images are real: the popup, and a before-and-after of a fixture page with covers applied. Every number comes from the metrics script.