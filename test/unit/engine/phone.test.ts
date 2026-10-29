import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng, fakePhone, PHONE_STYLES } from '../../../scripts/lib/fake-data.ts';
import {
  detectIndianMobile,
  detectInternationalPhone,
  detectPhone,
} from '../../../src/engine/phone';
import { covered } from './helpers';

const NBSP = String.fromCharCode(0xa0);

describe('detectIndianMobile positives', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['6000000000', '6000000000'],
    ['98765 43210', '98765 43210'],
    ['98765-43210', '98765-43210'],
    [`98765${NBSP}43210`, `98765${NBSP}43210`],
    ['+91 98765 43210', '+91 98765 43210'],
    ['+91-9876543210', '+91-9876543210'],
    ['+919876543210', '+919876543210'],
    ['91 9876543210', '91 9876543210'],
    ['919876543210', '919876543210'],
    ['09876543210', '09876543210'],
    ['0 98765 43210', '0 98765 43210'],
    ['Call 9876543210.', '9876543210'],
    ['(9876543210)', '9876543210'],
    ['9876543210,9876543211', '9876543210'],
    ['tel:\n9876543210\n', '9876543210'],
  ])('finds the number in %j', (text, expected) => {
    expect(covered(text, detectIndianMobile(text))).toContain(expected);
  });

  it('reports exact offsets and ranks forms by confidence', () => {
    expect(detectIndianMobile('x 9876543210 y')).toEqual([
      { start: 2, end: 12, kind: 'phone', confidence: 0.6 },
    ]);
    expect(detectIndianMobile('98765 43210')[0]?.confidence).toBe(0.8);
    expect(detectIndianMobile('09876543210')[0]?.confidence).toBe(0.8);
    expect(detectIndianMobile('+91 9876543210')[0]?.confidence).toBe(0.95);
  });
});

describe('detectIndianMobile negatives and near misses', () => {
  it.each([
    ['first digit 5', '5876543210'],
    ['first digit 1', '1876543210'],
    ['nine digits', '987654321'],
    ['thirteen digits', '9876543210123'],
    ['letter before', 'A9876543210'],
    ['letter after', '9876543210Z'],
    ['underscore before', 'id_9876543210'],
    ['fraction digits after', '9876543210.55'],
    ['digit and dot before', '3.9876543210'],
    ['split in the wrong place', '9876 543210'],
    ['split by a line break', '98765\n43210'],
    ['epoch seconds', '1700000000'],
    ['epoch milliseconds', '1700000000000'],
    ['timestamp', '2024-01-05 12:34:56'],
    ['date', '05/01/2024'],
    ['version string', 'v9.8.7.6'],
    ['tracking id', '1Z999AA10123456784'],
    ['card number', '4111 1111 1111 1111'],
    ['fullwidth digits', '９８７６５４３２１０'],
    ['Devanagari digits', '९८७६५४३२१०'],
  ])('ignores %s', (_label, text) => {
    expect(detectIndianMobile(text)).toEqual([]);
  });

  it('documents a known false positive: a ten-digit order number starting 6 to 9', () => {
    expect(covered('ORD-9876543210', detectIndianMobile('ORD-9876543210'))).toEqual(['9876543210']);
  });
});

describe('detectInternationalPhone positives', () => {
  it.each([
    ['+44 20 7946 0958', '+44 20 7946 0958'],
    ['+1 (415) 555-0132', '+1 (415) 555-0132'],
    ['+1-415-555-0132', '+1-415-555-0132'],
    ['+1.415.555.0132', '+1.415.555.0132'],
    ['+14155550132', '+14155550132'],
    ['+49 30 123456', '+49 30 123456'],
    [`+44${NBSP}20${NBSP}7946${NBSP}0958`, `+44${NBSP}20${NBSP}7946${NBSP}0958`],
    ['Call +44 20 7946 0958.', '+44 20 7946 0958'],
    ['(+44 20 7946 0958)', '+44 20 7946 0958'],
    ['+44 20 7946 0958, +1 415 555 0132', '+44 20 7946 0958'],
    ['++14155550132', '+14155550132'],
    ['+123456789012345', '+123456789012345'],
  ])('finds the number in %j', (text, expected) => {
    expect(covered(text, detectInternationalPhone(text))).toContain(expected);
  });

  it('reports exact offsets and trusts a grouped number more', () => {
    expect(detectInternationalPhone('at +44 20 7946 0958 ok')).toEqual([
      { start: 3, end: 19, kind: 'phone', confidence: 0.85 },
    ]);
    expect(detectInternationalPhone('+14155550132')[0]?.confidence).toBe(0.7);
  });
});

describe('detectInternationalPhone negatives and near misses', () => {
  it.each([
    ['no plus sign', '44 20 7946 0958'],
    ['too few digits', '+1 2 3'],
    ['seven digits', '+1234567'],
    ['country code 0', '+0123456789'],
    ['sixteen digits', '+1234567890123456'],
    ['digits run on past fifteen', '+44 20 7946 0958 12345678'],
    ['letter before the plus', 'x+14155550132'],
    ['digit before the plus', '1+14155550132'],
    ['letter after', '+14155550132x'],
    ['underscore after', '+14155550132_1'],
    ['price', '+12.50'],
    ['plus without digits', '+ 14155550132'],
    ['three-character gap', '+1   4155550132'],
    ['split by a line break', '+44 20\n7946 0958'],
  ])('ignores %s', (_label, text) => {
    expect(detectInternationalPhone(text)).toEqual([]);
  });
});

describe('detectPhone', () => {
  it('returns both detectors in order, so a +91 number may appear twice', () => {
    const matches = detectPhone('+91 98765 43210');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.every((match) => match.kind === 'phone')).toBe(true);
    expect(matches.map((match) => match.start)).toEqual(
      [...matches.map((m) => m.start)].sort((a, b) => a - b),
    );
  });
});

describe('phone properties', () => {
  it('detects every generated number of every style inside surrounding text', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.constantFrom(...PHONE_STYLES),
        (seed, style) => {
          const number = fakePhone(createRng(seed), style);
          const text = `reach me on ${number}.`;
          const start = 12;
          expect(
            detectPhone(text).some(
              (match) => match.start === start && match.end === start + number.length,
            ),
          ).toBe(true);
        },
      ),
    );
  });
});
