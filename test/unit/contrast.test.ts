import { describe, expect, it } from 'vitest';
import { contrastRatio, luminance } from '../../scripts/lib/contrast.ts';

describe('contrast', () => {
  it('gives black and white a ratio of 21', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#2E4A7D', '#F7F6F3')).toBeCloseTo(
      contrastRatio('#F7F6F3', '#2E4A7D'),
      10,
    );
  });

  it('gives identical colours a ratio of 1', () => {
    expect(contrastRatio('#6B675E', '#6B675E')).toBe(1);
  });

  it('matches the WCAG luminance of mid grey', () => {
    expect(luminance('#808080')).toBeCloseTo(0.2159, 3);
  });

  it('rejects malformed colours', () => {
    expect(() => luminance('#FFF')).toThrow();
  });
});
