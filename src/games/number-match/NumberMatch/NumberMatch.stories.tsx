import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: NumberMatchConfig = {
  gameId: 'number-match-storybook',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 5,
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 5 },
  rounds: [{ value: 3 }, { value: 1 }, { value: 5 }],
};

const meta: Meta<typeof NumberMatch> = {
  component: NumberMatch,
  tags: ['autodocs'],
  decorators: [withRouter],
  args: { config: baseConfig },
  decorators: [withDb, withRouter],
};
export default meta;

type Story = StoryObj<typeof NumberMatch>;

export const NumeralToGroup: Story = {};

export const GroupToNumeral: Story = {
  args: { config: { ...baseConfig, mode: 'group-to-numeral' } },
};

export const NumeralToWord: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-word',
      tileStyle: 'fingers',
    },
  },
};

export const WordToNumeral: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'word-to-numeral',
      tileStyle: 'objects',
    },
  },
};

export const DotsStyle: Story = {
  args: { config: { ...baseConfig, tileStyle: 'dots' } },
};
export const ObjectsStyle: Story = {
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'objects',
      rounds: [
        { value: 3, objectImage: 'https://placehold.co/32?text=🍎' },
      ],
    },
  },
};
