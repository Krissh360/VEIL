import { parseArgs } from 'node:util';
import { createRng, fakeAadhaar, fakeEmail, fakePan, fakePhone } from './lib/fake-data.ts';

const { values } = parseArgs({
  options: { seed: { type: 'string', default: '1' }, count: { type: 'string', default: '5' } },
});

const seed = Number(values.seed);
const count = Number(values.count);
if (!Number.isInteger(seed) || !Number.isInteger(count) || count < 1) {
  throw new RangeError('--seed and --count must be integers and --count at least 1');
}

const rng = createRng(seed);
const many = <T>(make: () => T): T[] => Array.from({ length: count }, make);

process.stdout.write(
  `${JSON.stringify(
    {
      seed,
      note: 'Fake values for local tests only. They can coincide with real ones by chance.',
      aadhaar: many(() => fakeAadhaar(rng, rng.int(2) === 0)),
      pan: many(() => fakePan(rng)),
      email: many(() => fakeEmail(rng)),
      phone: many(() => fakePhone(rng)),
    },
    null,
    2,
  )}\n`,
);
