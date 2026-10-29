import { compile, digitsOf, NUMBER_END, NUMBER_START, scan, SEPARATOR } from './pattern';
import type { Detector } from './types';
import { isValidVerhoeff } from './validators';

// 12 digits, the first 2 to 9, bare or in groups of four with one consistent separator.
// The Verhoeff check removes about nine in ten look-alikes; a bare run is trusted less than
// a grouped one because plain 12-digit identifiers are common.
const AADHAAR = compile(
  String.raw`${NUMBER_START}[2-9][0-9]{3}(${SEPARATOR}?)[0-9]{4}\1[0-9]{4}${NUMBER_END}`,
);

export const detectAadhaar: Detector = (text) =>
  scan(text, AADHAAR, 'aadhaar', (value) => {
    if (!isValidVerhoeff(digitsOf(value))) return null;
    return value.length === 12 ? 0.75 : 0.9;
  });
