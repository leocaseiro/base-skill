import { describe, expect, it } from 'vitest';
import { resizeNumberMatchRounds } from './$gameId';

describe('resizeNumberMatchRounds', () => {
  const range = { min: 1, max: 12 };

  it('returns a deterministic cycle from min when prev is empty', () => {
    const out = resizeNumberMatchRounds([], 5, range);
    expect(out.map((r) => r.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserves existing in-range values when growing the list', () => {
    const prev = [{ value: 5 }, { value: 8 }, { value: 3 }];
    const out = resizeNumberMatchRounds(prev, 5, range);
    // First three preserved, last two filled by deterministic cycle.
    expect(out.map((r) => r.value)).toEqual([5, 8, 3, 4, 5]);
  });

  it('replaces out-of-range values without touching in-range neighbours', () => {
    const prev = [{ value: 5 }, { value: 99 }, { value: 3 }];
    const out = resizeNumberMatchRounds(prev, 3, range);
    expect(out[0]?.value).toBe(5);
    expect(out[1]?.value).not.toBe(99);
    expect(out[2]?.value).toBe(3);
  });

  it('regenerates fully when every round is collapsed to the same value and the range allows variety', () => {
    // Simulates the bug: a previous narrow-range edit (e.g. {min:5,max:5})
    // collapsed every round to 5. The range is now wide again but the
    // preserved values are stuck.
    const prev = [
      { value: 5 },
      { value: 5 },
      { value: 5 },
      { value: 5 },
      { value: 5 },
    ];
    const out = resizeNumberMatchRounds(prev, 5, range);
    const values = out.map((r) => r.value);
    expect(values).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('keeps all rounds the same when the range legitimately only allows one value', () => {
    const prev = [{ value: 7 }, { value: 7 }, { value: 7 }];
    const out = resizeNumberMatchRounds(prev, 3, { min: 7, max: 7 });
    expect(out.map((r) => r.value)).toEqual([7, 7, 7]);
  });

  it('does not regenerate a single-round collapsed state (trivially "all same")', () => {
    const prev = [{ value: 5 }];
    const out = resizeNumberMatchRounds(prev, 1, range);
    expect(out.map((r) => r.value)).toEqual([5]);
  });

  it('caps the count at 50', () => {
    const out = resizeNumberMatchRounds([], 100, range);
    expect(out).toHaveLength(50);
  });

  it('clamps the count at 1', () => {
    const out = resizeNumberMatchRounds([], 0, range);
    expect(out).toHaveLength(1);
  });
});
