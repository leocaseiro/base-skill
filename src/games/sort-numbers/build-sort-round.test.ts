import { describe, expect, it } from 'vitest';
import { buildSortRound, generateSortRounds } from './build-sort-round';

describe('buildSortRound', () => {
  it('creates zones in ascending order for ascending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'ascending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['1', '2', '3']);
  });

  it('creates zones in descending order for descending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'descending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['3', '2', '1']);
  });

  it('creates tiles with all numbers', () => {
    const { tiles } = buildSortRound([1, 2, 3], 'ascending');
    expect(tiles.map((t) => t.value).toSorted()).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(tiles).toHaveLength(3);
  });

  it('each tile has a unique id', () => {
    const { tiles } = buildSortRound([1, 2, 3], 'ascending');
    const ids = tiles.map((t) => t.id);
    expect(new Set(ids).size).toBe(3);
  });
});

describe('generateSortRounds', () => {
  it('generates consecutive rounds without skips', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 3,
      allowSkips: false,
      totalRounds: 2,
    });
    expect(rounds).toHaveLength(2);
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(3);
      const diffs = round.sequence
        .slice(1)
        .map((n, i) => n - (round.sequence[i] ?? 0));
      expect(diffs.every((d) => d === 1)).toBe(true);
    }
  });

  it('generates rounds with gaps when allowSkips is true', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 4,
      allowSkips: true,
      totalRounds: 3,
    });
    expect(rounds).toHaveLength(3);
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(4);
      for (const n of round.sequence) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(20);
      }
    }
  });

  it('all numbers in a round are unique', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 5,
      allowSkips: false,
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(new Set(seq).size).toBe(seq.length);
  });
});
