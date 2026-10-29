import { describe, expect, it } from 'vitest';
import {
  createRng,
  fakeAadhaar,
  fakeEmail,
  fakeLuhnNumber,
  fakePhone,
  PHONE_STYLES,
} from '../../scripts/lib/fake-data.ts';
import { isValidLuhn, isValidVerhoeff } from '../../src/engine/validators';

describe('fake data generator', () => {
  it('is fully determined by the seed', () => {
    const run = (seed: number): string[] => {
      const rng = createRng(seed);
      return [fakeAadhaar(rng), fakeEmail(rng), fakePhone(rng), fakeLuhnNumber(rng, '4', 16)];
    };
    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });

  it('makes Verhoeff-valid Aadhaar numbers that start with 2 to 9', () => {
    const rng = createRng(1);
    for (let i = 0; i < 500; i++) {
      const value = fakeAadhaar(rng);
      expect(value).toMatch(/^[2-9][0-9]{11}$/);
      expect(isValidVerhoeff(value)).toBe(true);
    }
  });

  it('groups an Aadhaar number 4-4-4 on request', () => {
    expect(fakeAadhaar(createRng(3), true)).toMatch(/^[2-9]\d{3} \d{4} \d{4}$/);
  });

  it('makes Luhn-valid numbers of the requested length', () => {
    const rng = createRng(2);
    for (let i = 0; i < 500; i++) {
      const value = fakeLuhnNumber(rng, '51', 16);
      expect(value).toHaveLength(16);
      expect(value.startsWith('51')).toBe(true);
      expect(isValidLuhn(value)).toBe(true);
    }
  });

  it('only uses reserved example domains for emails', () => {
    const rng = createRng(4);
    for (let i = 0; i < 200; i++) {
      expect(fakeEmail(rng)).toMatch(/@(?:mail\.)?(?:example\.(?:com|org|net)|corp\.test)$/);
    }
  });

  it('covers every phone style', () => {
    const rng = createRng(5);
    for (const style of PHONE_STYLES) expect(fakePhone(rng, style)).toMatch(/\d{4}/);
  });
});
