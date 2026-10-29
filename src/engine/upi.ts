import type { Detector, Match } from './types';

/** Handles and how far each was verified: decision 0016. */
export const DEFAULT_UPI_HANDLES: readonly string[] = [
  'okaxis',
  'okicici',
  'okhdfcbank',
  'oksbi',
  'ybl',
  'ibl',
  'axl',
  'apl',
  'upi',
  'paytm',
  'kotak',
  'icici',
  'hdfcbank',
  'sbi',
  'axisbank',
  'yesbank',
  'yesbankltd',
  'fbl',
  'federal',
  'idfcbank',
  'idbi',
  'kvb',
  'dbs',
  'dlb',
  'esaf',
  'jkb',
  'kbl',
  'lvb',
  'mahb',
  'nsdl',
  'pnb',
  'airtel',
  'psb',
  'bob',
  'rbl',
  'boi',
  'saraswat',
  'cbi',
  'scb',
  'citi',
  'sib',
  'cnrb',
  'tjsb',
  'corporation',
  'ubi',
  'dena',
  'ucb',
  'equitas',
  'fino',
  'vijb',
  'hsbc',
  'ikwik',
];

const LOCAL_CHAR = /[A-Za-z0-9._-]/;
const HANDLE_CHAR = /[A-Za-z0-9]/;
const ALNUM = /[A-Za-z0-9]/;
const WORD_CHAR = /[\p{L}\p{N}_]/u;

const MIN_LOCAL = 2;
const MAX_LOCAL = 64;
const MAX_HANDLE = 32;

function upiAround(text: string, at: number, handles: ReadonlySet<string>): Match | null {
  let start = at;
  while (start > 0 && at - start < MAX_LOCAL && LOCAL_CHAR.test(text.charAt(start - 1))) start--;
  while (start < at && !ALNUM.test(text.charAt(start))) start++;
  if (at - start < MIN_LOCAL) return null;
  if (start > 0 && WORD_CHAR.test(text.charAt(start - 1)) && at - start < MAX_LOCAL) return null;

  let end = at + 1;
  while (end < text.length && end - at <= MAX_HANDLE && HANDLE_CHAR.test(text.charAt(end))) end++;
  if (!handles.has(text.slice(at + 1, end).toLowerCase())) return null;

  // A dot or hyphen followed by more name means the handle is the start of a domain, which is
  // an email address, not a UPI ID.
  const next = text.charAt(end);
  const after = text.charAt(end + 1);
  if (WORD_CHAR.test(next) || next === '@') return null;
  if ((next === '.' || next === '-') && WORD_CHAR.test(after)) return null;
  return { start, end, kind: 'upi', confidence: 0.85 };
}

/**
 * Builds a UPI detector for a given set of handles (the part after the "@"). Matching is case
 * insensitive. Only these handles are accepted, which is what keeps `name@handle` apart from
 * the many other things written with an at sign.
 */
export function createUpiDetector(handles: readonly string[]): Detector {
  const known = new Set(handles.map((handle) => handle.toLowerCase()));
  return (text) => {
    const matches: Match[] = [];
    for (let at = text.indexOf('@'); at !== -1; at = text.indexOf('@', at + 1)) {
      const match = upiAround(text, at, known);
      if (match) matches.push(match);
    }
    return matches;
  };
}

export const detectUpi: Detector = createUpiDetector(DEFAULT_UPI_HANDLES);
