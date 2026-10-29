// Fake data for local tests only. Values are random but structurally valid, including
// check digits. A random checksum-valid number can coincide with a real person's number
// by chance, so never publish, share or paste these values as if they were fictional,
// and never replace them with real data.
import { PAN_HOLDER_CODES } from '../../src/engine/pan.ts';
import { luhnCheckDigit, verhoeffCheckDigit } from '../../src/engine/validators.ts';

export interface Rng {
  /** Integer in [0, max). */
  int(max: number): number;
  pick<T>(items: readonly T[]): T;
  digits(length: number): string;
}

// mulberry32: small, fast and fully determined by the seed.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number): number => Math.floor(next() * max);
  return {
    int,
    pick: <T>(items: readonly T[]): T => {
      const item = items[int(items.length)];
      if (item === undefined) throw new RangeError('pick from an empty list');
      return item;
    },
    digits: (length) => Array.from({ length }, () => int(10)).join(''),
  };
}

export function fakeAadhaar(rng: Rng, grouped = false): string {
  const payload = String(2 + rng.int(8)) + rng.digits(10);
  const value = payload + String(verhoeffCheckDigit(payload));
  return grouped ? `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8)}` : value;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function fakePan(rng: Rng): string {
  const letters = (count: number): string =>
    Array.from({ length: count }, () => LETTERS.charAt(rng.int(26))).join('');
  return `${letters(3)}${PAN_HOLDER_CODES.charAt(rng.int(PAN_HOLDER_CODES.length))}${letters(1)}${rng.digits(4)}${letters(1)}`;
}

/** A Luhn-valid number: `prefix` followed by random digits up to `length`, then the check digit. */
export function fakeLuhnNumber(rng: Rng, prefix: string, length: number): string {
  const payload = prefix + rng.digits(length - prefix.length - 1);
  return payload + String(luhnCheckDigit(payload));
}

const FIRST_NAMES = [
  'asha',
  'ravi',
  'meera',
  'dev',
  'isha',
  'kabir',
  'nila',
  'omar',
  'tara',
  'zane',
];
const LAST_NAMES = ['rao', 'iyer', 'khan', 'nair', 'shah', 'bose', 'das', 'mehta', 'pillai', 'roy'];
// Reserved by RFC 2606, so no real mailbox can exist on them.
const RESERVED_DOMAINS = ['example.com', 'example.org', 'mail.example.net', 'corp.test'];

export function fakeEmail(rng: Rng): string {
  const separator = rng.pick(['.', '_', '-']);
  const tag = rng.int(3) === 0 ? `+${rng.digits(2)}` : '';
  return `${rng.pick(FIRST_NAMES)}${separator}${rng.pick(LAST_NAMES)}${tag}@${rng.pick(RESERVED_DOMAINS)}`;
}

export type PhoneStyle =
  'in-bare' | 'in-grouped' | 'in-plus91' | 'in-trunk' | 'intl-uk' | 'intl-us';

export const PHONE_STYLES: readonly PhoneStyle[] = [
  'in-bare',
  'in-grouped',
  'in-plus91',
  'in-trunk',
  'intl-uk',
  'intl-us',
];

export function fakePhone(rng: Rng, style: PhoneStyle = rng.pick(PHONE_STYLES)): string {
  const mobile = String(6 + rng.int(4)) + rng.digits(9);
  switch (style) {
    case 'in-bare':
      return mobile;
    case 'in-grouped':
      return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    case 'in-plus91':
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    case 'in-trunk':
      return `0${mobile}`;
    // Ofcom reserves 020 7946 0xxx and the NANP reserves 555-0100 to 0199 for fiction.
    case 'intl-uk':
      return `+44 20 7946 0${rng.digits(3)}`;
    case 'intl-us':
      return `+1 ${rng.pick(['212', '415', '646'])} 555 01${rng.digits(2)}`;
  }
}
