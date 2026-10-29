import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { detectPan, PAN_HOLDER_CODES } from '../../../src/engine/pan';
import { covered } from './helpers';

// Shaped like the documented example format; not a real person's PAN.
const PAN = 'ABCPE1234F';

describe('detectPan positives', () => {
  it.each([
    [PAN, PAN],
    [`PAN: ${PAN}`, PAN],
    [`(${PAN})`, PAN],
    [`${PAN}.`, PAN],
    [`${PAN},ABCDE9999Z`, PAN],
    [`line\n${PAN}\nline`, PAN],
    ['AAACB1234C', 'AAACB1234C'],
    ['ZZZHZ0000Z', 'ZZZHZ0000Z'],
    ['abcpe1234f', 'abcpe1234f'],
    ['AbcPe1234F', 'AbcPe1234F'],
  ])('finds the PAN in %j', (text, expected) => {
    expect(covered(text, detectPan(text))).toContain(expected);
  });

  it('reports exact offsets and trusts capitals more than lower case', () => {
    expect(detectPan(`x ${PAN} y`)).toEqual([{ start: 2, end: 12, kind: 'pan', confidence: 0.9 }]);
    expect(detectPan(PAN.toLowerCase())[0]?.confidence).toBe(0.6);
  });
});

describe('detectPan negatives and near misses', () => {
  it.each([
    ['fourth letter D', 'ABCDE1234F'],
    ['fourth letter E', 'ABCEE1234F'],
    ['fourth letter Z', 'ABCZE1234F'],
    ['last char a digit', 'ABCPE12345'],
    ['too few digits', 'ABCPE123F'],
    ['too many digits', 'ABCPE12345F'],
    ['digit in the first five', 'AB1PE1234F'],
    ['letter after', 'ABCPE1234FG'],
    ['letter before', 'XABCPE1234F'],
    ['digit before', '9ABCPE1234F'],
    ['underscore before', 'id_ABCPE1234F'],
    ['underscore after', 'ABCPE1234F_9'],
    ['inside a hash', 'a3f9ABCPE1234F77c2'],
    ['separated by a space', 'ABCPE 1234F'],
    ['separated by a hyphen', 'ABCPE-1234F'],
    ['ten digits', '1234567890'],
    ['order number', 'ORDER-2024-0005'],
    ['version string', 'v1.2.3-rc.1'],
    ['Cyrillic look-alike letter', 'ABCPE1234Ғ'],
    ['long-s case fold', 'ABCPE1234ſ'],
  ])('ignores %s', (_label, text) => {
    expect(detectPan(text)).toEqual([]);
  });
});

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const letter = fc.constantFrom(...LETTERS.split(''));
const digits4 = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 4, maxLength: 4 });

const makePan = (a: string[], holder: string, fifth: string, d: number[], last: string): string =>
  `${a.join('')}${holder}${fifth}${d.join('')}${last}`;

describe('detectPan properties', () => {
  it('detects every well-formed PAN with an allowed holder letter', () => {
    fc.assert(
      fc.property(
        fc.array(letter, { minLength: 3, maxLength: 3 }),
        fc.constantFrom(...PAN_HOLDER_CODES.split('')),
        letter,
        digits4,
        letter,
        (a, holder, fifth, d, last) => {
          const value = makePan(a, holder, fifth, d, last);
          const matches = detectPan(`ref ${value}.`);
          expect(matches).toHaveLength(1);
          expect(matches[0]).toMatchObject({ start: 4, end: 14, kind: 'pan' });
        },
      ),
    );
  });

  it('rejects every PAN whose fourth letter is outside the allowed set', () => {
    const disallowed = LETTERS.split('').filter((l) => !PAN_HOLDER_CODES.includes(l));
    fc.assert(
      fc.property(
        fc.array(letter, { minLength: 3, maxLength: 3 }),
        fc.constantFrom(...disallowed),
        letter,
        digits4,
        letter,
        (a, holder, fifth, d, last) => {
          expect(detectPan(makePan(a, holder, fifth, d, last))).toEqual([]);
        },
      ),
    );
  });
});
