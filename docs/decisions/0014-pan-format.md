# 0014 PAN format and the fourth letter

Status: accepted, with one open verification item (see below).

**Why:** the PAN detector must be narrow enough that ten-character codes in order numbers and hashes do not match. The fourth letter is the strongest structural filter.

## Rule

`AAAXA9999A`: three letters, a holder-category letter, one letter, four digits, one letter. The holder-category letter must be one of:

| Letter | Holder                       |
| ------ | ---------------------------- |
| P      | Person (individual)          |
| C      | Company                      |
| H      | Hindu Undivided Family       |
| F      | Firm                         |
| A      | Association of Persons       |
| T      | Trust (association of persons) |
| B      | Body of Individuals          |
| L      | Local authority              |
| J      | Artificial juridical person  |
| G      | Government                   |

The final letter is a check character with no published algorithm, so it is not validated. The fifth letter is the initial of the surname or entity name, so any letter is allowed.

## Verification status

I could not confirm this list against a primary source. The Income Tax Department help page I tried (`incometax.gov.in`) returned 404, and no search result came from an official domain. The ten letters above agree across Wikipedia's "Permanent account number" article (uncited section, flagged on the page as possibly original research) and several tax-advisory sites found by search, which in turn disagree about whether "T" is "Trust" or "Trust (AOP)" and whether LLPs use a separate letter. Nothing found supports a letter outside these ten.

**Owner check (2026-10-30):** the project owner compared the letters with Protean's website and with their own PAN and found them consistent. That is a first-hand check, not a citable document, so the status above stands for the written record.

**What this means:** if an official source adds a letter (for example for LLPs), PANs with that letter are missed, not wrongly matched. Confirm against the Income Tax Department's current PAN specification and amend `PAN_HOLDER_CODES` if needed.

## Consequences

- Capitals match at confidence 0.9, any lower case at 0.6.
- Boundary rules follow decision 0013: a PAN touching a letter, digit or underscore is not matched.
- A shape-only match can still be a false positive, for example a ten-character product code that happens to follow the pattern.
