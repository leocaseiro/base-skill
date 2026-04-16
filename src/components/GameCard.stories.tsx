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
    onToggleBookmark: { action: 'bookmarkToggled' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const CustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
  },
};

export const CustomGamePurple: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Big to Small',
    customGameColor: 'purple',
    chips: ['⬇️ Down', '10 numbers', '3s'],
  },
};

export const NotBookmarked: Story = {
  args: {
    variant: 'default',
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const Bookmarked: Story = {
  args: {
    variant: 'default',
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};

export const NotBookmarkedCustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const BookmarkedCustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};
