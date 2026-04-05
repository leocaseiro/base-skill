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
    savedConfigs: [],
  },
  argTypes: {
    onSaveConfig: { action: 'configSaved' },
    onRemoveConfig: { action: 'configRemoved' },
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
