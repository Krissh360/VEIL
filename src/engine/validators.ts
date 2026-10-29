const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
] as const;

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
] as const;

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9] as const;

const ASCII_DIGITS = /^[0-9]+$/;

function digitAt(digits: string, index: number): number {
  return digits.charCodeAt(index) - 48;
}

// Reads right to left; `offset` shifts the position weights so a payload can be
// checked as if a check digit were appended to it.
function verhoeffState(digits: string, offset: number): number {
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = digitAt(digits, digits.length - 1 - i);
    c = VERHOEFF_D[c]?.[VERHOEFF_P[(i + offset) % 8]?.[digit] ?? 0] ?? 0;
  }
  return c;
}

/** True for a string of ASCII digits whose last digit is a correct Verhoeff check digit. */
export function isValidVerhoeff(digits: string): boolean {
  return digits.length >= 2 && ASCII_DIGITS.test(digits) && verhoeffState(digits, 0) === 0;
}

/** The check digit to append to `payload` (ASCII digits) so the result passes `isValidVerhoeff`. */
export function verhoeffCheckDigit(payload: string): number {
  if (!ASCII_DIGITS.test(payload)) throw new RangeError('payload must be ASCII digits');
  return VERHOEFF_INV[verhoeffState(payload, 1)] ?? 0;
}

function luhnSum(digits: string, doubleFrom: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digitAt(digits, digits.length - 1 - i);
    if (i % 2 === doubleFrom) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum;
}

/** True for a string of ASCII digits whose last digit is a correct Luhn check digit. */
export function isValidLuhn(digits: string): boolean {
  return digits.length >= 2 && ASCII_DIGITS.test(digits) && luhnSum(digits, 1) % 10 === 0;
}

/** The check digit to append to `payload` (ASCII digits) so the result passes `isValidLuhn`. */
export function luhnCheckDigit(payload: string): number {
  if (!ASCII_DIGITS.test(payload)) throw new RangeError('payload must be ASCII digits');
  return (10 - (luhnSum(payload, 0) % 10)) % 10;
}
