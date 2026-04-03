import { GameCard } from './GameCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    entry: {
      id: 'word-spell',
      titleKey: 'word-spell',
      levels: ['1', '2'],
      subject: 'reading',
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
      id: 'number-match',
      titleKey: 'number-match',
      levels: ['1', '2', '3'],
      subject: 'math',
    },
  },
};

export const EarlyYearsReading: Story = {
  args: {
    entry: {
      id: 'word-spell',
      titleKey: 'word-spell',
      levels: ['PK', 'K'],
      subject: 'reading',
    },
  },
};
