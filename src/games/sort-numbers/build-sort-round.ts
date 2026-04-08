// src/games/sort-numbers/build-sort-round.ts
import { nanoid } from 'nanoid';
import type {
  DistractorConfig,
  SkipConfig,
  SortNumbersRound,
} from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

export function buildDistractorPool(
  sequence: number[],
  range: { min: number; max: number },
  config: DistractorConfig,
): number[] {
  const seqSet = new Set(sequence);

  let pool: number[];

  if (config.source === 'gaps-only') {
    pool = [];
    const sorted = [...sequence].toSorted((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      for (
        let n = (sorted[i] ?? 0) + 1;
        n < (sorted[i + 1] ?? 0);
        n++
      ) {
        pool.push(n);
      }
    }
  } else {
    // 'random' and 'full-range' both use all range numbers not in sequence
    pool = Array.from(
      { length: range.max - range.min + 1 },
      (_, i) => range.min + i,
    ).filter((n) => !seqSet.has(n));
  }

  if (config.count === 'all') return pool;

  // Pick `count` randomly from pool (Fisher-Yates partial)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, Math.min(config.count, shuffled.length));
}

export function buildSortRound(
  numbers: number[],
  direction: 'ascending' | 'descending',
  distractors?: {
    config: DistractorConfig;
    range: { min: number; max: number };
  },
): { tiles: TileItem[]; zones: AnswerZone[] } {
  const sorted = numbers.toSorted((a, b) =>
    direction === 'ascending' ? a - b : b - a,
  );

  const zones: AnswerZone[] = sorted.map((n, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: String(n),
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));

  const allNumbers = distractors
    ? [
        ...numbers,
        ...buildDistractorPool(
          numbers,
          distractors.range,
          distractors.config,
        ),
      ]
    : [...numbers];

  // Shuffle tiles (Fisher-Yates)
  for (let i = allNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allNumbers[i], allNumbers[j]] = [allNumbers[j]!, allNumbers[i]!];
  }

  const tiles: TileItem[] = allNumbers.map((n) => ({
    id: nanoid(),
    label: String(n),
    value: String(n),
  }));

  return { tiles, zones };
}

function generateConsecutiveRound(
  range: { min: number; max: number },
  quantity: number,
): SortNumbersRound {
  const rangeSize = range.max - range.min + 1;
  if (quantity > rangeSize) {
    return {
      sequence: Array.from(
        { length: rangeSize },
        (_, i) => range.min + i,
      ),
    };
  }
  const maxStart = range.max - quantity + 1;
  const start =
    Math.floor(Math.random() * (maxStart - range.min + 1)) + range.min;
  return {
    sequence: Array.from({ length: quantity }, (_, i) => start + i),
  };
}

interface GenerateOptions {
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  totalRounds: number;
}

export function generateSortRounds(
  options: GenerateOptions,
): SortNumbersRound[] {
  const { range, quantity, skip, totalRounds } = options;

  return Array.from({ length: totalRounds }, () => {
    if (skip.mode === 'random') {
      const pool = Array.from(
        { length: range.max - range.min + 1 },
        (_, i) => range.min + i,
      );
      const available = [...pool];
      const picked: number[] = [];
      for (let i = 0; i < quantity && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        picked.push(available[idx]!);
        available.splice(idx, 1);
      }
      return { sequence: picked };
    }

    if (skip.mode === 'by') {
      const { step, start } = skip;
      const maxPossibleStart = range.max - (quantity - 1) * step;

      if (maxPossibleStart < range.min) {
        console.warn(
          `generateSortRounds: mode 'by' step=${step} quantity=${quantity} exceeds range [${range.min},${range.max}]; falling back to consecutive`,
        );
        return generateConsecutiveRound(range, quantity);
      }

      if (start === 'range-min') {
        return {
          sequence: Array.from(
            { length: quantity },
            (_, i) => range.min + i * step,
          ),
        };
      }

      // start === 'random': pick a random valid start
      const validStarts = Array.from(
        { length: maxPossibleStart - range.min + 1 },
        (_, i) => range.min + i,
      );
      const picked =
        validStarts[Math.floor(Math.random() * validStarts.length)] ??
        range.min;
      return {
        sequence: Array.from(
          { length: quantity },
          (_, i) => picked + i * step,
        ),
      };
    }

    // mode === 'consecutive'
    return generateConsecutiveRound(range, quantity);
  });
}
