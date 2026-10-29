import { describe, expect, it } from 'vitest';
import {
  createRng,
  fakeAadhaar,
  fakeCard,
  fakeEmail,
  fakePan,
} from '../../../scripts/lib/fake-data.ts';
import { createDetect, detect, type Match } from '../../../src/engine/index';
import { covered } from './helpers';

const kinds = (matches: readonly Match[]): string[] => matches.map((match) => match.kind);

describe('detect', () => {
  it('finds each kind in a mixed line and returns them sorted', () => {
    const rng = createRng(11);
    const email = fakeEmail(rng);
    const aadhaar = fakeAadhaar(rng, true);
    const card = fakeCard(rng);
    const pan = fakePan(rng);
    const text = `${email} | ${aadhaar} | ${card} | ${pan} | asha@okaxis | SBIN0001234 | +91 98765 43210`;
    const matches = detect(text);
    expect(covered(text, matches)).toEqual([
      email,
      aadhaar,
      card,
      pan,
      'asha@okaxis',
      'SBIN0001234',
      '+91 98765 43210',
    ]);
    expect(kinds(matches)).toEqual(['email', 'aadhaar', 'card', 'pan', 'upi', 'ifsc', 'phone']);
  });

  it('finds secrets next to ordinary text', () => {
    const text = `deploy with AKIAIOSFODNN7EXAMPLE or api_key=k8Jx2LmQ9vTz4RbN7wYc1HpS5dGf3AeU today`;
    expect(covered(text, detect(text))).toEqual([
      'AKIAIOSFODNN7EXAMPLE',
      'k8Jx2LmQ9vTz4RbN7wYc1HpS5dGf3AeU',
    ]);
  });

  it('reports a number once, under the most specific kind', () => {
    const card = fakeCard(createRng(3));
    const matches = detect(`pay ${card} now`);
    expect(kinds(matches)).toEqual(['card']);
  });

  it('keeps a UPI ID and an email address apart', () => {
    const text = 'asha@ybl and asha@ybl.example.org';
    expect(kinds(detect(text))).toEqual(['upi', 'email']);
  });

  it('returns nothing for ordinary text and empty input', () => {
    expect(detect('')).toEqual([]);
    expect(detect('The meeting is at 10:30 on 2024-01-05; v1.2.3 ships in Q3.')).toEqual([]);
  });

  it('returns offsets only: no matched text anywhere in a result', () => {
    const rng = createRng(5);
    const text = `${fakeEmail(rng)} ${fakeCard(rng)} ${fakeAadhaar(rng)}`;
    const matches = detect(text);
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(Object.keys(match).sort()).toEqual(['confidence', 'end', 'kind', 'start']);
    }
    const serialised = JSON.stringify(matches);
    for (const word of text.split(' ')) expect(serialised).not.toContain(word);
  });

  it('does not change the text or depend on earlier calls', () => {
    const text = 'asha.rao@example.com';
    const first = detect(text);
    detect('4111 1111 1111 1111 9876543210');
    expect(detect(text)).toEqual(first);
    expect(text).toBe('asha.rao@example.com');
  });
});

describe('createDetect', () => {
  it('uses the UPI handles it is given', () => {
    const custom = createDetect({ upiHandles: ['mybank'] });
    expect(kinds(custom('asha@mybank'))).toEqual(['upi']);
    expect(custom('asha@ybl')).toEqual([]);
  });
});
