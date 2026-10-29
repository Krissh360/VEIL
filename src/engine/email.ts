import type { Detector, Match } from './types';

const LOCAL_CHAR = /[\p{L}\p{N}\p{M}_.%+-]/u;
const DOMAIN_CHAR = /[\p{L}\p{N}\p{M}.-]/u;
const WORD_CHAR = /[\p{L}\p{N}_]/u;
const LETTERS = /^\p{L}{2,}$/u;
const LABEL = /^[\p{L}\p{N}\p{M}]([\p{L}\p{N}\p{M}-]*[\p{L}\p{N}\p{M}])?$/u;

// RFC 5321 limits. A longer local part is covered by its last MAX_LOCAL characters rather than
// rejected, so an over-long address is never left fully uncovered.
const MAX_LOCAL = 64;
const MAX_DOMAIN = 255;

function charAt(text: string, index: number): string {
  return text.charAt(index);
}

function isValidDomain(domain: string): boolean {
  const labels = domain.split('.');
  const tld = labels[labels.length - 1] ?? '';
  return (
    labels.length >= 2 &&
    LETTERS.test(tld) &&
    labels.every((label) => label.length <= 63 && LABEL.test(label))
  );
}

// Anchored on each "@" and expanded by hand instead of one regular expression, so the work is
// bounded by MAX_LOCAL + MAX_DOMAIN per "@" whatever the surrounding text looks like.
function emailAround(text: string, at: number): Match | null {
  let start = at;
  while (start > 0 && at - start < MAX_LOCAL && LOCAL_CHAR.test(charAt(text, start - 1))) start--;
  while (start < at && /[.%+-]/.test(charAt(text, start))) start++;
  if (start === at || charAt(text, at - 1) === '.') return null;

  let end = at + 1;
  while (end < text.length && end - at <= MAX_DOMAIN && DOMAIN_CHAR.test(charAt(text, end))) {
    end++;
  }
  const reachedCap = end < text.length && DOMAIN_CHAR.test(charAt(text, end));
  while (end > at + 1 && /[.-]/.test(charAt(text, end - 1))) end--;
  if (reachedCap || !isValidDomain(text.slice(at + 1, end))) return null;

  const next = charAt(text, end);
  if (next === '@' || (next !== '' && WORD_CHAR.test(next))) return null;
  return { start, end, kind: 'email', confidence: 0.9 };
}

export const detectEmail: Detector = (text) => {
  const matches: Match[] = [];
  for (let at = text.indexOf('@'); at !== -1; at = text.indexOf('@', at + 1)) {
    const match = emailAround(text, at);
    if (match) matches.push(match);
  }
  return matches;
};
