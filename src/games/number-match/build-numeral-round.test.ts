import { describe, expect, it } from 'vitest';
import {
  buildNumeralRound,
  pickDistractorNumerals,
} from './build-numeral-round';

describe('pickDistractorNumerals', () => {
  it('returns distinct values excluding the correct answer', () => {
    const d = pickDistractorNumerals(5, 10, 1, 9);
    expect(d).toHaveLength(8);
    expect(d).not.toContain(5);
    expect(new Set(d).size).toBe(8);
  });

  it('returns fewer values when the range is tight', () => {
    const d = pickDistractorNumerals(3, 5, 1, 4);
    expect(d).toEqual(expect.arrayContaining([1, 2, 4]));
    expect(d).toHaveLength(3);
    expect(d).not.toContain(3);
  });

  it('returns [] when there is no wrong value in range', () => {
    expect(pickDistractorNumerals(7, 3, 7, 7)).toEqual([]);
  });
});

describe('buildNumeralRound', () => {
  it('exact mode yields a single bank tile', () => {
    const { tiles, zones } = buildNumeralRound(4, {
      tileBankMode: 'exact',
      range: { min: 1, max: 9 },
    });
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.value).toBe('4');
    expect(zones).toHaveLength(1);
    expect(zones[0]?.expectedValue).toBe('4');
  });

  it('distractors mode adds extra tiles with unique values', () => {
    const { tiles, zones } = buildNumeralRound(4, {
      tileBankMode: 'distractors',
      distractorCount: 3,
      range: { min: 1, max: 9 },
    });
    expect(tiles).toHaveLength(4);
    const values = tiles.map((t) => t.value);
    expect(new Set(values).size).toBe(4);
    expect(values).toContain('4');
    expect(zones[0]?.expectedValue).toBe('4');
  });
});
