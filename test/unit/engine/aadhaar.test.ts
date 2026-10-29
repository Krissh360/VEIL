import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { detectAadhaar } from '../../../src/engine/aadhaar';
import { verhoeffCheckDigit } from '../../../src/engine/validators';
import { covered } from './helpers';

// Generated with `npm run gen:fake`; random, so they can coincide with real numbers by chance.
const A = '259926749443';
const B = '5214 0372 1041';
const NBSP = String.fromCharCode(0xa0);
const grouped = (value: string, separator: string): string => value.replaceAll(' ', separator);

describe('detectAadhaar positives', () => {
  it.each([
    [A, A],
    [B, B],
    ['5214-0372-1041', '5214-0372-1041'],
    [grouped(B, NBSP), grouped(B, NBSP)],
    [`Aadhaar: ${A}`, A],
    [`(${A})`, A],
    [`${A}.`, A],
    [`${A}, ${B}`, A],
    [`id:\n${A}\nnext`, A],
    [`\t${B}\t`, B],
    [`${A}.\n`, A],
  ])('finds the number in %j', (text, expected) => {
    const found = covered(text, detectAadhaar(text));
    expect(found).toContain(expected);
  });

  it('reports exact offsets and no matched text', () => {
    const matches = detectAadhaar(`ab ${A} cd`);
    expect(matches).toEqual([{ start: 3, end: 15, kind: 'aadhaar', confidence: 0.75 }]);
  });

  it('trusts a grouped number more than a bare one', () => {
    expect(detectAadhaar(B)[0]?.confidence).toBeGreaterThan(detectAadhaar(A)[0]?.confidence ?? 1);
  });
});

describe('detectAadhaar negatives and near misses', () => {
  it.each([
    ['wrong check digit', '259926749440'],
    ['wrong check digit, grouped', '5214 0372 1040'],
    ['first digit 1', '159926749443'],
    ['first digit 0', '059926749443'],
    ['11 digits', '25992674944'],
    ['13 digits', '2599267494431'],
    ['16 digits', '2599267494432599'],
    ['letter before', 'A259926749443'],
    ['letter after', '259926749443Z'],
    ['underscore before', 'id_259926749443'],
    ['underscore after', '259926749443_1'],
    ['fraction digits after', '259926749443.55'],
    ['digit and dot before', '1.259926749443'],
    ['mixed separators', '5214 0372-1041'],
    ['double separator', '5214  0372  1041'],
    ['split by a line break', '5214\n0372\n1041'],
    ['split by a tab', '5214\t0372\t1041'],
    ['Devanagari digits', '२५९९२६७४९४४३'],
    ['fullwidth digits', '２５９９２６７４９４４３'],
    ['ASCII digits touching a Devanagari digit', '259926749443०'],
    ['timestamp', '2024-01-05 12:34:56'],
    ['order number', 'ORD-12345678'],
    ['version string', 'v12.4.1.3'],
    ['tracking id', '1Z999AA10123456784'],
  ])('ignores %s', (_label, text) => {
    expect(detectAadhaar(text)).toEqual([]);
  });
});

const validAadhaar = fc
  .tuple(
    fc.integer({ min: 2, max: 9 }),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 }),
  )
  .map(([first, rest]) => {
    const payload = `${first}${rest.join('')}`;
    return payload + String(verhoeffCheckDigit(payload));
  });

const group = (value: string, separator: string): string =>
  [value.slice(0, 4), value.slice(4, 8), value.slice(8)].join(separator);

describe('detectAadhaar properties', () => {
  it('detects every valid number, bare or grouped, inside surrounding text', () => {
    fc.assert(
      fc.property(validAadhaar, fc.constantFrom('', ' ', '-', NBSP), (value, separator) => {
        const written = group(value, separator);
        const text = `number: ${written}.`;
        const matches = detectAadhaar(text);
        expect(matches).toHaveLength(1);
        expect(matches[0]).toMatchObject({ start: 8, end: 8 + written.length, kind: 'aadhaar' });
      }),
    );
  });

  it('rejects a valid number with any one digit changed', () => {
    fc.assert(
      fc.property(
        validAadhaar,
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 9 }),
        fc.constantFrom('', ' '),
        (value, index, shift, separator) => {
          const changed = (Number(value[index]) + shift) % 10;
          const corrupted = `${value.slice(0, index)}${changed}${value.slice(index + 1)}`;
          expect(detectAadhaar(group(corrupted, separator))).toEqual([]);
        },
      ),
    );
  });
});
