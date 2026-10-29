export type Kind = 'email' | 'phone' | 'aadhaar' | 'pan' | 'card' | 'ifsc' | 'upi' | 'secret';

/** Offsets only: the matched text is never part of a match. `end` is exclusive. */
export interface Match {
  readonly start: number;
  readonly end: number;
  readonly kind: Kind;
  readonly confidence: number;
}

export type Detector = (text: string) => Match[];
