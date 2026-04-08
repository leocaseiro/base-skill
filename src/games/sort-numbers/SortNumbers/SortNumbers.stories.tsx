// src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: SortNumbersConfig = {
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 2, max: 20 },
  quantity: 4,
  skip: { mode: 'consecutive' },
  distractors: { source: 'random', count: 2 },
  rounds: [
    { sequence: [3, 4, 5, 6] },
    { sequence: [7, 8, 9, 10] },
    { sequence: [11, 12, 13, 14] },
  ],
};

const meta: Meta<typeof SortNumbers> = {
  component: SortNumbers,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof SortNumbers>;

export const Consecutive: Story = {};

export const SkipByStepRangeMin: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'by', step: 3, start: 'range-min' },
      rounds: [
        { sequence: [2, 5, 8, 11] },
        { sequence: [2, 5, 8, 11] },
        { sequence: [2, 5, 8, 11] },
      ],
    },
  },
};

export const SkipRandom: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'random' },
      rounds: [
        { sequence: [2, 7, 12, 18] },
        { sequence: [3, 6, 11, 15] },
        { sequence: [4, 9, 14, 20] },
      ],
    },
  },
};

export const DistractorsRandom: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: { source: 'random', count: 3 },
    },
  },
};

export const DistractorsGapsOnly: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'by', step: 2, start: 'range-min' },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 'all' },
      rounds: [
        { sequence: [2, 4, 6, 8] },
        { sequence: [2, 4, 6, 8] },
        { sequence: [2, 4, 6, 8] },
      ],
    },
  },
};

export const DistractorsFullRange: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: { source: 'full-range', count: 4 },
    },
  },
};
