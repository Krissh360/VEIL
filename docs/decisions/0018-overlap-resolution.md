# 0018 Resolving overlapping matches

Status: accepted.

**Why:** several detectors can claim the same text (a 12-digit number can be an Aadhaar number or a phone number, a 16-digit group can contain a 12-digit Aadhaar-shaped run). The cover layer needs a sorted, non-overlapping list, and merging must never leave text uncovered that some detector had matched.

## Rule

Every position in the text goes to the best match that covers it, ranked by:

1. **Kind specificity**, most specific first: card, Aadhaar, secret, PAN, IFSC, UPI, email, phone. Kinds with a checksum or a fixed token format rank above shape-only ones. UPI ranks above email and phone because a UPI ID can look like both.
2. Higher **confidence**.
3. The **longer** match.
4. The earlier start.

Adjacent positions won by matches of the same kind and confidence are joined into one range.

## Consequences

- **The covered set never shrinks.** A match that is only partly beaten keeps the part no winner covers, as its own match. For example an email that runs two characters past a card number keeps those two characters. The alternative, dropping the beaten match whole, would uncover text a detector had flagged.
- **Counts by type can differ from detector hits.** A beaten match contributes only the positions it still owns, and it may be split in two. Counts reported to the popup are counts of merged matches.
- **Cost.** A sweep over the match boundaries with a heap: O(n log n) in the number of matches.
- The ranking is a constant in `src/engine/merge.ts`. It is a judgement about which label is more useful when two apply, not a measured result; the corpus milestone may revise it.
