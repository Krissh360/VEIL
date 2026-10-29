import type { Kind, Match } from './types';

/**
 * Most specific first. Kinds with a checksum or a fixed token format come before shape-only
 * ones, and a UPI ID comes before the email and phone shapes it can overlap. Decision 0018.
 */
export const KIND_SPECIFICITY: readonly Kind[] = [
  'card',
  'aadhaar',
  'secret',
  'pan',
  'ifsc',
  'upi',
  'email',
  'phone',
];

const RANK: ReadonlyMap<Kind, number> = new Map(
  KIND_SPECIFICITY.map((kind, index) => [kind, index]),
);

function rank(kind: Kind): number {
  return RANK.get(kind) ?? KIND_SPECIFICITY.length;
}

/** Negative when `a` should win over `b`. */
function compare(a: Match, b: Match): number {
  return (
    rank(a.kind) - rank(b.kind) ||
    b.confidence - a.confidence ||
    b.end - b.start - (a.end - a.start) ||
    a.start - b.start
  );
}

// Binary min-heap of matches ordered by `compare`. Entries whose range has ended are removed
// lazily when they reach the top.
class MatchHeap {
  private readonly items: Match[] = [];

  get top(): Match | undefined {
    return this.items[0];
  }

  push(match: Match): void {
    const items = this.items;
    items.push(match);
    let index = items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const above = items[parent];
      if (above === undefined || compare(match, above) >= 0) break;
      items[index] = above;
      index = parent;
    }
    items[index] = match;
  }

  pop(): void {
    const items = this.items;
    const last = items.pop();
    if (last === undefined || items.length === 0) return;
    let index = 0;
    for (;;) {
      const left = 2 * index + 1;
      if (left >= items.length) break;
      const right = left + 1;
      const leftItem = items[left];
      const rightItem = items[right];
      const child =
        rightItem !== undefined && leftItem !== undefined && compare(rightItem, leftItem) < 0
          ? right
          : left;
      const childItem = items[child];
      if (childItem === undefined || compare(last, childItem) <= 0) break;
      items[index] = childItem;
      index = child;
    }
    items[index] = last;
  }
}

/**
 * Resolves overlapping matches into a sorted, non-overlapping list. Every position goes to the
 * best match that covers it (most specific kind, then higher confidence, then longer). A
 * match that is only partly beaten keeps the part that no winner covers, so the set of covered
 * positions is exactly the union of the input and nothing becomes uncovered by merging.
 */
export function mergeMatches(matches: readonly Match[]): Match[] {
  const valid = matches
    .filter((match) => match.end > match.start)
    .sort((a, b) => a.start - b.start);
  if (valid.length === 0) return [];

  const points = [...new Set(valid.flatMap((match) => [match.start, match.end]))].sort(
    (a, b) => a - b,
  );
  const active = new MatchHeap();
  const merged: Match[] = [];
  let next = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    if (from === undefined || to === undefined) continue;

    for (let match = valid[next]; match !== undefined && match.start <= from; match = valid[next]) {
      active.push(match);
      next++;
    }
    while (active.top !== undefined && active.top.end <= from) active.pop();

    const winner = active.top;
    if (winner === undefined) continue;
    const previous = merged[merged.length - 1];
    if (previous && previous.end === from && sameMatch(previous, winner)) {
      merged[merged.length - 1] = { ...previous, end: to };
    } else {
      merged.push({ start: from, end: to, kind: winner.kind, confidence: winner.confidence });
    }
  }
  return merged;
}

function sameMatch(piece: Match, source: Match): boolean {
  return piece.kind === source.kind && piece.confidence === source.confidence;
}
