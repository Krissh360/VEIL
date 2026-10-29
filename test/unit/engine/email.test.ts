import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng, fakeEmail } from '../../../scripts/lib/fake-data.ts';
import { detectEmail } from '../../../src/engine/email';
import { covered } from './helpers';

describe('detectEmail positives', () => {
  it.each([
    ['asha.rao@example.com', 'asha.rao@example.com'],
    ['a@b.co', 'a@b.co'],
    ['first+tag@example.org', 'first+tag@example.org'],
    ['under_score@mail.example.net', 'under_score@mail.example.net'],
    ['dash-name@corp-name.test', 'dash-name@corp-name.test'],
    ['UPPER@EXAMPLE.COM', 'UPPER@EXAMPLE.COM'],
    ['x@a.b.c.example.com', 'x@a.b.c.example.com'],
    ['digits123@example.com', 'digits123@example.com'],
    ['<asha@example.com>', 'asha@example.com'],
    ['mailto:asha@example.com', 'asha@example.com'],
    ['"asha@example.com"', 'asha@example.com'],
    ['mail asha@example.com.', 'asha@example.com'],
    ['asha@example.com, ravi@example.org', 'asha@example.com'],
    ['(asha@example.com)', 'asha@example.com'],
    ['line\nasha@example.com\nline', 'asha@example.com'],
    ['asha@example.com-', 'asha@example.com'],
    ['josé@example.com', 'josé@example.com'],
    ['user@münchen.de', 'user@münchen.de'],
  ])('finds the address in %j', (text, expected) => {
    expect(covered(text, detectEmail(text))).toContain(expected);
  });

  it('finds every address in a line and reports exact offsets', () => {
    expect(detectEmail('a@b.co and c@d.io')).toEqual([
      { start: 0, end: 6, kind: 'email', confidence: 0.9 },
      { start: 11, end: 17, kind: 'email', confidence: 0.9 },
    ]);
  });

  it('covers an over-long local part by its last 64 characters', () => {
    const text = `${'a'.repeat(100)}@example.com`;
    expect(detectEmail(text)).toEqual([
      { start: 36, end: text.length, kind: 'email', confidence: 0.9 },
    ]);
  });
});

describe('detectEmail negatives and near misses', () => {
  it.each([
    ['no domain dot (a UPI-style handle)', 'asha@okaxis'],
    ['host without a dot', 'user@localhost'],
    ['social handle', '@asha'],
    ['trailing at', 'asha@'],
    ['empty local part', '@example.com'],
    ['one-letter TLD', 'a@b.c'],
    ['numeric TLD', 'a@b.123'],
    ['version-style domain', 'pkg@1.2.3'],
    ['double dot in domain', 'a@b..com'],
    ['label starting with a hyphen', 'a@-b.com'],
    ['label ending with a hyphen', 'a@b-.com'],
    ['space before the at sign', 'asha @example.com'],
    ['space after the at sign', 'asha@ example.com'],
    ['underscore after the domain', 'asha@example.com_x'],
    ['dot before the at sign', 'asha.@example.com'],
    ['label over 63 characters', `a@${'x'.repeat(64)}.com`],
    ['domain over 255 characters', `a@${'x'.repeat(260)}.com`],
  ])('ignores %s', (_label, text) => {
    expect(detectEmail(text)).toEqual([]);
  });

  it('documents a known false positive: an scp-style git address', () => {
    expect(covered('git@github.com:org/repo', detectEmail('git@github.com:org/repo'))).toEqual([
      'git@github.com',
    ]);
  });
});

describe('detectEmail properties', () => {
  it('detects every generated address inside surrounding text', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 - 1 }), (seed) => {
        const address = fakeEmail(createRng(seed));
        const text = `write to ${address}.`;
        expect(detectEmail(text)).toEqual([
          { start: 9, end: 9 + address.length, kind: 'email', confidence: 0.9 },
        ]);
      }),
    );
  });
});

describe('detectEmail ambiguous input', () => {
  it('reads two at signs as the address around the second one', () => {
    const text = 'a@b.com@c.com';
    expect(covered(text, detectEmail(text))).toEqual(['b.com@c.com']);
  });
});
