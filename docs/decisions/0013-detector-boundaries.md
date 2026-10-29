# 0013 Detector boundaries, separators and digits

Status: accepted.

**Why:** a detector that fires inside a longer run of characters covers order numbers, hashes and timestamps and teaches users to ignore covers. One rule for every detector keeps that predictable.

## Rules

- **Run boundary.** A match is rejected when the character directly before or after it is a letter, a digit or an underscore in any script (`\p{L}`, `\p{N}`, `_`). This applies to numbers, codes and tokens. Punctuation, spaces, tabs and line breaks end a run.
- **Digits.** Only ASCII `0-9` count as digits. Other decimal digits (Devanagari, fullwidth and so on) are never read as digits and are not normalised, so a number written with them is not detected (a miss, listed in the threat model). They still count as part of a longer run, so an ASCII number touching one is rejected.
- **Separators in grouped numbers.** Aadhaar and card numbers may be written in groups with one consistent separator: an ASCII space, a no-break space (U+00A0) or a hyphen. Mixed separators, double separators, tabs and line breaks are not accepted. Digits split across text nodes or lines are not rejoined by the engine.
- **Decimal point.** A number directly before or after a `.` that touches another digit is part of a decimal number, not an identifier, and is rejected. A comma is not treated this way, because comma-separated lists of numbers are common.
- **Neighbouring groups.** A grouped number next to another group of digits across one separator is still accepted, because the separator ends the run. A card number followed by its expiry date is the case this protects. The cost is that a number inside a longer space-separated list of numbers can be matched.
- **Case.** Codes written in capitals by convention (PAN, IFSC, AWS key IDs) are also matched in lower case at lower confidence where noted in the detector.

## Consequences

- Misses: numbers split by a line break or tab, numbers in non-ASCII digits, numbers typed with other separators (dots, slashes).
- False positives that remain: identifiers that happen to be well-formed and checksum-valid, for example a hyphen-prefixed order number whose digits pass the Verhoeff check. Each detector documents its own policy.
- The rule uses lookbehind and lookahead, which the Chrome minimum (119) supports.
