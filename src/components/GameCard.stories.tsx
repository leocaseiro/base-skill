import { GameCard } from './GameCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    gameId: 'sort-numbers',
    title: 'Count in Order',
    chips: ['🚀 Up', '5 numbers', '2s'],
  },
  argTypes: {
    onPlay: { action: 'played' },
    onOpenCog: { action: 'cogOpened' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const Bookmark: Story = {
  args: {
    variant: 'bookmark',
    bookmarkName: 'Skip by 2',
    bookmarkColor: 'amber',
  },
};

export const BookmarkPurple: Story = {
  args: {
    variant: 'bookmark',
    bookmarkName: 'Big to Small',
    bookmarkColor: 'purple',
    chips: ['⬇️ Down', '10 numbers', '3s'],
  },
};
