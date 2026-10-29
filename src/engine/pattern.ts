import type { Kind, Match } from './types';

const WORD = String.raw`[\p{L}\p{N}_]`;

/** Between digit groups: a space, a no-break space or a hyphen. */
export const SEPARATOR = `[ ${String.fromCharCode(0xa0)}-]`;

// A number is rejected when it touches a letter, digit or underscore (in any script), or when
// it is one side of a decimal point. Line breaks, tabs and punctuation end a run.
export const NUMBER_START = String.raw`(?<!${WORD})(?<![0-9]\.)`;
export const NUMBER_END = String.raw`(?!${WORD})(?!\.[0-9])`;

export const TOKEN_START = String.raw`(?<!${WORD})`;
export const TOKEN_END = String.raw`(?!${WORD})`;

export function compile(source: string, extraFlags = ''): RegExp {
  return new RegExp(source, `gu${extraFlags}`);
}

export function digitsOf(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Runs `pattern` over `text` and keeps the hits that `confidence` accepts (a value from 0 to 1,
 * or null to reject). The matched text is passed to `confidence` and never leaves this call.
 */
export function scan(
  text: string,
  pattern: RegExp,
  kind: Kind,
  confidence: (value: string) => number | null,
): Match[] {
  const matches: Match[] = [];
  for (const hit of text.matchAll(pattern)) {
    const score = confidence(hit[0]);
    if (score !== null) {
      matches.push({ start: hit.index, end: hit.index + hit[0].length, kind, confidence: score });
    }
  }
  return matches;
}
