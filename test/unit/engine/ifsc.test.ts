import { describe, expect, it } from 'vitest';
import { detectIfsc } from '../../../src/engine/ifsc';
import { covered } from './helpers';

describe('detectIfsc positives', () => {
  it.each([
    ['SBIN0001234', 'SBIN0001234'],
    ['HDFC0000123', 'HDFC0000123'],
    ['ICIC0A12345', 'ICIC0A12345'],
    ['IFSC: SBIN0001234', 'SBIN0001234'],
    ['(SBIN0001234)', 'SBIN0001234'],
    ['SBIN0001234.', 'SBIN0001234'],
    ['a,SBIN0001234,b', 'SBIN0001234'],
    ['x\nSBIN0001234\ny', 'SBIN0001234'],
    ['sbin0001234', 'sbin0001234'],
  ])('finds the code in %j', (text, expected) => {
    expect(covered(text, detectIfsc(text))).toEqual([expected]);
  });

  it('reports exact offsets and trusts capitals more than lower case', () => {
    expect(detectIfsc('to SBIN0001234 now')).toEqual([
      { start: 3, end: 14, kind: 'ifsc', confidence: 0.85 },
    ]);
    expect(detectIfsc('sbin0001234')[0]?.confidence).toBe(0.55);
  });
});

describe('detectIfsc negatives and near misses', () => {
  it.each([
    ['fifth character not zero', 'SBIN1001234'],
    ['fifth character a letter', 'SBINO001234'],
    ['digit in the bank code', 'SB1N0001234'],
    ['ten characters', 'SBIN000123'],
    ['twelve characters', 'SBIN00012345'],
    ['symbol in the branch part', 'SBIN000123-'],
    ['letter before', 'XSBIN0001234'],
    ['digit before', '9SBIN0001234'],
    ['letter after', 'SBIN0001234Z'],
    ['underscore before', 'ref_SBIN0001234'],
    ['underscore after', 'SBIN0001234_1'],
    ['inside a hash', 'f3SBIN0001234a9'],
    ['split by a space', 'SBIN 0001234'],
    ['order number', 'ORD-2024-0005'],
    ['version string', 'v10.2.4-beta.1'],
    ['eleven digits', '12345678901'],
    ['timestamp', '2024-01-05T12:34:56Z'],
  ])('ignores %s', (_label, text) => {
    expect(detectIfsc(text)).toEqual([]);
  });

  it('documents a known false positive: an 11-character part code in the same shape', () => {
    expect(covered('PROD0123456', detectIfsc('PROD0123456'))).toEqual(['PROD0123456']);
  });
});
