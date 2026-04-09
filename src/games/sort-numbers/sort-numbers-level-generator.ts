import { buildSortRound } from './build-sort-round';
import type { DistractorConfig } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

interface LevelGeneratorOptions {
  start: number;
  step: number;
  quantity: number;
  direction: 'ascending' | 'descending';
  distractor?: {
    config: DistractorConfig;
    range: { min: number; max: number };
  };
}

export const createSortNumbersLevelGenerator = (
  options: LevelGeneratorOptions,
): ((completedLevel: number) => {
  tiles: TileItem[];
  zones: AnswerZone[];
}) => {
  const { start, step, quantity, direction, distractor } = options;

  return (completedLevel: number) => {
    const levelStart = start + completedLevel * quantity * step;
    const sequence = Array.from(
      { length: quantity },
      (_, i) => levelStart + i * step,
    );

    const distractorArg = distractor
      ? {
          config: distractor.config,
          range: {
            min: levelStart,
            max: levelStart + (quantity - 1) * step,
          },
        }
      : undefined;

    return buildSortRound(sequence, direction, distractorArg);
  };
};
