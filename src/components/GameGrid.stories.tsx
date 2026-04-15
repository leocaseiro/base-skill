import { GameGrid } from './GameGrid';
import type { GameCatalogEntry } from '@/games/registry';
import type { Meta, StoryObj } from '@storybook/react';

const SAMPLE_ENTRIES: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    descriptionKey: 'word-spell-description',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔤',
      gradient: ['#fde68a', '#fb923c'],
    },
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    descriptionKey: 'number-match-description',
    levels: ['1', '2'],
    subject: 'math',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔢',
      gradient: ['#bae6fd', '#6366f1'],
    },
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
    onUpdateConfig: { action: 'configUpdated' },
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
        color: 'indigo',
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
