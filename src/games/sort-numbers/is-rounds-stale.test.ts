import { describe, expect, it } from 'vitest';
import { isRoundsStale } from './is-rounds-stale';
import type { SortNumbersRound } from './types';

const makeRounds = (sequences: number[][]): SortNumbersRound[] =>
  sequences.map((sequence) => ({ sequence }));

describe('isRoundsStale', () => {
  it('returns true when sequence length does not match quantity', () => {
    const rounds = makeRounds([[1, 2, 3]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });

  it('returns true when values are outside range', () => {
    const rounds = makeRounds([[1, 2, 3]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 5, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });

  it('returns false when rounds match consecutive pattern', () => {
    const rounds = makeRounds([[3, 4, 5]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(false);
  });

  it('returns true when consecutive rounds have skip changed to by step=2', () => {
    const rounds = makeRounds([[3, 4, 5, 6]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(true);
  });

  it('returns true when step-2 rounds have skip changed to step=3', () => {
    const rounds = makeRounds([[2, 4, 6, 8]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 3, start: 'range-min' },
      }),
    ).toBe(true);
  });

  it('returns false when rounds match current skip pattern step=2', () => {
    const rounds = makeRounds([[2, 4, 6, 8]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(false);
  });

  it('returns false for random mode when quantity and range match', () => {
    const rounds = makeRounds([[3, 7, 12, 18]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'random' },
      }),
    ).toBe(false);
  });

  it('returns true when consecutive pattern does not match consecutive mode', () => {
    const rounds = makeRounds([[2, 4, 6]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });
});
