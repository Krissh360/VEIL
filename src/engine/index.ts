import { detectAadhaar } from './aadhaar';
import { detectCard } from './card';
import { detectEmail } from './email';
import { detectIfsc } from './ifsc';
import { mergeMatches } from './merge';
import { detectPan } from './pan';
import { detectPhone } from './phone';
import { detectSecrets } from './secrets';
import type { Detector } from './types';
import { createUpiDetector, DEFAULT_UPI_HANDLES } from './upi';

export { classifyField } from './fields';
export type { FieldAttributes, FieldKind } from './fields';
export { mergeMatches } from './merge';
export type { Detector, Kind, Match } from './types';
export { DEFAULT_UPI_HANDLES } from './upi';

export interface EngineOptions {
  /** The part after the "@" that marks a UPI ID. Defaults to `DEFAULT_UPI_HANDLES`. */
  readonly upiHandles?: readonly string[];
}

/**
 * Builds the detection function: every detector over the text, overlaps resolved. It returns
 * offsets, kinds and confidences only; the text it was given is never copied into the result.
 */
export function createDetect(options: EngineOptions = {}): Detector {
  const detectors: readonly Detector[] = [
    detectCard,
    detectAadhaar,
    detectSecrets,
    detectPan,
    detectIfsc,
    createUpiDetector(options.upiHandles ?? DEFAULT_UPI_HANDLES),
    detectEmail,
    detectPhone,
  ];
  return (text) => mergeMatches(detectors.flatMap((detector) => detector(text)));
}

export const detect: Detector = createDetect();
