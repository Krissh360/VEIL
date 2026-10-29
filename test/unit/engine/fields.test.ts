import { describe, expect, it } from 'vitest';
import { classifyField, type FieldAttributes } from '../../../src/engine/fields';

describe('classifyField by autocomplete and type', () => {
  it.each<[string, FieldAttributes, string]>([
    ['password type', { type: 'password' }, 'password'],
    ['password type, any case', { type: ' Password ' }, 'password'],
    ['current-password', { type: 'text', autocomplete: 'current-password' }, 'password'],
    ['new-password', { autocomplete: 'new-password' }, 'password'],
    [
      'one-time-code beats password type',
      { type: 'password', autocomplete: 'one-time-code' },
      'otp',
    ],
    ['cc-number', { type: 'text', autocomplete: 'cc-number' }, 'card'],
    ['cc-csc', { autocomplete: 'cc-csc' }, 'card'],
    ['section and billing prefixes', { autocomplete: 'section-pay billing cc-number' }, 'card'],
    ['upper-case token', { autocomplete: 'CC-NUMBER' }, 'card'],
    ['email type', { type: 'email' }, 'email'],
    ['email autocomplete', { type: 'text', autocomplete: 'email' }, 'email'],
    ['tel type', { type: 'tel' }, 'phone'],
    ['tel-national', { autocomplete: 'tel-national' }, 'phone'],
  ])('%s', (_label, attributes, expected) => {
    expect(classifyField(attributes)).toBe(expected);
  });
});

describe('classifyField by name, id and label', () => {
  it.each<[string, FieldAttributes, string]>([
    ['name password', { type: 'text', name: 'password' }, 'password'],
    ['id user_password', { id: 'user_password' }, 'password'],
    ['camelCase confirmPassword', { name: 'confirmPassword' }, 'password'],
    ['label Password', { label: 'Password' }, 'password'],
    ['name pwd', { name: 'pwd' }, 'password'],
    ['one-time password beats password', { name: 'one_time_password' }, 'otp'],
    ['name otp', { name: 'otp' }, 'otp'],
    ['label verification code', { label: 'Enter the verification code' }, 'otp'],
    ['name totp', { id: 'totp-input' }, 'otp'],
    ['name cvv', { name: 'cvv' }, 'card'],
    ['label security code', { label: 'Security code' }, 'card'],
    ['name cardNumber', { name: 'cardNumber' }, 'card'],
    ['id card-number', { id: 'card-number' }, 'card'],
    ['label credit card', { label: 'Credit card' }, 'card'],
    ['name aadhaar', { name: 'aadhaar_no' }, 'aadhaar'],
    ['spelling aadhar', { label: 'Aadhar number' }, 'aadhaar'],
    ['pan number', { label: 'PAN number' }, 'pan'],
    ['field called pan', { id: 'pan' }, 'pan'],
    ['permanent account number', { label: 'Permanent Account Number' }, 'pan'],
    ['ifsc', { name: 'bank_ifsc' }, 'ifsc'],
    ['upi id', { label: 'UPI ID' }, 'upi'],
    ['vpa', { name: 'vpa' }, 'upi'],
    ['api key', { name: 'apiKey' }, 'secret'],
    ['api_key', { id: 'api_key' }, 'secret'],
    ['client secret', { label: 'Client secret' }, 'secret'],
    ['access token', { name: 'access-token' }, 'secret'],
    ['email name', { name: 'user_email' }, 'email'],
    ['e-mail label', { label: 'E-mail' }, 'email'],
    ['phone name', { name: 'phone' }, 'phone'],
    ['mobile label', { label: 'Mobile number' }, 'phone'],
    ['name beats label', { name: 'password', label: 'Phone' }, 'password'],
    ['id used when name is empty', { name: '', id: 'cvc' }, 'card'],
  ])('%s', (_label, attributes, expected) => {
    expect(classifyField(attributes)).toBe(expected);
  });
});

describe('classifyField negatives and near misses', () => {
  it.each<[string, FieldAttributes]>([
    ['nothing', {}],
    ['all undefined', { type: undefined, autocomplete: undefined, name: undefined }],
    ['username', { type: 'text', name: 'username', autocomplete: 'username' }],
    ['autocomplete off', { type: 'text', autocomplete: 'off' }],
    ['search box', { type: 'search', name: 'q', label: 'Search' }],
    ['passport', { name: 'passport' }],
    ['pass-through word', { name: 'pass_through' }],
    ['company', { name: 'company' }],
    ['panel', { id: 'panel' }],
    ['expand', { name: 'expand' }],
    ['japan', { label: 'Japan' }],
    ['pan inside other words', { label: 'Pan and zoom the map' }],
    ['cardholder name', { name: 'cardholder' }],
    ['card colour', { name: 'card_colour' }],
    ['coupon code', { label: 'Coupon code' }],
    ['postal code', { name: 'postal_code' }],
    ['text type', { type: 'text' }],
    ['number type', { type: 'number', name: 'quantity' }],
    ['inherited object keys', { autocomplete: 'constructor', type: '__proto__' }],
    ['digit-adjacent letters', { name: 'hotp3x' }],
  ])('%s is not sensitive', (_label, attributes) => {
    expect(classifyField(attributes)).toBeNull();
  });

  it('only reads the start of a very long label', () => {
    const label = `${'x '.repeat(500)} password`;
    expect(classifyField({ label })).toBeNull();
  });

  it('accepts a plain object with no DOM involved', () => {
    const attributes: FieldAttributes = { name: 'password' };
    expect(Object.getPrototypeOf(attributes)).toBe(Object.prototype);
    expect(classifyField(attributes)).toBe('password');
  });
});
