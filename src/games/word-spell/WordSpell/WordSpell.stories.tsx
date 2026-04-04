import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: WordSpellConfig = {
  gameId: 'word-spell-storybook',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 5,
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160?text=🐱' },
    { word: 'dog', image: 'https://placehold.co/160?text=🐶' },
  ],
};

const meta: Meta<typeof WordSpell> = {
  component: WordSpell,
  tags: ['autodocs'],
  args: { config: baseConfig },
  decorators: [withDb, withRouter],
};
export default meta;

type Story = StoryObj<typeof WordSpell>;

export const PictureMode: Story = {};

export const RecallMode: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'recall',
      tileBankMode: 'distractors',
      distractorCount: 4,
      rounds: [{ word: 'cat' }],
    },
  },
};

export const ScrambleMode: Story = {
  args: { config: { ...baseConfig, mode: 'scramble' } },
};

export const SentenceGapMode: Story = {
  args: {
    config: {
      ...baseConfig,
      mode: 'sentence-gap',
      rounds: [
        {
          word: 'sat',
          image: 'https://placehold.co/160?text=scene',
          sentence: 'The cat ___ on the mat.',
        },
      ],
    },
  },
};

export const WithDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3,
    },
  },
};

export const LockManualWrongTile: Story = {
  args: { config: { ...baseConfig, wrongTileBehavior: 'lock-manual' } },
};
