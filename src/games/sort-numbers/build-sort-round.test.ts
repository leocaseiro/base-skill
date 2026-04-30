import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildDistractorPool,
  buildSortRound,
  generateSortRounds,
} from './build-sort-round';

describe('buildSortRound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates zones in ascending order for ascending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'ascending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['1', '2', '3']);
  });

  it('creates zones in descending order for descending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'descending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['3', '2', '1']);
  });

  it('creates tiles with all sequence numbers', () => {
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

  it('appends distractor tiles when distractorConfig is provided', () => {
    const { tiles } = buildSortRound([2, 4, 6], 'ascending', {
      config: { source: 'full-range', count: 2 },
      range: { min: 1, max: 10 },
    });
    // 3 sequence tiles + 2 distractor tiles
    expect(tiles).toHaveLength(5);
  });

  it('tiles are never in the correct ascending sorted order', () => {
    const numbers = [1, 2, 3];
    const correctOrder = ['1', '2', '3'];
    for (let i = 0; i < 30; i++) {
      vi.restoreAllMocks();
      const { tiles } = buildSortRound(numbers, 'ascending');
      const tileValues = tiles.map((t) => t.value);
      expect(tileValues).not.toEqual(correctOrder);
    }
  });

  it('tiles are never in the correct descending sorted order', () => {
    const numbers = [1, 2, 3];
    const correctOrder = ['3', '2', '1'];
    for (let i = 0; i < 30; i++) {
      vi.restoreAllMocks();
      const { tiles } = buildSortRound(numbers, 'descending');
      const tileValues = tiles.map((t) => t.value);
      expect(tileValues).not.toEqual(correctOrder);
    }
  });

  it('distractor tiles are not part of the zones expectedValue set', () => {
    const { tiles, zones } = buildSortRound([2, 4, 6], 'ascending', {
      config: { source: 'full-range', count: 2 },
      range: { min: 1, max: 10 },
    });
    const expectedValues = new Set(zones.map((z) => z.expectedValue));
    const extraTiles = tiles.filter(
      (t) => !expectedValues.has(t.value),
    );
    expect(extraTiles).toHaveLength(2);
  });
});

describe('generateSortRounds', () => {
  it('mode consecutive generates consecutive sequences', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 3,
      skip: { mode: 'consecutive' },
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

  it('mode random generates sequences of correct length within range', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 4,
      skip: { mode: 'random' },
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

  it('mode random all numbers in a round are unique', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 5,
      skip: { mode: 'random' },
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(new Set(seq).size).toBe(seq.length);
  });

  it('mode by with start range-min generates fixed-step sequence from range.min', () => {
    const rounds = generateSortRounds({
      range: { min: 2, max: 20 },
      quantity: 4,
      skip: { mode: 'by', step: 3, start: 'range-min' },
      totalRounds: 1,
    });
    expect(rounds[0]?.sequence).toEqual([2, 5, 8, 11]);
  });

  it('mode by with start random generates valid fixed-step sequence', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 3,
      skip: { mode: 'by', step: 5, start: 'random' },
      totalRounds: 5,
    });
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(3);
      const diffs = round.sequence
        .slice(1)
        .map((n, i) => n - (round.sequence[i] ?? 0));
      expect(diffs.every((d) => d === 5)).toBe(true);
      expect(round.sequence[0]).toBeGreaterThanOrEqual(1);
      expect(round.sequence.at(-1)).toBeLessThanOrEqual(20);
    }
  });

  it('mode by falls back to consecutive when step is too large', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 5 },
      quantity: 3,
      skip: { mode: 'by', step: 10, start: 'range-min' },
      totalRounds: 1,
    });
    // step * (quantity - 1) = 20 > range.max - range.min = 4 → fallback to consecutive
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(3);
    const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
    expect(diffs.every((d) => d === 1)).toBe(true);
  });

  it('mode by with numeric start generates sequence from that start', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      totalRounds: 1,
    });
    expect(rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
  });

  it('mode by with numeric start exceeding range falls back to consecutive', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 3 },
      totalRounds: 1,
    });
    // 3+2*4=11 > 10 → fallback to consecutive
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(5);
    const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
    expect(diffs.every((d) => d === 1)).toBe(true);
  });

  it('mode by with numeric start outside range falls back to consecutive', () => {
    const rounds = generateSortRounds({
      range: { min: 5, max: 20 },
      quantity: 3,
      skip: { mode: 'by', step: 2, start: 1 },
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(3);
    const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
    expect(diffs.every((d) => d === 1)).toBe(true);
  });

  it('mode consecutive handles quantity larger than range size', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 3 },
      quantity: 5,
      skip: { mode: 'consecutive' },
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(3); // clamped to range size
    for (const n of seq) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });
});

describe('buildDistractorPool', () => {
  it('source random returns count numbers not in sequence', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 10 },
      { source: 'random', count: 3 },
    );
    expect(pool).toHaveLength(3);
    for (const n of pool) {
      expect([2, 4, 6]).not.toContain(n);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('source gaps-only count all returns numbers between consecutive sequence values', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 8 },
      { source: 'gaps-only', count: 'all' },
    );
    // Between 2 and 4: 3. Between 4 and 6: 5.
    expect(pool.toSorted((a, b) => a - b)).toEqual([3, 5]);
  });

  it('source gaps-only count number returns that many from gaps', () => {
    const pool = buildDistractorPool(
      [2, 5, 8],
      { min: 1, max: 10 },
      { source: 'gaps-only', count: 2 },
    );
    // Gaps: between 2 and 5: 3,4. Between 5 and 8: 6,7.
    expect(pool).toHaveLength(2);
    for (const n of pool) {
      expect([3, 4, 6, 7]).toContain(n);
    }
  });

  it('source full-range count all returns all non-sequence numbers in range', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 8 },
      { source: 'full-range', count: 'all' },
    );
    expect(pool.toSorted((a, b) => a - b)).toEqual([1, 3, 5, 7, 8]);
  });

  it('source full-range count number returns that many', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 10 },
      { source: 'full-range', count: 3 },
    );
    expect(pool).toHaveLength(3);
    for (const n of pool) {
      expect([2, 4, 6]).not.toContain(n);
    }
  });

  it('returns full pool when count exceeds pool size', () => {
    const pool = buildDistractorPool(
      [1, 2, 3, 4, 5],
      { min: 1, max: 6 },
      { source: 'random', count: 10 },
    );
    // Only 1 number in range not in sequence: 6
    expect(pool).toEqual([6]);
  });
});
