import type { Match } from '../../../src/engine/types';

/** The text each match covers, for assertions only. */
export function covered(text: string, matches: readonly Match[]): string[] {
  return matches.map((match) => text.slice(match.start, match.end));
}
