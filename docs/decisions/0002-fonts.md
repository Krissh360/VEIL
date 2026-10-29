# 0002 Fonts and licenses

Status: accepted.

| Font             | Use                              | Files bundled                        | License                                                                                                   |
| ---------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Geist (Sans)     | All popup text                   | Latin 400, 500, 600 WOFF2            | SIL OFL 1.1. "(C) 2023 Vercel, made in collaboration with basement.studio" per the `@fontsource/geist-sans` 5.3.0 LICENSE |
| Newsreader       | Wordmark only, 16px, weight 600  | Latin 600 WOFF2                      | SIL OFL 1.1. "Copyright 2020 The Newsreader Project Authors" per the `@fontsource/newsreader` 5.3.0 LICENSE |

- Source: the `@fontsource` npm packages, which ship pre-built WOFF2 under OFL-1.1. They are devDependencies; the build copies the four WOFF2 files and both license texts into `dist/` (`dist/assets/`, `dist/licenses/`). Nothing is loaded from a network.
- Reserved Font Name: neither license file names a Reserved Font Name after its copyright line. The files are used unmodified, so the clause would not apply in any case.
- OFL conditions met: the font is not sold on its own, and the copyright notice and license text ship with it.
- Newsreader was chosen over Source Serif 4 because its license file shows no reserved name and the package is available with one weight. Source Serif 4 was not checked further.
- Not verified: that Geist's tabular-number feature is present in the Latin subset. It is checked when counts are first rendered, in the popup milestone.
