import { GameCard } from './GameCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    entry: {
      id: 'math-addition',
      titleKey: 'math-addition',
      levels: ['1', '2'],
      subject: 'math',
    },
    isBookmarked: false,
  },
  argTypes: {
    onBookmarkToggle: { action: 'bookmarkToggled' },
    onPlay: { action: 'played' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {};

export const Bookmarked: Story = {
  args: { isBookmarked: true },
};

export const MultiLevel: Story = {
  args: {
    entry: {
      id: 'math-subtraction',
      titleKey: 'math-subtraction',
      levels: ['1', '2', '3'],
      subject: 'math',
    },
  },
};

export const LettersGame: Story = {
  args: {
    entry: {
      id: 'placeholder-game',
      titleKey: 'placeholder-game',
      levels: ['PK', 'K'],
      subject: 'letters',
    },
  },
};
