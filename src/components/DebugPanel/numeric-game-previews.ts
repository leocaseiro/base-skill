import type {
  SkipConfig,
  SortNumbersRound,
} from '@/games/sort-numbers/types';
import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';

export interface NumberMatchPreview {
  range: { min: number; max: number };
  mode: string;
  tileStyle: string;
  pool: number[];
}

const NUMBER_MATCH_POOL_CAP = 200;

export const buildNumberMatchPreview = (
  resolvedConfig: Record<string, unknown>,
): NumberMatchPreview | null => {
  const range = resolvedConfig.range;
  const mode = resolvedConfig.mode;
  const tileStyle = resolvedConfig.tileStyle;

  if (
    !isRange(range) ||
    typeof mode !== 'string' ||
    typeof tileStyle !== 'string'
  ) {
    return null;
  }

  const span = range.max - range.min + 1;
  const length = Math.min(Math.max(0, span), NUMBER_MATCH_POOL_CAP);
  const pool = Array.from({ length }, (_, i) => range.min + i);

  return { range, mode, tileStyle, pool };
};

export interface SortNumbersPreviewSample extends SortNumbersRound {
  id: string;
}

export interface SortNumbersPreview {
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  direction: 'ascending' | 'descending';
  totalRounds: number;
  samples: SortNumbersPreviewSample[];
}

const PREVIEW_COUNT = 12;

const isRange = (v: unknown): v is { min: number; max: number } => {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as { min?: unknown; max?: unknown };
  return typeof r.min === 'number' && typeof r.max === 'number';
};

const isSkip = (v: unknown): v is SkipConfig => {
  if (typeof v !== 'object' || v === null) return false;
  const mode = (v as { mode?: unknown }).mode;
  return mode === 'random' || mode === 'consecutive' || mode === 'by';
};

export const buildSortNumbersPreview = (
  resolvedConfig: Record<string, unknown>,
): SortNumbersPreview | null => {
  const range = resolvedConfig.range;
  const quantity = resolvedConfig.quantity;
  const skip = resolvedConfig.skip;
  const direction = resolvedConfig.direction;
  const totalRounds = resolvedConfig.totalRounds;

  if (
    !isRange(range) ||
    typeof quantity !== 'number' ||
    !isSkip(skip) ||
    (direction !== 'ascending' && direction !== 'descending') ||
    typeof totalRounds !== 'number'
  ) {
    return null;
  }

  const generated = generateSortRounds({
    range,
    quantity,
    skip,
    totalRounds: PREVIEW_COUNT,
  });
  const samples: SortNumbersPreviewSample[] = generated.map(
    (round, index) => ({
      ...round,
      id: `sample-${index}-${round.sequence.join(',')}`,
    }),
  );

  return {
    range,
    quantity,
    skip,
    direction,
    totalRounds,
    samples,
  };
};
