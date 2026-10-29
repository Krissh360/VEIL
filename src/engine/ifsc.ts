import { compile, scan, TOKEN_END, TOKEN_START } from './pattern';
import type { Detector } from './types';

// Four letters for the bank, a literal zero reserved by the RBI, six characters for the branch.
// There is no checksum, so the shape is all there is to validate and any 11-character product
// or part code written the same way (PROD0123456) is a known false positive. Capitals are the
// convention; lower case is accepted at lower confidence.
const IFSC = compile(`${TOKEN_START}[A-Za-z]{4}0[A-Za-z0-9]{6}${TOKEN_END}`);

export const detectIfsc: Detector = (text) =>
  scan(text, IFSC, 'ifsc', (value) => (value === value.toUpperCase() ? 0.85 : 0.55));
