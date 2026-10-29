import { compile, NUMBER_END, NUMBER_START, scan, SEPARATOR } from './pattern';
import type { Detector, Match } from './types';

// Indian mobile: ten digits starting 6 to 9, bare or split 5-5, with an optional +91, 91 or 0
// in front. The prefix and the grouping both raise confidence because a bare ten-digit run is
// also what order numbers and tracking codes look like, which is the main false positive.
const INDIAN_MOBILE = compile(
  String.raw`${NUMBER_START}(?:(?:\+91|91|0)${SEPARATOR}?)?[6-9][0-9]{4}${SEPARATOR}?[0-9]{5}${NUMBER_END}`,
);

export const detectIndianMobile: Detector = (text) =>
  scan(text, INDIAN_MOBILE, 'phone', (value) => {
    if (value.startsWith('+')) return 0.95;
    return /^[6-9][0-9]{9}$/.test(value) ? 0.6 : 0.8;
  });

const WORD_CHAR = /[\p{L}\p{N}_]/u;
const DIGIT = /[0-9]/;
const GAP_CHARS = ` -.()${String.fromCharCode(0xa0)}`;

// E.164 allows at most 15 digits including the country code. Fewer than 8 is too short to be
// a number worth covering and would match prices and counters.
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;
const MAX_GAP = 2;

function inGap(char: string): boolean {
  return char !== '' && GAP_CHARS.includes(char);
}

// Starts at a "+" and walks forward by hand: digits, with at most two separator or bracket
// characters between digit groups. The walk is bounded by MAX_DIGITS, so it is linear overall.
function internationalAt(text: string, plus: number): Match | null {
  const before = text.charAt(plus - 1);
  if (
    plus > 0 &&
    (WORD_CHAR.test(before) || (before === '.' && DIGIT.test(text.charAt(plus - 2))))
  ) {
    return null;
  }
  if (!/[1-9]/.test(text.charAt(plus + 1))) return null;

  let digits = 0;
  let separators = 0;
  let end = plus + 1;
  let index = plus + 1;
  while (index < text.length) {
    if (DIGIT.test(text.charAt(index))) {
      digits++;
      index++;
      end = index;
      continue;
    }
    let gap = 0;
    while (gap < MAX_GAP && inGap(text.charAt(index + gap))) gap++;
    if (gap === 0 || !DIGIT.test(text.charAt(index + gap))) break;
    separators++;
    index += gap;
  }
  if (digits < MIN_DIGITS || digits > MAX_DIGITS) return null;
  if (
    WORD_CHAR.test(text.charAt(end)) ||
    (text.charAt(end) === '.' && DIGIT.test(text.charAt(end + 1)))
  ) {
    return null;
  }
  return { start: plus, end, kind: 'phone', confidence: separators > 0 ? 0.85 : 0.7 };
}

export const detectInternationalPhone: Detector = (text) => {
  const matches: Match[] = [];
  for (let plus = text.indexOf('+'); plus !== -1; plus = text.indexOf('+', plus + 1)) {
    const match = internationalAt(text, plus);
    if (match) matches.push(match);
  }
  return matches;
};

/** Indian mobile and international numbers; the two can report the same +91 number twice. */
export const detectPhone: Detector = (text) =>
  [...detectIndianMobile(text), ...detectInternationalPhone(text)].sort(
    (a, b) => a.start - b.start || b.end - a.end,
  );
