import { nanoid } from 'nanoid';
import type { WordSpellConfig } from '../types.js';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import { shuffleAvoidingOrder } from '@/lib/shuffle.js';

const segmentsForWord = (
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): string[] => {
  const trimmed = word.trim();
  if (tileUnit === 'word') return [trimmed];
  if (tileUnit === 'syllable') {
    const parts = trimmed.split(/[-\s]+/).filter(Boolean);
    return parts.length > 0 ? parts : [trimmed];
  }
  return [...trimmed.toLowerCase()];
};

export const buildTilesAndZones = (
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): { tiles: TileItem[]; zones: AnswerZone[] } => {
  const segments = segmentsForWord(word, tileUnit);
  const values = segments.map((s) =>
    tileUnit === 'letter' ? s.toLowerCase() : s.toUpperCase(),
  );
  const zones: AnswerZone[] = values.map((value, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: value,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));
  const shuffled = shuffleAvoidingOrder(values, values);
  const tiles: TileItem[] = shuffled.map((value) => ({
    id: nanoid(),
    label: value,
    value,
  }));
  return { tiles, zones };
};
