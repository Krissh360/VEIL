import { compile, digitsOf, NUMBER_END, NUMBER_START, scan, SEPARATOR } from './pattern';
import type { Detector, Match } from './types';
import { isValidLuhn } from './validators';

export interface CardIssuer {
  readonly name: string;
  /** Inclusive prefix ranges as [low, high] strings of equal length. */
  readonly prefixes: readonly (readonly [string, string])[];
  readonly lengths: readonly number[];
}

const from = (low: number, high: number): number[] =>
  Array.from({ length: high - low + 1 }, (_, i) => low + i);

/** Source and scope: decision 0015. */
export const CARD_ISSUERS: readonly CardIssuer[] = [
  { name: 'visa', prefixes: [['4', '4']], lengths: [13, 16, 19] },
  {
    name: 'mastercard',
    prefixes: [
      ['51', '55'],
      ['2221', '2720'],
    ],
    lengths: [16],
  },
  {
    name: 'amex',
    prefixes: [
      ['34', '34'],
      ['37', '37'],
    ],
    lengths: [15],
  },
  {
    name: 'discover',
    prefixes: [
      ['6011', '6011'],
      ['644', '649'],
      ['65', '65'],
    ],
    lengths: from(16, 19),
  },
  {
    name: 'diners',
    prefixes: [
      ['30', '30'],
      ['36', '36'],
      ['38', '39'],
    ],
    lengths: from(14, 19),
  },
  { name: 'jcb', prefixes: [['3528', '3589']], lengths: from(16, 19) },
  { name: 'unionpay', prefixes: [['62', '62']], lengths: from(16, 19) },
  {
    name: 'rupay',
    prefixes: [
      ['60', '60'],
      ['81', '82'],
      ['508', '508'],
    ],
    lengths: [16],
  },
  {
    name: 'maestro',
    prefixes: [
      ['5018', '5018'],
      ['5020', '5020'],
      ['5038', '5038'],
      ['5893', '5893'],
      ['6304', '6304'],
      ['6759', '6759'],
      ['6761', '6763'],
    ],
    lengths: from(13, 19),
  },
  { name: 'mir', prefixes: [['2200', '2204']], lengths: from(16, 19) },
];

/** How a number of each length is usually grouped when written with separators. */
export const CARD_LAYOUTS: Readonly<Record<number, readonly number[]>> = {
  13: [4, 4, 4, 1],
  14: [4, 6, 4],
  15: [4, 6, 5],
  16: [4, 4, 4, 4],
  17: [4, 4, 4, 4, 1],
  18: [4, 4, 4, 4, 2],
  19: [4, 4, 4, 4, 3],
};

function hasPlausibleIssuer(digits: string): boolean {
  return CARD_ISSUERS.some(
    (issuer) =>
      issuer.lengths.includes(digits.length) &&
      issuer.prefixes.some(([low, high]) => {
        const prefix = Number(digits.slice(0, low.length));
        return prefix >= Number(low) && prefix <= Number(high);
      }),
  );
}

// One pattern per layout rather than one alternation, so a number followed by something that
// looks like more digits (an expiry date, a CVV) can still match at its own length.
const BARE = compile(`${NUMBER_START}[0-9]{13,19}${NUMBER_END}`);
const GROUPED = Object.values(CARD_LAYOUTS).map((layout) => {
  const [first = 0, ...rest] = layout;
  // The first separator is captured in the head; every later one must repeat it.
  const tail = rest
    .map((size, index) => String.raw`${index === 0 ? '' : String.raw`\1`}[0-9]{${size}}`)
    .join('');
  return compile(String.raw`${NUMBER_START}[0-9]{${first}}(${SEPARATOR})${tail}${NUMBER_END}`);
});

const accept = (confidence: number) => (value: string) => {
  const digits = digitsOf(value);
  return isValidLuhn(digits) && hasPlausibleIssuer(digits) ? confidence : null;
};

// Keeps the longest of any overlapping hits so one number is reported once.
function withoutOverlaps(matches: Match[]): Match[] {
  const ordered = matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Match[] = [];
  for (const match of ordered) {
    const last = kept[kept.length - 1];
    if (!last || match.start >= last.end) kept.push(match);
  }
  return kept;
}

export const detectCard: Detector = (text) =>
  withoutOverlaps([
    ...scan(text, BARE, 'card', accept(0.8)),
    ...GROUPED.flatMap((pattern) => scan(text, pattern, 'card', accept(0.95))),
  ]);
