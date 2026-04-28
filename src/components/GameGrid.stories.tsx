import { fn } from 'storybook/test';

import { GameCard } from './GameCard';
import { GameGrid } from './GameGrid';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface SampleCardSeed {
  gameId: string;
  title: string;
  chips: string[];
}

const SAMPLE_CARD_SEEDS: readonly SampleCardSeed[] = [
  { gameId: 'word-spell', title: 'Word Spell', chips: ['PK', 'K'] },
  {
    gameId: 'number-match',
    title: 'Match the Number',
    chips: ['1', '2'],
  },
  { gameId: 'sort-numbers', title: 'Sort Numbers', chips: ['K', '1'] },
];

const MAX_CARDS = 12;

interface StoryArgs {
  cardCount: number;
  onPlay: () => void;
  onOpenCog: () => void;
  // Raw GameGrid prop intentionally hidden — `cards` is built from
  // `cardCount` in render and is never meaningful as a control.
  cards?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameGrid as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    cardCount: 3,
    onPlay: fn(),
    onOpenCog: fn(),
  },
  argTypes: {
    cardCount: {
      control: { type: 'range', min: 0, max: MAX_CARDS, step: 1 },
      description:
        'Number of sample GameCards rendered into the grid. Cycles through the 3 sample seeds (word-spell, number-match, sort-numbers).',
    },
    onPlay: { table: { disable: true } },
    onOpenCog: { table: { disable: true } },
    cards: { table: { disable: true } },
  },
  render: ({ cardCount, onPlay, onOpenCog }) => {
    const cards = Array.from({ length: cardCount }, (_, index) => {
      // Modulo by a positive constant always yields a valid index;
      // noUncheckedIndexedAccess can't see that, so assert it.
      const seed = SAMPLE_CARD_SEEDS[index % SAMPLE_CARD_SEEDS.length]!;
      return (
        <GameCard
          key={`${seed.gameId}-${index}`}
          variant="default"
          gameId={seed.gameId}
          title={seed.title}
          chips={seed.chips}
          onPlay={onPlay}
          onOpenCog={onOpenCog}
        />
      );
    });
    return <GameGrid cards={cards} />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
