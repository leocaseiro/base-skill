import { describe, expect, it } from 'vitest';
import { pickVariation } from './pick-variation';
import { FONT_POOL, SIZE_POOL } from './pools';
import { seededRandom } from '@/lib/seeded-random';

describe('pickVariation', () => {
  it('returns deterministic output for the same seed', () => {
    const a = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    const b = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    expect(a).toEqual(b);
  });

  it('picks size from SIZE_POOL', () => {
    const v = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    expect(SIZE_POOL).toContain(v.fontSizePx);
  });

  it('picks fontFamily from FONT_POOL when fonts are enabled', () => {
    const v = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    const families = FONT_POOL.map((f) => f.family);
    expect(families).toContain(v.fontFamily);
  });

  it('returns undefined fontFamily when font pool is empty', () => {
    const v = pickVariation(seededRandom('seed-1'), []);
    expect(v.fontFamily).toBeUndefined();
    expect(SIZE_POOL).toContain(v.fontSizePx);
  });
});
