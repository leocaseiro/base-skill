import { describe, expect, it } from 'vitest';
import { seededRandom } from './seeded-random';

const seq = (r: () => number, n: number) =>
  Array.from({ length: n }, () => r());

describe('seededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = seededRandom('hello');
    const b = seededRandom('hello');
    expect(seq(a, 5)).toEqual(seq(b, 5));
  });

  it('produces different sequences for different seeds', () => {
    const a = seededRandom('alpha');
    const b = seededRandom('beta');
    expect(a()).not.toBe(b());
  });

  it('returns values in [0, 1)', () => {
    const r = seededRandom('range-check');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
