import { nanoid } from 'nanoid';
import {
  toCardinalText,
  toOrdinalNumber,
  toOrdinalText,
} from './number-words';
import type { NumberMatchMode } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

type NumberWordsLocale = 'en' | 'pt-BR';

export type NumeralBankOptions = {
  tileBankMode: 'exact' | 'distractors';
  distractorCount?: number;
  range: { min: number; max: number };
  mode?: NumberMatchMode;
  locale?: NumberWordsLocale;
};

/**
 * Generate the display label for a tile based on the game mode.
 *
 * Matching always compares the underlying numeric `value`, so `label` is
 * purely for display. For word modes, the tile shows the word (cardinal or
 * ordinal) while the underlying value stays numeric.
 */
const labelForMode = (
  n: number,
  mode: NumberMatchMode,
  locale: NumberWordsLocale,
): string => {
  switch (mode) {
    case 'cardinal-number-to-text':
    case 'ordinal-to-cardinal': {
      return toCardinalText(n, locale);
    }
    case 'ordinal-number-to-text':
    case 'cardinal-to-ordinal': {
      return toOrdinalText(n, locale);
    }
    case 'ordinal-text-to-number': {
      return toOrdinalNumber(n, locale);
    }
    default: {
      return String(n);
    }
  }
};

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
}

/** Distinct integers in [min, max] excluding `correct`, up to `count` values. */
export function pickDistractorNumerals(
  correct: number,
  count: number,
  min: number,
  max: number,
): number[] {
  if (count <= 0 || min > max) return [];
  const pool: number[] = [];
  for (let v = min; v <= max; v++) {
    if (v !== correct) pool.push(v);
  }
  if (pool.length === 0) return [];
  shuffleInPlace(pool);
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * One answer zone (expected numeral) plus bank tiles: correct only, or correct + distractors.
 */
export function buildNumeralRound(
  value: number,
  bank: NumeralBankOptions,
): { tiles: TileItem[]; zones: AnswerZone[] } {
  const zone: AnswerZone = {
    id: nanoid(),
    index: 0,
    expectedValue: String(value),
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  };

  const numerals: number[] = [value];
  if (bank.tileBankMode === 'distractors') {
    const extra = pickDistractorNumerals(
      value,
      bank.distractorCount ?? 0,
      bank.range.min,
      bank.range.max,
    );
    numerals.push(...extra);
  }

  shuffleInPlace(numerals);
  const mode: NumberMatchMode = bank.mode ?? 'numeral-to-group';
  const locale: NumberWordsLocale = bank.locale ?? 'en';
  const tiles: TileItem[] = numerals.map((n) => ({
    id: nanoid(),
    label: labelForMode(n, mode, locale),
    value: String(n),
  }));

  return { tiles, zones: [zone] };
}
