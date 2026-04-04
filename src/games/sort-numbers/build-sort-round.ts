import { nanoid } from 'nanoid';
import type { SortNumbersRound } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

export function buildSortRound(
  numbers: number[],
  direction: 'ascending' | 'descending',
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

  // Shuffle tiles (Fisher-Yates)
  const shuffled = [...numbers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  const tiles: TileItem[] = shuffled.map((n) => ({
    id: nanoid(),
    label: String(n),
    value: String(n),
  }));

  return { tiles, zones };
}

interface GenerateOptions {
  range: { min: number; max: number };
  quantity: number;
  allowSkips: boolean;
  totalRounds: number;
}

export function generateSortRounds(
  options: GenerateOptions,
): SortNumbersRound[] {
  const { range, quantity, allowSkips, totalRounds } = options;

  return Array.from({ length: totalRounds }, () => {
    if (allowSkips) {
      const pool = Array.from(
        { length: range.max - range.min + 1 },
        (_, i) => range.min + i,
      );
      const picked: number[] = [];
      const available = [...pool];
      for (let i = 0; i < quantity && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        picked.push(available[idx]!);
        available.splice(idx, 1);
      }
      return { sequence: picked };
    }

    // Consecutive: pick a random start such that start + quantity - 1 <= max
    const rangeSize = range.max - range.min + 1;
    if (quantity > rangeSize) {
      // quantity exceeds range — fall back to the full range in order
      const sequence = Array.from(
        { length: rangeSize },
        (_, i) => range.min + i,
      );
      return { sequence };
    }
    const maxStart = range.max - quantity + 1;
    const start =
      Math.floor(Math.random() * (maxStart - range.min + 1)) +
      range.min;
    const sequence = Array.from(
      { length: quantity },
      (_, i) => start + i,
    );
    return { sequence };
  });
}
