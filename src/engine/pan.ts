import { compile, scan, TOKEN_END, TOKEN_START } from './pattern';
import type { Detector } from './types';

/** Allowed fourth characters, one per holder category. Source and status: decision 0014. */
export const PAN_HOLDER_CODES = 'ABCFGHJLPT';

// AAAHT0000A: three letters, the holder category, one letter, four digits, one check letter.
// The check letter has no public algorithm, so only the shape is validated. Capitals are the
// convention; lower case is accepted at lower confidence because people type it into forms.
const PAN = compile(
  `${TOKEN_START}[A-Za-z]{3}[${PAN_HOLDER_CODES}${PAN_HOLDER_CODES.toLowerCase()}][A-Za-z][0-9]{4}[A-Za-z]${TOKEN_END}`,
);

export const detectPan: Detector = (text) =>
  scan(text, PAN, 'pan', (value) => (value === value.toUpperCase() ? 0.9 : 0.6));
