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
  args: { config: baseConfig },
  decorators: [withDb, withRouter],
};
export default meta;

type Story = StoryObj<typeof NumberMatch>;

export const NumeralToGroup: Story = {};

export const GroupToNumeral: Story = {
  args: { config: { ...baseConfig, mode: 'group-to-numeral' } },
};

export const CardinalNumberToText: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-number-to-text',
      tileStyle: 'fingers',
    },
  },
};

export const CardinalTextToNumber: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-text-to-number',
      tileStyle: 'fingers',
    },
  },
};

export const OrdinalNumberToText: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-number-to-text',
      tileStyle: 'fingers',
    },
  },
};

export const OrdinalTextToNumber: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-text-to-number',
      tileStyle: 'fingers',
    },
  },
};

export const CardinalToOrdinal: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-to-ordinal',
      tileStyle: 'fingers',
    },
  },
};

export const OrdinalToCardinal: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-to-cardinal',
      tileStyle: 'fingers',
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

export const NumeralToGroupLongLabels: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-group',
      tileStyle: 'dots',
      tileBankMode: 'distractors',
      distractorCount: 3,
      range: { min: 10_000, max: 99_999 },
      rounds: [{ value: 10_002 }, { value: 19_467 }, { value: 99_999 }],
    },
  },
};
