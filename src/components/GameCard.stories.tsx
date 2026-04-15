import { GameCard } from './GameCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameCard> = {
  component: GameCard,
  tags: ['autodocs'],
  args: {
    entry: {
      id: 'word-spell',
      titleKey: 'word-spell',
      descriptionKey: 'word-spell-description',
      levels: ['1', '2'],
      subject: 'reading',
      defaultCover: {
        kind: 'emoji',
        emoji: '🔤',
        gradient: ['#fde68a', '#fb923c'],
      },
    },
    savedConfigs: [],
  },
  argTypes: {
    onSaveConfig: { action: 'configSaved' },
    onRemoveConfig: { action: 'configRemoved' },
    onUpdateConfig: { action: 'configUpdated' },
    onPlay: { action: 'played' },
    onPlayWithConfig: { action: 'playedWithConfig' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

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

export const MultiLevel: Story = {
  args: {
    entry: {
      id: 'number-match',
      titleKey: 'number-match',
      descriptionKey: 'number-match-description',
      levels: ['1', '2', '3'],
      subject: 'math',
      defaultCover: {
        kind: 'emoji',
        emoji: '🔢',
        gradient: ['#bae6fd', '#6366f1'],
      },
    },
  },
};

export const EarlyYearsReading: Story = {
  args: {
    entry: {
      id: 'word-spell',
      titleKey: 'word-spell',
      descriptionKey: 'word-spell-description',
      levels: ['PK', 'K'],
      subject: 'reading',
      defaultCover: {
        kind: 'emoji',
        emoji: '🔤',
        gradient: ['#fde68a', '#fb923c'],
      },
    },
  },
};
