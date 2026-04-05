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
    savedConfigs: [],
    page: 1,
    totalPages: 1,
  },
  argTypes: {
    onSaveConfig: { action: 'configSaved' },
    onRemoveConfig: { action: 'configRemoved' },
    onPlay: { action: 'played' },
    onPlayWithConfig: { action: 'playedWithConfig' },
    onPageChange: { action: 'pageChanged' },
  },
};
export default meta;

type Story = StoryObj<typeof GameGrid>;

export const Default: Story = {};

export const WithSavedConfig: Story = {
  args: {
    savedConfigs: [
      {
        id: 'cfg-1',
        profileId: 'default',
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
        createdAt: new Date().toISOString(),
      },
    ],
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
