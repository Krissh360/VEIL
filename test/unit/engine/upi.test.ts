import { describe, expect, it } from 'vitest';
import { detectEmail } from '../../../src/engine/email';
import { createUpiDetector, DEFAULT_UPI_HANDLES, detectUpi } from '../../../src/engine/upi';
import { covered } from './helpers';

describe('detectUpi positives', () => {
  it.each([
    ['asha@okaxis', 'asha@okaxis'],
    ['asha.rao@oksbi', 'asha.rao@oksbi'],
    ['9876543210@ybl', '9876543210@ybl'],
    ['asha_rao-1@paytm', 'asha_rao-1@paytm'],
    ['ASHA@OKICICI', 'ASHA@OKICICI'],
    ['pay asha@ybl now', 'asha@ybl'],
    ['pay asha@ybl.', 'asha@ybl'],
    ['(asha@ybl)', 'asha@ybl'],
    ['asha@ybl, ravi@ibl', 'asha@ybl'],
    ['upi id:\nasha@upi\n', 'asha@upi'],
    ['asha@hdfcbank', 'asha@hdfcbank'],
    ['asha@ybl-', 'asha@ybl'],
  ])('finds the ID in %j', (text, expected) => {
    expect(covered(text, detectUpi(text))).toContain(expected);
  });

  it('reports exact offsets', () => {
    expect(detectUpi('to asha@ybl ok')).toEqual([
      { start: 3, end: 11, kind: 'upi', confidence: 0.85 },
    ]);
  });
});

describe('detectUpi negatives and near misses', () => {
  it.each([
    ['unknown handle', 'asha@nothandle'],
    ['email domain on a handle name', 'asha@paytm.com'],
    ['email domain with a subdomain', 'asha@ybl.example.org'],
    ['hyphenated domain on a handle name', 'asha@sbi-bank.com'],
    ['handle followed by letters', 'asha@yblx'],
    ['handle followed by an underscore', 'asha@ybl_x'],
    ['handle followed by a second at sign', 'asha@ybl@x'],
    ['one-character local part', 'a@ybl'],
    ['empty local part', '@ybl'],
    ['no handle', 'asha@'],
    ['space around the at sign', 'asha @ybl'],
    ['letter-adjacent non-ASCII before the name', 'éasha@ybl'],
    ['plain email address', 'asha@example.com'],
    ['social handle', '@ybl'],
  ])('ignores %s', (_label, text) => {
    expect(detectUpi(text)).toEqual([]);
  });

  it('documents a known false positive: prose that uses a handle word', () => {
    expect(covered('meet@sbi', detectUpi('meet@sbi'))).toEqual(['meet@sbi']);
  });
});

describe('UPI and email disambiguation', () => {
  it.each(['asha@okaxis', 'asha@ybl', '9876543210@paytm'])('%s is UPI only', (text) => {
    expect(detectUpi(text)).toHaveLength(1);
    expect(detectEmail(text)).toEqual([]);
  });

  it.each(['asha@paytm.com', 'asha@ybl.in', 'rao@sbi.co.in'])('%s is email only', (text) => {
    expect(detectEmail(text)).toHaveLength(1);
    expect(detectUpi(text)).toEqual([]);
  });
});

describe('createUpiDetector', () => {
  it('uses only the handles it is given, case-insensitively', () => {
    const detect = createUpiDetector(['MyBank']);
    expect(covered('a1@mybank and a1@ybl', detect('a1@mybank and a1@ybl'))).toEqual(['a1@mybank']);
  });

  it('accepts an empty list and then finds nothing', () => {
    expect(createUpiDetector([])('asha@ybl')).toEqual([]);
  });

  it('ships a default list with no duplicates and only lower-case ASCII', () => {
    expect(new Set(DEFAULT_UPI_HANDLES).size).toBe(DEFAULT_UPI_HANDLES.length);
    expect(DEFAULT_UPI_HANDLES.every((handle) => /^[a-z0-9]+$/.test(handle))).toBe(true);
  });
});
