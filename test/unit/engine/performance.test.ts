import { afterAll, describe, expect, it } from 'vitest';
import { detectAadhaar } from '../../../src/engine/aadhaar';
import { detectCard } from '../../../src/engine/card';
import { detectEmail } from '../../../src/engine/email';
import { detectIfsc } from '../../../src/engine/ifsc';
import { detect } from '../../../src/engine/index';
import { detectPan } from '../../../src/engine/pan';
import { detectIndianMobile, detectInternationalPhone } from '../../../src/engine/phone';
import { detectGenericSecret, detectJwt, detectSecrets } from '../../../src/engine/secrets';
import { detectUpi } from '../../../src/engine/upi';
import type { Detector } from '../../../src/engine/types';

const MB = 1024 * 1024;

// Inputs of 1 MB or more built to make a backtracking or restarting scan slow. A linear scan
// finishes each in tens of milliseconds; a quadratic one would take minutes, so the generous
// limit only has to separate those two.
const LIMIT_MS = 3000;

const repeat = (unit: string, bytes = MB): string => unit.repeat(Math.ceil(bytes / unit.length));

const INPUTS: readonly (readonly [string, string])[] = [
  ['letters only', repeat('a')],
  ['digits only', repeat('1')],
  ['digits starting 2 to 9', repeat('9')],
  ['digit, space', repeat('2 ')],
  ['digit, hyphen', repeat('2-')],
  ['four-digit groups', repeat('2222 ')],
  ['ten-digit numbers', repeat('9876543210 ')],
  ['twelve-digit numbers', repeat('259926749443 ')],
  ['card-like groups', repeat('4111 1111 1111 1111 ')],
  ['card-like groups, no final digit', repeat('4111 1111 1111 111 ')],
  ['no-break-space groups', repeat(`5214${String.fromCharCode(0xa0)}`)],
  ['digit then dot', repeat('1.')],
  ['at signs', repeat('@')],
  ['letter, at', repeat('a@')],
  ['letter, dot', repeat('a.')],
  ['email-like pieces', repeat('a@b.')],
  ['local part without an at sign', repeat('a.b-c_d+e%f')],
  ['domain-like run after one at sign', `a@${repeat('b.')}`],
  ['long local part then at', `${repeat('a')}@example.com`],
  ['many valid addresses', repeat('a@b.co ')],
  ['plus signs', repeat('+')],
  ['plus, one', repeat('+1')],
  ['plus, digit, space', repeat('+1 ')],
  ['plus, digit, hyphen', repeat('+1-')],
  ['plus, brackets', repeat('+1 (2) ')],
  ['many valid international numbers', repeat('+44 20 7946 0958 ')],
  ['key name repeated', repeat('api_key=')],
  ['key name then a long value', `api_key=${repeat('Ab1')}`],
  ['key names inside values', repeat('token=token=')],
  ['quotes and colons', repeat('"secret": "')],
  ['many valid generic secrets', repeat('token=k8Jx2LmQ9vTz4RbN7wYc1HpS5dGf3AeU ')],
  ['jwt prefix repeated', repeat('eyJ')],
  ['jwt prefix with hyphens', repeat('eyJ-')],
  ['jwt prefix with dots', repeat('eyJabcdef.')],
  ['jwt header then a long payload', `eyJhbGciOiJIUzI1NiJ9.eyJ${repeat('a')}`],
  ['jwt with an unterminated signature run', `eyJabcde.eyJabcde.${repeat('a')}é`],
  ['aws prefix repeated', repeat('AKIA')],
  ['github prefix repeated', repeat('ghp_')],
  ['github prefix then a long run', `ghp_${repeat('a')}`],
  ['installation prefix repeated', repeat('ghs_')],
  ['installation prefix with separators', repeat('ghs_a.')],
  ['installation prefix then a long run', `ghs_${repeat('a1_.-')}`],
  ['many installation tokens', repeat(`ghs_${'a'.repeat(40)} `)],
  ['slack prefix repeated', repeat('xoxb-')],
  ['slack prefix then a long run', `xoxb-${repeat('a')}`],
  ['pan-like run', repeat('ABCPE1234F')],
  ['pan-like pieces', repeat('ABCPE1234F ')],
  ['ifsc-like run', repeat('SBIN0001234')],
  ['upi-like pieces', repeat('asha@ybl ')],
  ['handle names after at signs', repeat('a@ybl.')],
  ['newlines', repeat('\n')],
  ['spaces', repeat(' ')],
  ['non-ASCII letters', repeat('é')],
  ['Devanagari digits', repeat('९')],
  [
    'mixed realistic text',
    repeat('Order 20240105-98765 shipped to Pune on 05/01/2024, ref v1.2.3. '),
  ],
];

const DETECTORS: readonly (readonly [string, Detector])[] = [
  ['aadhaar', detectAadhaar],
  ['card', detectCard],
  ['pan', detectPan],
  ['ifsc', detectIfsc],
  ['email', detectEmail],
  ['upi', detectUpi],
  ['indian mobile', detectIndianMobile],
  ['international phone', detectInternationalPhone],
  ['jwt', detectJwt],
  ['generic secret', detectGenericSecret],
  ['secrets', detectSecrets],
  ['all detectors, merged', detect],
];

const timings = new Map<string, number>();

describe.each(DETECTORS)('%s on 1 MB inputs', (name, detector) => {
  it.each(INPUTS)('stays linear on: %s', (label, input) => {
    expect(input.length).toBeGreaterThanOrEqual(MB);
    const started = performance.now();
    const matches = detector(input);
    const elapsed = performance.now() - started;
    timings.set(`${name} | ${label}`, elapsed);
    expect(Array.isArray(matches)).toBe(true);
    expect(elapsed).toBeLessThan(LIMIT_MS);
  });
});

afterAll(() => {
  if (process.env['VEIL_TIMINGS'] !== '1') return;
  const rows = [...timings].sort((a, b) => b[1] - a[1]);
  const slowest = rows.slice(0, 15).map(([key, ms]) => `${ms.toFixed(0).padStart(6)} ms  ${key}`);
  const merged = rows
    .filter(([key]) => key.startsWith('all detectors'))
    .map(([key, ms]) => `${ms.toFixed(0).padStart(6)} ms  ${key}`);
  process.stdout.write(`\nSlowest 15 of ${rows.length}:\n${slowest.join('\n')}\n`);
  process.stdout.write(`\nAll detectors, merged, every input:\n${merged.join('\n')}\n`);
});

describe('scaling', () => {
  // Four times the input should cost about four times the time. A quadratic scan would cost
  // sixteen times, so a ratio under 10 separates the two with room for timer noise.
  it.each(['a@ybl.', '4111 1111 1111 1111 ', 'api_key=', '+44 20 7946 0958 ', 'eyJabcdef.'])(
    'detect grows about linearly on %j',
    (unit) => {
      const time = (bytes: number): number => {
        const input = repeat(unit, bytes);
        detect(input);
        const started = performance.now();
        detect(input);
        return performance.now() - started;
      };
      const small = Math.max(time(MB), 5);
      const large = time(4 * MB);
      expect(large / small).toBeLessThan(10);
    },
  );
});
