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
 * Level generator for advanced SortNumbers configs.
 *
 * For 'by' skip mode with a numeric start, each call shifts the start
 * (and the implied range) upward by `(completedLevel + 1) * quantity *
 * step` — mirroring the simple-mode generator so level mode progresses
 * meaningfully across levels. Without the shift, a fixed numeric start
 * would produce the same sequence every level.
 *
 * For all other skip modes ('by' with 'random'/'range-min' start,
 * 'consecutive', 'random'), the configured range stays fixed and the
 * round is freshly sampled per call. Those modes already vary across
 * calls because they pick a fresh start (or fresh values) within range.
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

  return (completedLevel: number) => {
    if (skip.mode === 'by' && typeof skip.start === 'number') {
      const shift = (completedLevel + 1) * quantity * skip.step;
      const shiftedStart = skip.start + shift;
      const shiftedRange = {
        min: shiftedStart,
        max: shiftedStart + (quantity - 1) * skip.step,
      };
      const shiftedDistractor =
        tileBankMode === 'distractors'
          ? { config: distractors, range: shiftedRange }
          : undefined;
      const [round] = generateSortRounds({
        range: shiftedRange,
        quantity,
        skip: { ...skip, start: shiftedStart },
        totalRounds: 1,
      });
      if (!round) return null;
      return buildSortRound(
        round.sequence,
        direction,
        shiftedDistractor,
      );
    }

    const distractor =
      tileBankMode === 'distractors'
        ? { config: distractors, range }
        : undefined;
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
