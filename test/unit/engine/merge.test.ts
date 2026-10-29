import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { KIND_SPECIFICITY, mergeMatches } from '../../../src/engine/merge';
import type { Kind, Match } from '../../../src/engine/types';

const m = (start: number, end: number, kind: Kind, confidence = 0.9): Match => ({
  start,
  end,
  kind,
  confidence,
});

describe('mergeMatches', () => {
  it('returns an empty list for no input and ignores empty ranges', () => {
    expect(mergeMatches([])).toEqual([]);
    expect(mergeMatches([m(3, 3, 'email'), m(5, 2, 'email')])).toEqual([]);
  });

  it('sorts matches that do not overlap', () => {
    expect(mergeMatches([m(10, 12, 'pan'), m(0, 4, 'email')])).toEqual([
      m(0, 4, 'email'),
      m(10, 12, 'pan'),
    ]);
  });

  it('keeps the more specific kind when one match contains another', () => {
    expect(mergeMatches([m(0, 19, 'card', 0.8), m(0, 12, 'aadhaar', 0.99)])).toEqual([
      m(0, 19, 'card', 0.8),
    ]);
    expect(mergeMatches([m(0, 12, 'phone', 0.99), m(0, 12, 'aadhaar', 0.5)])).toEqual([
      m(0, 12, 'aadhaar', 0.5),
    ]);
  });

  it('prefers a UPI ID over an email or phone shape on the same text', () => {
    expect(mergeMatches([m(0, 10, 'email'), m(0, 10, 'upi')])).toEqual([m(0, 10, 'upi')]);
    expect(mergeMatches([m(0, 10, 'phone', 0.99), m(0, 10, 'upi', 0.5)])).toEqual([
      m(0, 10, 'upi', 0.5),
    ]);
  });

  it('prefers higher confidence within one kind, then the longer match', () => {
    expect(mergeMatches([m(0, 10, 'phone', 0.6), m(0, 10, 'phone', 0.95)])).toEqual([
      m(0, 10, 'phone', 0.95),
    ]);
    expect(mergeMatches([m(0, 10, 'phone', 0.8), m(0, 14, 'phone', 0.8)])).toEqual([
      m(0, 14, 'phone', 0.8),
    ]);
  });

  it('keeps the uncovered part of a partly beaten match', () => {
    expect(mergeMatches([m(0, 10, 'card'), m(6, 16, 'email')])).toEqual([
      m(0, 10, 'card'),
      m(10, 16, 'email'),
    ]);
    expect(mergeMatches([m(5, 15, 'card'), m(0, 20, 'phone')])).toEqual([
      m(0, 5, 'phone'),
      m(5, 15, 'card'),
      m(15, 20, 'phone'),
    ]);
  });

  it('handles a chain of overlaps', () => {
    const merged = mergeMatches([m(0, 6, 'email'), m(4, 10, 'pan'), m(8, 14, 'card')]);
    expect(merged).toEqual([m(0, 4, 'email'), m(4, 8, 'pan'), m(8, 14, 'card')]);
  });

  it('lists every kind once in the specificity order', () => {
    expect(new Set(KIND_SPECIFICITY).size).toBe(KIND_SPECIFICITY.length);
    expect(KIND_SPECIFICITY).toHaveLength(8);
  });

  it('does not change its input', () => {
    const input = [m(6, 16, 'email'), m(0, 10, 'card')];
    const copy = input.map((match) => ({ ...match }));
    mergeMatches(input);
    expect(input).toEqual(copy);
  });
});

const kinds = fc.constantFrom(...KIND_SPECIFICITY);
const matchArb = fc
  .tuple(
    fc.integer({ min: 0, max: 200 }),
    fc.integer({ min: 1, max: 60 }),
    kinds,
    fc.double({ min: 0, max: 1, noNaN: true }),
  )
  .map(([start, length, kind, confidence]) => m(start, start + length, kind, confidence));

const positions = (matches: readonly Match[]): Set<number> => {
  const covered = new Set<number>();
  for (const match of matches) for (let i = match.start; i < match.end; i++) covered.add(i);
  return covered;
};

describe('mergeMatches properties', () => {
  it('covers exactly the same positions as its input', () => {
    fc.assert(
      fc.property(fc.array(matchArb, { maxLength: 40 }), (matches) => {
        expect(positions(mergeMatches(matches))).toEqual(positions(matches));
      }),
    );
  });

  it('returns a sorted list with no overlaps and no empty ranges', () => {
    fc.assert(
      fc.property(fc.array(matchArb, { maxLength: 40 }), (matches) => {
        const merged = mergeMatches(matches);
        for (let i = 0; i < merged.length; i++) {
          const match = merged[i] as Match;
          expect(match.end).toBeGreaterThan(match.start);
          const previous = merged[i - 1];
          if (previous) expect(match.start).toBeGreaterThanOrEqual(previous.end);
        }
      }),
    );
  });

  it('gives every position to the best match that covers it', () => {
    fc.assert(
      fc.property(fc.array(matchArb, { maxLength: 30 }), (matches) => {
        const rank = (kind: Kind): number => KIND_SPECIFICITY.indexOf(kind);
        for (const piece of mergeMatches(matches)) {
          for (let position = piece.start; position < piece.end; position++) {
            const covering = matches.filter((c) => c.start <= position && position < c.end);
            const best = Math.min(...covering.map((c) => rank(c.kind)));
            expect(rank(piece.kind)).toBe(best);
          }
        }
      }),
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.array(matchArb, { maxLength: 40 }), (matches) => {
        const once = mergeMatches(matches);
        expect(mergeMatches(once)).toEqual(once);
      }),
    );
  });
});
