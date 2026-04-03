import { GameGrid } from './GameGrid';
import type { GameCatalogEntry } from '@/games/registry';
import type { Meta, StoryObj } from '@storybook/react';

const SAMPLE_ENTRIES: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    levels: ['1', '2'],
    subject: 'math',
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
    bookmarkedIds: new Set(['word-spell']),
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
