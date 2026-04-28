import { describe, expect, it } from 'vitest';
import { GRAPHEMES_BY_LEVEL, cumulativeGraphemes } from './levels';

describe('cumulativeGraphemes', () => {
  it('returns only level-1 units at level 1', () => {
    const units = cumulativeGraphemes(1);
    const level1 = GRAPHEMES_BY_LEVEL[1] ?? [];
    expect(units).toHaveLength(level1.length);
  });

  it('includes phonemes from levels 1..N at level 3', () => {
    const phonemes = new Set(cumulativeGraphemes(3).map((u) => u.p));
    expect(phonemes.has('s')).toBe(true); // level 1
    expect(phonemes.has('m')).toBe(true); // level 2
    expect(phonemes.has('b')).toBe(true); // level 3
  });

  it('dedupes by grapheme+phoneme key', () => {
    const units = cumulativeGraphemes(8);
    const keys = units.map((u) => `${u.g}|${u.p}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves introduction order — level-1 units come first', () => {
    const units = cumulativeGraphemes(3);
    const firstLevel1Index = units.findIndex((u) =>
      (GRAPHEMES_BY_LEVEL[1] ?? []).some(
        (l1) => l1.g === u.g && l1.p === u.p,
      ),
    );
    expect(firstLevel1Index).toBe(0);
  });
});
