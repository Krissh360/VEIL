import type { Kind } from './types';

/** What a whole form field is covered as. Detector kinds, plus two that only fields have. */
export type FieldKind = Kind | 'password' | 'otp';

/** The attributes of a form control, copied out of the DOM by the caller. */
export interface FieldAttributes {
  readonly type?: string | undefined;
  readonly autocomplete?: string | undefined;
  readonly name?: string | undefined;
  readonly id?: string | undefined;
  /** The text of the control's label, placeholder or aria-label. */
  readonly label?: string | undefined;
}

const AUTOCOMPLETE_KINDS: ReadonlyMap<string, FieldKind> = new Map([
  ['current-password', 'password'],
  ['new-password', 'password'],
  ['one-time-code', 'otp'],
  ['cc-number', 'card'],
  ['cc-csc', 'card'],
  ['email', 'email'],
  ['tel', 'phone'],
  ['tel-national', 'phone'],
  ['tel-local', 'phone'],
]);

const TYPE_KINDS: ReadonlyMap<string, FieldKind> = new Map([
  ['password', 'password'],
  ['email', 'email'],
  ['tel', 'phone'],
]);

// Checked in this order, so "one-time password" is an otp and not a password.
const HINTS: readonly (readonly [FieldKind, readonly (readonly string[])[]])[] = [
  [
    'otp',
    [
      ['otp'],
      ['totp'],
      ['2fa'],
      ['mfa'],
      ['one', 'time', 'password'],
      ['one', 'time', 'code'],
      ['onetimecode'],
      ['verification', 'code'],
    ],
  ],
  ['password', [['password'], ['passwd'], ['pwd'], ['passphrase']]],
  [
    'card',
    [
      ['cvv'],
      ['cvc'],
      ['csc'],
      ['cvn'],
      ['security', 'code'],
      ['card', 'number'],
      ['card', 'no'],
      ['card', 'num'],
      ['cardnumber'],
      ['ccnumber'],
      ['ccnum'],
      ['cc', 'number'],
      ['credit', 'card'],
      ['debit', 'card'],
    ],
  ],
  ['aadhaar', [['aadhaar'], ['aadhar'], ['uidai']]],
  [
    'pan',
    [
      ['pan', 'number'],
      ['pan', 'no'],
      ['pan', 'card'],
      ['permanent', 'account', 'number'],
    ],
  ],
  ['ifsc', [['ifsc']]],
  ['upi', [['upi'], ['vpa']]],
  [
    'secret',
    [
      ['apikey'],
      ['api', 'key'],
      ['secret', 'key'],
      ['client', 'secret'],
      ['secret'],
      ['access', 'token'],
      ['auth', 'token'],
      ['api', 'token'],
    ],
  ],
  ['email', [['email'], ['e', 'mail']]],
  ['phone', [['phone'], ['mobile'], ['telephone'], ['tel'], ['msisdn']]],
];

const MAX_HINT_LENGTH = 200;

function tokenize(source: string | undefined): string[] {
  if (!source) return [];
  return source
    .slice(0, MAX_HINT_LENGTH)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token !== '');
}

function containsRun(tokens: readonly string[], run: readonly string[]): boolean {
  for (let start = 0; start + run.length <= tokens.length; start++) {
    if (run.every((word, offset) => tokens[start + offset] === word)) return true;
  }
  return false;
}

function fromHints(tokens: readonly string[]): FieldKind | null {
  for (const [kind, runs] of HINTS) {
    if (runs.some((run) => containsRun(tokens, run))) return kind;
  }
  // A field called just "pan" is a PAN; "pan" next to other words is far more often a verb or a
  // place name, so it needs one of the longer forms above.
  return tokens.length === 1 && tokens[0] === 'pan' ? 'pan' : null;
}

/**
 * Maps a form control's attributes to the kind of value it holds, or null when nothing marks it
 * as sensitive. Explicit signals win in this order: autocomplete tokens, the input type, then
 * the words in the name, id and label. Pure and DOM-free so the caller decides how to read the
 * attributes.
 */
export function classifyField(attributes: FieldAttributes): FieldKind | null {
  for (const token of (attributes.autocomplete ?? '').toLowerCase().split(/\s+/)) {
    const kind = AUTOCOMPLETE_KINDS.get(token);
    if (kind) return kind;
  }
  const typeKind = TYPE_KINDS.get((attributes.type ?? '').trim().toLowerCase());
  if (typeKind) return typeKind;
  for (const source of [attributes.name, attributes.id, attributes.label]) {
    const kind = fromHints(tokenize(source));
    if (kind) return kind;
  }
  return null;
}
