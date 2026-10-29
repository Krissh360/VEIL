import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng, fakeCard } from '../../../scripts/lib/fake-data.ts';
import { CARD_ISSUERS, CARD_LAYOUTS, detectCard } from '../../../src/engine/card';
import { luhnCheckDigit } from '../../../src/engine/validators';
import { covered } from './helpers';

const NBSP = String.fromCharCode(0xa0);

// Public test numbers published by the card networks and payment processors.
const VISA = '4111111111111111';
const VISA_13 = '4222222222222';
const MASTERCARD = '5555555555554444';
const MASTERCARD_2 = '2223000048400011';
const AMEX = '378282246310005';
const DISCOVER = '6011111111111117';
const JCB = '3530111333300000';
const DINERS = '30569309025904';
const UNIONPAY = '6200000000000005';

const group = (digits: string, separator: string): string => {
  const layout = CARD_LAYOUTS[digits.length] ?? [];
  let offset = 0;
  return layout
    .map((size) => {
      const part = digits.slice(offset, offset + size);
      offset += size;
      return part;
    })
    .join(separator);
};

const withCheck = (payload: string): string => payload + String(luhnCheckDigit(payload));

describe('detectCard positives', () => {
  it.each([
    VISA,
    VISA_13,
    MASTERCARD,
    MASTERCARD_2,
    AMEX,
    DISCOVER,
    JCB,
    DINERS,
    UNIONPAY,
    group(VISA, ' '),
    group(VISA, '-'),
    group(VISA, NBSP),
    group(AMEX, ' '),
    group(DINERS, ' '),
    group(VISA_13, ' '),
  ])('finds %j', (card) => {
    const text = `Card: ${card}.`;
    expect(covered(text, detectCard(text))).toEqual([card]);
  });

  it.each([
    `(${VISA})`,
    `${VISA}, exp 12/25`,
    `${VISA}\n`,
    `\t${VISA}\t`,
    `${group(VISA, ' ')} 12/25`,
    `${group(VISA, ' ')} 123`,
    `${group(VISA, ' ')}  12/25`,
  ])('finds the card in %j', (text) => {
    const found = covered(text, detectCard(text));
    expect(found.some((value) => value.replace(/[^0-9]/g, '') === VISA)).toBe(true);
  });

  it('reports exact offsets and trusts a grouped number more than a bare one', () => {
    expect(detectCard(`x ${VISA} y`)).toEqual([
      { start: 2, end: 18, kind: 'card', confidence: 0.8 },
    ]);
    expect(detectCard(group(VISA, ' '))[0]?.confidence).toBe(0.95);
  });

  it('reports one match for a number that fits two layouts', () => {
    expect(detectCard(`${group(VISA, ' ')} 123`)).toHaveLength(1);
  });
});

describe('detectCard negatives and near misses', () => {
  const noIssuer = withCheck('99999999999999');
  it.each([
    ['wrong check digit', '4111111111111112'],
    ['wrong check digit, grouped', '4111 1111 1111 1112'],
    ['no plausible issuer', noIssuer],
    ['Visa with a length no Visa has', withCheck('41111111111111')],
    ['Amex prefix with a Visa length', withCheck('341111111111111')],
    ['12 digits', withCheck('41111111111')],
    ['20 digits', withCheck('4111111111111111111')],
    ['letter before', `A${VISA}`],
    ['letter after', `${VISA}Z`],
    ['underscore before', `ref_${VISA}`],
    ['digit run longer than a card', `${VISA}${VISA}`],
    ['fraction digits after', `${VISA}.50`],
    ['digit and dot before', `1.${VISA}`],
    ['mixed separators', '4111 1111-1111 1111'],
    ['double separators', '4111  1111  1111  1111'],
    ['wrong grouping', '41111 1111 1111 111'],
    ['split by a line break', '4111\n1111\n1111\n1111'],
    ['split by a tab', '4111\t1111\t1111\t1111'],
    ['fullwidth digits', '４１１１１１１１１１１１１１１１１'],
    ['epoch milliseconds', '1700000000000'],
    ['ISBN-13', '9780306406157'],
    ['timestamp', '20240105123456'],
    ['phone number', '+91 98765 43210'],
    ['tracking id', '1Z999AA10123456784'],
  ])('ignores %s', (_label, text) => {
    expect(detectCard(text)).toEqual([]);
  });
});

const issuer = fc.constantFrom(...CARD_ISSUERS);
const seed = fc.integer({ min: 0, max: 2 ** 31 - 1 });

describe('detectCard properties', () => {
  it('detects a valid number for every issuer, bare and grouped', () => {
    fc.assert(
      fc.property(issuer, seed, fc.constantFrom('', ' ', '-', NBSP), (chosen, value, separator) => {
        const digits = fakeCard(createRng(value), chosen);
        const written = separator === '' ? digits : group(digits, separator);
        const text = `paid with ${written}.`;
        const matches = detectCard(text);
        expect(matches).toHaveLength(1);
        expect(matches[0]).toMatchObject({ start: 10, end: 10 + written.length, kind: 'card' });
      }),
    );
  });

  // A shorter run of groups inside a corrupted number can be a valid card of its own (a card
  // followed by an expiry date is the case this allows), so the claim is about the whole number.
  it('does not detect a valid number with any one digit changed as a whole', () => {
    fc.assert(
      fc.property(
        issuer,
        seed,
        fc.nat(),
        fc.integer({ min: 1, max: 9 }),
        fc.constantFrom('', ' '),
        (chosen, value, position, shift, separator) => {
          const digits = fakeCard(createRng(value), chosen);
          const index = position % digits.length;
          const changed = (Number(digits[index]) + shift) % 10;
          const corrupted = `${digits.slice(0, index)}${changed}${digits.slice(index + 1)}`;
          const written = separator === '' ? corrupted : group(corrupted, separator);
          const wholes = detectCard(written).filter(
            (match) => match.start === 0 && match.end === written.length,
          );
          expect(wholes).toEqual([]);
        },
      ),
    );
  });
});
