import { describe, expect, it } from 'vitest';
import { buildRoundOrder } from './build-round-order';

describe('buildRoundOrder', () => {
  it('returns [] for non-positive length', () => {
    expect(buildRoundOrder(0, true)).toEqual([]);
    expect(buildRoundOrder(-1, false)).toEqual([]);
  });

  it('returns [0] for a single round regardless of flag', () => {
    expect(buildRoundOrder(1, true)).toEqual([0]);
    expect(buildRoundOrder(1, false)).toEqual([0]);
  });

  it('returns sequential indices when roundsInOrder is true', () => {
    expect(buildRoundOrder(4, true)).toEqual([0, 1, 2, 3]);
  });

  it('returns a full permutation when roundsInOrder is false', () => {
    const order = buildRoundOrder(6, false);
    expect(order).toHaveLength(6);
    expect(new Set(order).size).toBe(6);
    expect([...order].toSorted((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });
});
