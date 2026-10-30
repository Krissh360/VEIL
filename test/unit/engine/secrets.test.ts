import { describe, expect, it } from 'vitest';
import {
  detectAwsAccessKey,
  detectGenericSecret,
  detectGithubToken,
  detectJwt,
  detectSecrets,
  detectSlackToken,
} from '../../../src/engine/secrets';
import { covered } from './helpers';

// All values below are synthetic or published examples; none is a working credential.
const AWS = 'AKIAIOSFODNN7EXAMPLE'; // the example key in AWS documentation
const GITHUB = `ghp_${'Ab1'.repeat(12)}`;
const GITHUB_PAT = `github_pat_${'Zy9_'.repeat(15)}`;
// Assembled at run time so no token-shaped literal sits in the repository (push protection).
const SLACK = ['xoxb', '123456789012', '1234567890123', 'AbCdEfGhIjKlMnOpQrStUvWx'].join('-');
const SLACK_APP = ['xapp', '1', 'A0123456789', '1234567890123', '0a1b2c3d4e5f6a7b8c9d'].join('-');
const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // the jwt.io sample
// GitHub's newer installation-token shape: ghs_, an app ID, then a JWT, so it holds underscores,
// dots and hyphens and can run past 255 characters.
const GITHUB_APP_JWT = ['ghs', '1234567', JWT].join('_');
// A token with an empty signature (alg none) ends in a dot.
const UNSIGNED = `${JWT.split('.').slice(0, 2).join('.')}.`;
const RANDOM_VALUE = 'k8Jx2LmQ9vTz4RbN7wYc1HpS5dGf3AeU';

describe('detectAwsAccessKey', () => {
  it.each([
    [AWS, AWS],
    [`key=${AWS}`, AWS],
    [`"${AWS}"`, AWS],
    [`${AWS}.`, AWS],
    ['ASIAIOSFODNN7EXAMPLE', 'ASIAIOSFODNN7EXAMPLE'],
  ])('finds the key in %j', (text, expected) => {
    expect(covered(text, detectAwsAccessKey(text))).toEqual([expected]);
  });

  it.each([
    ['IAM user ID prefix', 'AIDAIOSFODNN7EXAMPLE'],
    ['role ID prefix', 'AROAIOSFODNN7EXAMPLE'],
    ['one character short', 'AKIAIOSFODNN7EXAMPL'],
    ['one character long', 'AKIAIOSFODNN7EXAMPLES'],
    ['lower case', 'akiaiosfodnn7example'],
    ['letter before', `X${AWS}`],
    ['letter after', `${AWS}x`],
    ['underscore before', `_${AWS}`],
    ['inside a longer token', `abc${AWS}def`],
  ])('ignores %s', (_label, text) => {
    expect(detectAwsAccessKey(text)).toEqual([]);
  });
});

describe('detectGithubToken', () => {
  it.each([
    [GITHUB, GITHUB],
    [`gho_${'Q'.repeat(36)}`, `gho_${'Q'.repeat(36)}`],
    [`ghs_${'7'.repeat(40)}`, `ghs_${'7'.repeat(40)}`],
    [GITHUB_PAT, GITHUB_PAT],
    [GITHUB_APP_JWT, GITHUB_APP_JWT],
    [`ghs_${'a'.repeat(600)}`, `ghs_${'a'.repeat(600)}`],
    [`token ${GITHUB_APP_JWT}.`, GITHUB_APP_JWT],
    [`"${GITHUB_APP_JWT}"`, GITHUB_APP_JWT],
    [`token ${GITHUB}.`, GITHUB],
    [`"${GITHUB}"`, GITHUB],
  ])('finds the token in %j', (text, expected) => {
    expect(covered(text, detectGithubToken(text))).toEqual([expected]);
  });

  it.each([
    ['too short', `ghp_${'a'.repeat(35)}`],
    ['unknown type letter', `ghx_${'a'.repeat(36)}`],
    ['no underscore', `ghp${'a'.repeat(36)}`],
    ['letter before', `x${GITHUB}`],
    ['underscore before', `_${GITHUB}`],
    ['prefix word only', 'ghp_'],
    ['installation token too short', `ghs_${'a'.repeat(30)}`],
    ['dot-separated type that never allowed dots', `ghp_${'a'.repeat(20)}.${'b'.repeat(20)}`],
    ['installation token over the cap', `ghs_${'a'.repeat(1100)}`],
    ['short fine-grained token', 'github_pat_abc'],
  ])('ignores %s', (_label, text) => {
    expect(detectGithubToken(text)).toEqual([]);
  });
});

