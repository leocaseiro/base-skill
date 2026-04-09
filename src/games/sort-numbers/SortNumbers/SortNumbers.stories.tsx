// src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { createSortNumbersLevelGenerator } from '../sort-numbers-level-generator';
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

export const SimpleNoDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const SimpleWithDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 'all' },
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const SimpleDescending: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const AdvancedWithFixedStart: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'advanced',
      skip: { mode: 'by', step: 2, start: 3 },
      range: { min: 1, max: 20 },
      rounds: [
        { sequence: [3, 5, 7, 9] },
        { sequence: [3, 5, 7, 9] },
        { sequence: [3, 5, 7, 9] },
      ],
    },
  },
};

export const LevelModeUnlimited: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 2,
          step: 2,
          quantity: 5,
          direction: 'ascending',
        }),
      },
    },
  },
};

export const LevelModeCapped: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 3,
      skip: { mode: 'by', step: 5, start: 5 },
      range: { min: 5, max: 15 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [5, 10, 15] }],
      levelMode: {
        maxLevels: 3,
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 5,
          step: 5,
          quantity: 3,
          direction: 'ascending',
        }),
      },
    },
  },
};

export const LevelModeDescending: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 4,
      skip: { mode: 'by', step: 3, start: 3 },
      range: { min: 3, max: 12 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [3, 6, 9, 12] }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 3,
          step: 3,
          quantity: 4,
          direction: 'descending',
        }),
      },
    },
  },
};
