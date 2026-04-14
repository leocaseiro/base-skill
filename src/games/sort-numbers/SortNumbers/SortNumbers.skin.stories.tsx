import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness, registerSkin } from '@/lib/skin';

/**
 * Demo skin to prove the harness wires callbacks and tokens end-to-end.
 * Replace or extend with your in-development skin while iterating.
 */
const demoSkin: GameSkin = {
  id: 'demo',
  name: 'Demo Pink',
  tokens: {
    '--skin-tile-bg': '#ec4899',
    '--skin-tile-text': '#fff',
    '--skin-tile-radius': '50%',
    '--skin-slot-bg': '#fdf2f8',
    '--skin-slot-border': '#f472b6',
    '--skin-slot-radius': '50%',
  },
  onCorrectPlace: (zoneIndex, value) => {
    console.log(`[demo skin] correct @ zone ${zoneIndex}: ${value}`);
  },
  onWrongPlace: (zoneIndex, value) => {
    console.log(`[demo skin] wrong @ zone ${zoneIndex}: ${value}`);
  },
};

// Register at module load so `SkinHarness` sees the skin on first render.
registerSkin('sort-numbers', demoSkin);

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
  distractors: { source: 'random', count: 0 },
  rounds: [
    { sequence: [3, 4, 5, 6] },
    { sequence: [7, 8, 9, 10] },
    { sequence: [11, 12, 13, 14] },
  ],
};

const SortNumbersWithHarness = ({
  config,
}: {
  config: SortNumbersConfig;
}) => (
  <SkinHarness gameId="sort-numbers">
    {({ skin }) => (
      <SortNumbers config={{ ...config, skin: skin.id }} />
    )}
  </SkinHarness>
);

const meta: Meta<typeof SortNumbersWithHarness> = {
  title: 'Games/SortNumbers/Skin Harness',
  component: SortNumbersWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof SortNumbersWithHarness>;

export const Default: Story = {};
