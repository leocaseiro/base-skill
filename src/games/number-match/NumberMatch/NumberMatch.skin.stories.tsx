import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness } from '@/lib/skin';

const baseConfig: NumberMatchConfig = {
  gameId: 'number-match',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: true,
  ttsEnabled: false,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 6 },
  rounds: [{ value: 3 }, { value: 5 }, { value: 2 }],
};

const NumberMatchWithHarness = ({
  config,
}: {
  config: NumberMatchConfig;
}) => (
  <SkinHarness gameId="number-match">
    {({ skin }) => (
      <NumberMatch config={{ ...config, skin: skin.id }} />
    )}
  </SkinHarness>
);

const meta: Meta<typeof NumberMatchWithHarness> = {
  title: 'Games/NumberMatch/Skin Harness',
  component: NumberMatchWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof NumberMatchWithHarness>;

export const Default: Story = {};
