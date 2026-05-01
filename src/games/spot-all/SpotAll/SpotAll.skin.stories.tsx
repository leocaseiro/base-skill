import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness, registerSkin } from '@/lib/skin';

const demoSkin: GameSkin = {
  id: 'demo',
  name: 'Demo Teal',
  tokens: {
    '--skin-tile-bg': '#14b8a6',
    '--skin-tile-text': '#fff',
    '--skin-tile-radius': '1rem',
    '--skin-slot-bg': '#f0fdfa',
    '--skin-slot-border': '#2dd4bf',
    '--skin-slot-radius': '1rem',
    '--skin-pip-color': '#0f766e',
    '--skin-pip-divider-color': '#0f766e',
    '--skin-question-audio-bg': '#14b8a6',
  },
};

registerSkin('spot-all', demoSkin);

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
