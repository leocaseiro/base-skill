import { GameGrid } from './GameGrid';
import type { GameCatalogEntry } from '@/games/registry';
import type { Meta, StoryObj } from '@storybook/react';

const SAMPLE_ENTRIES: GameCatalogEntry[] = [
  {
    id: 'math-addition',
    titleKey: 'math-addition',
    levels: ['1', '2'],
    subject: 'math',
  },
  {
    id: 'math-subtraction',
    titleKey: 'math-subtraction',
    levels: ['1', '2', '3'],
    subject: 'math',
  },
  {
    id: 'placeholder-game',
    titleKey: 'placeholder-game',
    levels: ['PK', 'K'],
    subject: 'letters',
  },
];

const meta: Meta<typeof GameGrid> = {
  component: GameGrid,
  tags: ['autodocs'],
  args: {
    entries: SAMPLE_ENTRIES,
    bookmarkedIds: new Set<string>(),
    page: 1,
    totalPages: 1,
  },
  argTypes: {
    onBookmarkToggle: { action: 'bookmarkToggled' },
    onPlay: { action: 'played' },
    onPageChange: { action: 'pageChanged' },
  },
};
export default meta;

type Story = StoryObj<typeof GameGrid>;

export const Default: Story = {};

export const WithBookmarks: Story = {
  args: {
    bookmarkedIds: new Set(['math-addition']),
  },
};

export const Paginated: Story = {
  args: {
    page: 2,
    totalPages: 5,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
