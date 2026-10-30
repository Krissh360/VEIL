import { compile, scan } from './pattern';
import type { Detector, Match } from './types';

// Token characters include "-" and "_", so a token must not start inside a run of them either.
// Without that, "eyJ-eyJ-eyJ-..." would restart a long scan at every hyphen.
const START = String.raw`(?<![\p{L}\p{N}_-])`;
const END = String.raw`(?![\p{L}\p{N}_])`;

// Formats and the evidence for each: decision 0017.
const AWS_ACCESS_KEY = compile(String.raw`${START}(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}${END}`);
const GITHUB_TOKEN = compile(
  String.raw`${START}(?:gh[pour]_[A-Za-z0-9]{36,255}|ghs_[A-Za-z0-9._-]{35,1023}[A-Za-z0-9_-]|github_pat_[A-Za-z0-9_]{40,255})${END}`,
);
const SLACK_TOKEN = compile(String.raw`${START}(?:xox[abprs]|xapp)-[A-Za-z0-9-]{20,250}${END}`);
// Header and payload are base64url JSON objects, so both start with "eyJ" ('{"'). The segment
// lengths are capped so a scan can never run further than the cap from any starting point.
const JWT = compile(
  String.raw`${START}eyJ[A-Za-z0-9_-]{5,2048}\.eyJ[A-Za-z0-9_-]{5,8192}\.[A-Za-z0-9_-]{0,2048}${END}`,
);

export const detectAwsAccessKey: Detector = (text) =>
  scan(text, AWS_ACCESS_KEY, 'secret', () => 0.95);
export const detectGithubToken: Detector = (text) => scan(text, GITHUB_TOKEN, 'secret', () => 0.98);
export const detectSlackToken: Detector = (text) => scan(text, SLACK_TOKEN, 'secret', () => 0.95);
export const detectJwt: Detector = (text) => scan(text, JWT, 'secret', () => 0.9);

const KEY_NAME = [
  String.raw`api[_-]?key`,
  String.raw`secret(?:[_-]?key)?`,
  String.raw`client[_-]?secret`,
  String.raw`(?:access|auth|refresh|bearer)[_-]?token`,
  String.raw`private[_-]?key`,
  String.raw`passwd`,
  String.raw`password`,
  String.raw`pwd`,
  String.raw`token`,
].join('|');

// A key name, an optional closing quote, ":" or "=", an optional opening quote. The gaps are
// bounded so the pattern cannot backtrack.
const ASSIGNMENT = compile(
  String.raw`(?<![\p{L}\p{N}])(?:${KEY_NAME})(?![\p{L}\p{N}])["']?[ \t]{0,4}[:=][ \t]{0,4}["']?`,
  'i',
);

const VALUE_CHAR = /[A-Za-z0-9_\-+/.~]/;
const MIN_VALUE = 20;
const MAX_VALUE = 512;
const MIN_ENTROPY = 3.5;

function entropy(value: string): number {
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const share = count / value.length;
    bits -= share * Math.log2(share);
  }
  return bits;
}

function looksRandom(value: string): boolean {
  return /[A-Za-z]/.test(value) && /[0-9]/.test(value) && entropy(value) >= MIN_ENTROPY;
}

/**
 * Conservative generic rule: a value of 20 or more characters that follows a key name such as
 * `api_key`, `secret` or `password` and a ":" or "=", and that has digits, letters and the
 * entropy of random data. Only the value is covered, not the key name. Short passwords and
 * ordinary words after these names are not matched; password fields are covered by field rules.
 */
export const detectGenericSecret: Detector = (text) => {
  const matches: Match[] = [];
  for (const hit of text.matchAll(ASSIGNMENT)) {
    const start = hit.index + hit[0].length;
    let end = start;
    while (end < text.length && end - start < MAX_VALUE && VALUE_CHAR.test(text.charAt(end))) end++;
    while (end > start && text.charAt(end - 1) === '.') end--;
    const value = text.slice(start, end);
    if (value.length < MIN_VALUE || !looksRandom(value)) continue;
    for (let padding = 0; padding < 2 && text.charAt(end) === '='; padding++) end++;
    matches.push({ start, end, kind: 'secret', confidence: 0.5 });
  }
  return matches;
};

export const detectSecrets: Detector = (text) =>
  [
    ...detectAwsAccessKey(text),
    ...detectGithubToken(text),
    ...detectSlackToken(text),
    ...detectJwt(text),
    ...detectGenericSecret(text),
  ].sort((a, b) => a.start - b.start || b.end - a.end);
