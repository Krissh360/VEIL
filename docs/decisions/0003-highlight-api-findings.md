# 0003 Highlight API findings and cover strategy

Status: accepted. Items marked "spike" are verified in milestone 3 and this record is updated.

## Verified in documentation

- `::highlight()` allows `color`, `background-color`, `text-decoration*`, `text-shadow` and `-webkit-text-*`. `background-image` is ignored. No outline, border, padding or opacity.
- Highlights paint behind text only. Form control values are not DOM text and cannot be ranged.
- Registry is per document; ranges in another document are ignored.
- Which tree's stylesheet applies `::highlight()` for text in shadow trees is not specified (CSSWG #11699 is open).

## Decisions

- Set both `color` and `background-color` to `#111110` so glyph overhang outside the highlighted area is still cover-coloured.
- Use `StaticRange`, rebuilt per scan, instead of live ranges.
- Add the style rule through `adoptedStyleSheets` on the document and on each open shadow root, so the page DOM is not modified.
- Set `Highlight.priority` high so page highlights cannot paint over a cover.
- Form fields use a fixed-position overlay inside one shadow host. Position is recomputed on scroll, resize, `ResizeObserver` and a frame loop that runs only while overlays exist. If recomputation exceeds its budget, fail closed.
- Spike: confirm shadow-root stylesheet scoping. If adopted sheets do not apply, text in that root is covered by overlay instead.
- The optional light outline on dark pages cannot be a highlight property. It is decided in 0006 after a screenshot test, and applies only to overlays if kept.
