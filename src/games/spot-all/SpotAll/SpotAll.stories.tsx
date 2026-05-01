import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
    { pair: ['p', 'q'], type: 'mirror-horizontal' },
    { pair: ['b', 'p'], type: 'visual-similarity' },
  ],
  selectedReversibleChars: ['2', '5', 'S'],
  correctTileCount: 3,
  distractorCount: 5,
  totalRounds: 5,

  enabledFontIds: ['sans', 'mono'],
  roundsInOrder: false,
  ttsEnabled: false,
};

const meta: Meta<typeof SpotAll> = {
  title: 'Games/SpotAll/SpotAll',
  component: SpotAll,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig, seed: 'storybook-spot-all-1' },
  argTypes: {
    seed: { control: 'text' },
    config: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof SpotAll>;

export const Playground: Story = {};
