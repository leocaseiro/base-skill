import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness } from '@/lib/skin';

const baseConfig: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
    { pair: ['p', 'q'], type: 'mirror-horizontal' },
  ],
  selectedReversibleChars: [],
  correctTileCount: 3,
  distractorCount: 4,
  totalRounds: 3,

  enabledFontIds: ['sans'],
  roundsInOrder: false,
  ttsEnabled: false,
};

const SpotAllWithHarness = ({ config }: { config: SpotAllConfig }) => (
  <SkinHarness gameId="spot-all">
    {({ skin }) => (
      <SpotAll config={{ ...config }} seed={`skin-${skin.id}`} />
    )}
  </SkinHarness>
);

const meta: Meta<typeof SpotAllWithHarness> = {
  title: 'Games/SpotAll/Skin Harness',
  component: SpotAllWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof SpotAllWithHarness>;

export const Playground: Story = {};
