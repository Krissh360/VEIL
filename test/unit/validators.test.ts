import { describe, expect, it } from 'vitest';
import {
  isValidLuhn,
  isValidVerhoeff,
  luhnCheckDigit,
  verhoeffCheckDigit,
} from '../../src/engine/validators';

// Vectors: Wikipedia "Verhoeff algorithm" (2363, 123451, 1428570) and "Luhn algorithm" (79927398713),
// plus the published payment-network test numbers.
describe('verhoeff', () => {
  it.each(['2363', '123451', '1428570'])('accepts %s', (value) => {
    expect(isValidVerhoeff(value)).toBe(true);
  });

  it.each(['2364', '2373', '123452', '123541', '', '5', '23a3', '２３６３'])(
    'rejects %j',
    (value) => {
      expect(isValidVerhoeff(value)).toBe(false);
    },
  );

  it('detects a transposition of adjacent digits', () => {
    expect(isValidVerhoeff('2363')).toBe(true);
    expect(isValidVerhoeff('2336')).toBe(false);
  });

  it('computes the check digit of a payload', () => {
    expect(verhoeffCheckDigit('236')).toBe(3);
    expect(verhoeffCheckDigit('12345')).toBe(1);
  });

  it('refuses a payload that is not ASCII digits', () => {
    expect(() => verhoeffCheckDigit('12x')).toThrow(RangeError);
  });
});

describe('luhn', () => {
  it.each([
    '79927398713',
    '4111111111111111',
    '5555555555554444',
    '378282246310005',
    '6011111111111117',
  ])('accepts %s', (value) => {
    expect(isValidLuhn(value)).toBe(true);
  });

  it.each([
    '79927398710',
    '4111111111111112',
    '',
    '0',
    '4111x11111111111',
    '４１１１１１１１１１１１１１１１',
  ])('rejects %j', (value) => {
    expect(isValidLuhn(value)).toBe(false);
  });

  it('computes the check digit of a payload', () => {
    expect(luhnCheckDigit('7992739871')).toBe(3);
    expect(luhnCheckDigit('411111111111111')).toBe(1);
  });

  it('refuses a payload that is not ASCII digits', () => {
    expect(() => luhnCheckDigit('12x')).toThrow(RangeError);
  });
});
