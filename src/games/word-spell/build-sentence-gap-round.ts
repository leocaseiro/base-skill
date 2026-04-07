import { nanoid } from 'nanoid';
import type { GapDefinition } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

const shuffleInPlace = <T>(items: T[]): void => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
};

export const buildSentenceGapRound = (
  gaps: GapDefinition[],
): { tiles: TileItem[]; zones: AnswerZone[] } => {
  const zones: AnswerZone[] = gaps.map((gap, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: gap.word,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));

  const allWords = [
    ...gaps.map((g) => g.word),
    ...gaps.flatMap((g) => g.distractors ?? []),
  ];

  shuffleInPlace(allWords);

  const tiles: TileItem[] = allWords.map((word) => ({
    id: nanoid(),
    label: word,
    value: word,
  }));

  return { tiles, zones };
};
