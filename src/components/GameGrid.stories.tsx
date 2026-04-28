import { fn } from 'storybook/test';

import { GameCard } from './GameCard';
import { GameGrid } from './GameGrid';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  cardCount: number;
  // Raw GameGrid prop shadowed by the cardCount bridge — hidden from Controls.
  cards?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameGrid as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    cardCount: 3,
  },
  argTypes: {
    cardCount: {
      control: { type: 'range', min: 0, max: 12, step: 1 },
    },
    cards: { table: { disable: true } },
  },
  render: ({ cardCount }) => (
    <GameGrid
      cards={Array.from({ length: cardCount }, (_, i) => (
        <GameCard
          key={`card-${String(i)}`}
          variant="default"
          gameId="sort-numbers"
          title={`Card ${String(i + 1)}`}
          chips={['K', '1', '2']}
          onPlay={fn()}
          onOpenCog={fn()}
        />
      ))}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
