import { GameCard } from './GameCard';
import { GameGrid } from './GameGrid';
import type { Meta, StoryObj } from '@storybook/react';

const SAMPLE_CARDS = [
  <GameCard
    key="wordspell"
    variant="default"
    gameId="word-spell"
    title="Word Spell"
    chips={['PK', 'K']}
    onPlay={() => {}}
    onOpenCog={() => {}}
  />,
  <GameCard
    key="numbermatch"
    variant="default"
    gameId="number-match"
    title="Match the Number"
    chips={['1', '2']}
    onPlay={() => {}}
    onOpenCog={() => {}}
  />,
  <GameCard
    key="sortnumbers"
    variant="default"
    gameId="sort-numbers"
    title="Sort Numbers"
    chips={['K', '1']}
    onPlay={() => {}}
    onOpenCog={() => {}}
  />,
];

const meta: Meta<typeof GameGrid> = {
  component: GameGrid,
  tags: ['autodocs'],
  args: {
    cards: SAMPLE_CARDS,
  },
};
export default meta;

type Story = StoryObj<typeof GameGrid>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    cards: [],
  },
};
