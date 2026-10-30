# Detectors

What each detector matches, what it deliberately does not, and which false positives and misses are known. Boundary and separator rules shared by all detectors are in decision 0013. The measured precision and recall arrive with `npm run metrics`; until then nothing here is a rate.

Every detector is a pure function `(text) => Match[]` in `src/engine/`. A match is `{ start, end, kind, confidence }` and never contains the matched text. `createDetect` runs them all and `mergeMatches` resolves overlaps (decision 0018).

| Kind | Rule | Check | Confidence |
| ---- | ---- | ----- | ---------- |
| card | 13 to 19 digits, bare or grouped by length | Luhn, plausible issuer prefix and length (0015) | 0.95 grouped, 0.8 bare |
| aadhaar | 12 digits, first 2 to 9, bare or 4-4-4 | Verhoeff | 0.9 grouped, 0.75 bare |
| secret | AWS key ID, GitHub token, Slack token, JWT, key name plus random value (0017) | prefix and length; entropy for the generic rule | 0.5 to 0.98 |
| pan | `AAAXA9999A`, X in `ABCFGHJLPT` (0014) | shape only | 0.9, 0.6 in lower case |
| ifsc | four letters, `0`, six letters or digits | shape only | 0.85, 0.55 in lower case |
| upi | `name@handle`, handle from a configurable list (0016) | list membership | 0.85 |
| email | `local@domain.tld`, Unicode letters allowed | domain structure, length caps | 0.9 |
| phone | Indian mobile (10 digits from 6 to 9, optional +91, 91 or 0), or `+` followed by 8 to 15 digits | shape and length | 0.6 to 0.95 |

## False-positive policy

The policy is to prefer a cover that turns out to be unnecessary over a value left showing, but not at any price: a detector that fires on ordinary identifiers teaches people to stop trusting covers. So a detector with a checksum requires it, a detector with a fixed prefix requires the prefix and a minimum length, and every numeric detector rejects a match that touches a letter, digit or underscore (decision 0013).

Known false positives, each recorded in the detector's test table:

- **card, aadhaar:** an identifier that is well-formed and passes the checksum by chance. About one random number in ten passes Luhn or Verhoeff; the issuer rule (cards) and the first-digit rule (Aadhaar) remove most of those. A valid card number inside a longer space-separated list of numbers can also match as an Aadhaar number or a shorter card.
- **phone:** a ten-digit order or reference number starting 6 to 9 that follows a hyphen or other punctuation (`ORD-9876543210`). Bare runs score 0.6 so a later threshold can treat them differently.
- **pan, ifsc:** any code in the same shape, such as an 11-character part code (`PROD0123456`).
- **email:** scp-style addresses (`git@github.com:org/repo`).
- **upi:** prose that uses a handle word (`meet@sbi`).
- **generic secret:** a long random-looking value assigned to a variable called `token` or `secret` that is not a secret.

## Known misses

- Numbers written with non-ASCII digits, or split by a line break, tab, dot or slash.
- Any number broken across text nodes or elements; the engine sees one string at a time.
- UPI IDs with a handle not in the list, tokens with formats newer than those recorded in 0017, and cards from issuers not in 0015.
- Phone numbers without a `+` that are not Indian mobiles, and Indian landlines.
- PANs with a fourth letter outside the recorded set (0014).
- JWTs with a part longer than the caps in 0017. A `ghs_` token longer than 1024 characters is covered only for its first 1024.
- Aadhaar Virtual IDs (16 digits), which have a different length and are not covered.

## Cost

Every detector is linear in the text length: anchored on a character that must be present (`@`, `+`, a key name) and expanded by hand within fixed caps, or a regular expression with no nested or overlapping repetition and a lookbehind that stops a scan restarting inside a run. The 1 MB adversarial inputs in `test/unit/engine/performance.test.ts` check this; run it with `VEIL_TIMINGS=1` to print the slowest cases.
