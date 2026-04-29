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

interface StoryArgs {
  cardCount: number;
  onPlay: () => void;
  onOpenCog: () => void;
  // Raw GameGrid prop shadowed by the cardCount bridge — hidden from Controls.
  cards?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameGrid as unknown as ComponentType<StoryArgs>,
  title: 'Components/GameGrid',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Responsive grid that lays GameCard children out in 2/3/4 columns at xs/lg/xl breakpoints. The cardCount range drives how many sample cards render — slide to 0 for the empty state, or up to 12 to see how the grid wraps. Sample cards cycle through the three real game seeds (word-spell, number-match, sort-numbers) so the layout reflects realistic cover art.',
      },
    },
  },
  args: {
    cardCount: 3,
    onPlay: fn(),
    onOpenCog: fn(),
  },
  argTypes: {
    cardCount: {
      control: { type: 'range', min: 0, max: 12, step: 1 },
    },
    onPlay: { table: { disable: true } },
    onOpenCog: { table: { disable: true } },
    cards: { table: { disable: true } },
  },
  render: ({ cardCount, onPlay, onOpenCog }) => (
    <GameGrid
      cards={Array.from({ length: cardCount }, (_, i) => {
        // Modulo by a positive constant always yields a valid index;
        // noUncheckedIndexedAccess can't see that, so assert it.
        const seed = SAMPLE_CARD_SEEDS[i % SAMPLE_CARD_SEEDS.length]!;
        return (
          <GameCard
            key={`${seed.gameId}-${String(i)}`}
            variant="default"
            gameId={seed.gameId}
            title={seed.title}
            chips={seed.chips}
            onPlay={onPlay}
            onOpenCog={onOpenCog}
          />
        );
      })}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
