import { buildSortRound, generateSortRounds } from './build-sort-round';
import type { DistractorConfig, SkipConfig } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

interface AdvancedLevelGeneratorOptions {
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  direction: 'ascending' | 'descending';
  tileBankMode: 'exact' | 'distractors';
  distractors: DistractorConfig;
}

/**
 * Level generator for advanced SortNumbers configs. Each call produces a
 * fresh round using the user's configured range/skip/quantity — so every
 * level feels like a new sort from the same rule set. Unlike the simple
 * generator, the range does not shift per level (advanced users pick the
 * range they want to practise).
 */
export const createAdvancedLevelGenerator = (
  options: AdvancedLevelGeneratorOptions,
): ((completedLevel: number) => {
  tiles: TileItem[];
  zones: AnswerZone[];
} | null) => {
  const {
    range,
    quantity,
    skip,
    direction,
    tileBankMode,
    distractors,
  } = options;
  const distractor =
    tileBankMode === 'distractors'
      ? { config: distractors, range }
      : undefined;

  return () => {
    const [round] = generateSortRounds({
      range,
      quantity,
      skip,
      totalRounds: 1,
    });
    if (!round) return null;
    return buildSortRound(round.sequence, direction, distractor);
  };
};
