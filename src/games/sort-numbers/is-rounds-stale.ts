import type { SkipConfig, SortNumbersRound } from './types';

interface StaleCheckOptions {
  quantity: number;
  range: { min: number; max: number };
  skip: SkipConfig;
}

export const isRoundsStale = (
  rounds: SortNumbersRound[],
  options: StaleCheckOptions,
): boolean => {
  const { quantity, range, skip } = options;

  return rounds.some((r) => {
    // Check quantity
    if (r.sequence.length !== quantity) return true;

    // Check range
    if (r.sequence.some((v) => v < range.min || v > range.max))
      return true;

    // Check skip pattern
    if (skip.mode === 'by') {
      const sorted = [...r.sequence].toSorted((a, b) => a - b);
      const diffs = sorted.slice(1).map((n, i) => n - (sorted[i] ?? 0));
      if (!diffs.every((d) => d === skip.step)) return true;
    }

    if (skip.mode === 'consecutive') {
      const sorted = [...r.sequence].toSorted((a, b) => a - b);
      const diffs = sorted.slice(1).map((n, i) => n - (sorted[i] ?? 0));
      if (!diffs.every((d) => d === 1)) return true;
    }

    // mode 'random': quantity + range check is sufficient
    return false;
  });
};