describe('detectSlackToken', () => {
  it.each([
    [SLACK, SLACK],
    [SLACK_APP, SLACK_APP],
    [`xoxp-${'1'.repeat(30)}`, `xoxp-${'1'.repeat(30)}`],
    [`SLACK_TOKEN=${SLACK}`, SLACK],
    [`'${SLACK}'`, SLACK],
  ])('finds the token in %j', (text, expected) => {
    expect(covered(text, detectSlackToken(text))).toEqual([expected]);
  });

  it.each([
    ['too short', 'xoxb-123-456'],
    ['unknown type letter', `xoxz-${'1'.repeat(30)}`],
    ['letter before', `a${SLACK}`],
    ['prefix word only', 'xoxb-'],
  ])('ignores %s', (_label, text) => {
    expect(detectSlackToken(text)).toEqual([]);
  });
});

describe('detectJwt', () => {
  it.each([
    [JWT, JWT],
    [`Authorization: Bearer ${JWT}`, JWT],
    [`"${JWT}"`, JWT],
    [`${JWT}.`, JWT],
    [UNSIGNED, UNSIGNED],
  ])('finds the token in %j', (text, expected) => {
    expect(covered(text, detectJwt(text))).toEqual([expected]);
  });

  it.each([
    ['two parts only', JWT.split('.').slice(0, 2).join('.')],
    ['payload not an object', `${JWT.split('.')[0]}.abcdefgh.sig`],
    ['header not an object', `abcdefgh.${JWT.split('.')[1]}.sig`],
    ['letter before', `x${JWT}`],
    ['hyphen before', `-${JWT}`],
    ['dotted version string', '1.2.3.4.5'],
    ['file name', 'archive.tar.gz'],
  ])('ignores %s', (_label, text) => {
    expect(detectJwt(text)).toEqual([]);
  });
});

describe('detectGenericSecret', () => {
  it.each([
    [`api_key=${RANDOM_VALUE}`, RANDOM_VALUE],
    [`API_KEY: ${RANDOM_VALUE}`, RANDOM_VALUE],
    [`"secret": "${RANDOM_VALUE}"`, RANDOM_VALUE],
    [`client-secret = '${RANDOM_VALUE}'`, RANDOM_VALUE],
    [`access_token=${RANDOM_VALUE}.`, RANDOM_VALUE],
    [`password=${RANDOM_VALUE}`, RANDOM_VALUE],
    [`token:${RANDOM_VALUE}`, RANDOM_VALUE],
    [`apikey=${RANDOM_VALUE}==`, `${RANDOM_VALUE}==`],
    [`line\nsecret=${RANDOM_VALUE}\nline`, RANDOM_VALUE],
  ])('covers the value in %j', (text, expected) => {
    expect(covered(text, detectGenericSecret(text))).toEqual([expected]);
  });

  it('covers only the value, not the key name', () => {
    expect(detectGenericSecret(`api_key=${RANDOM_VALUE}`)).toEqual([
      { start: 8, end: 8 + RANDOM_VALUE.length, kind: 'secret', confidence: 0.5 },
    ]);
  });

  it.each([
    ['short value', 'api_key=abc123'],
    ['19 characters', 'api_key=k8Jx2LmQ9vTz4RbN7wY'],
    ['no key name', RANDOM_VALUE],
    ['key name inside a longer word', `mytokenizer=${RANDOM_VALUE}`],
    ['key name with a letter before', `xapi_key=${RANDOM_VALUE}`],
    ['words only', 'password=correct-horse-battery-staple-orange'],
    ['digits only', 'secret=12345678901234567890'],
    ['letters only', 'token=abcdefghijklmnopqrstuvwxyz'],
    ['repetitive value', 'api_key=ab1ab1ab1ab1ab1ab1ab1ab1'],
    ['no separator', `api_key ${RANDOM_VALUE}`],
    ['url value', 'token=https://example.com/a/very/long/path'],
    ['key name alone', 'api_key'],
  ])('ignores %s', (_label, text) => {
    expect(detectGenericSecret(text)).toEqual([]);
  });
});

describe('detectSecrets', () => {
  it('combines the rules in offset order', () => {
    const text = `a ${AWS} b ${GITHUB} c api_key=${RANDOM_VALUE}`;
    const found = covered(text, detectSecrets(text));
    expect(found).toEqual([AWS, GITHUB, RANDOM_VALUE]);
    expect(detectSecrets(text).every((match) => match.kind === 'secret')).toBe(true);
  });

  it('finds nothing in ordinary prose', () => {
    expect(detectSecrets('The quick brown fox jumps over the lazy dog, twice.')).toEqual([]);
  });
});
