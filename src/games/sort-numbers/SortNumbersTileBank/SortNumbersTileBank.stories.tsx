import { withDarkMode } from '../../../../.storybook/decorators';
import { SortNumbersTileBank } from './SortNumbersTileBank';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

const config: AnswerGameConfig = {
  gameId: 'sort-numbers-story',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: [
    { id: 't1', label: '3', value: '3' },
    { id: 't2', label: '7', value: '7' },
    { id: 't3', label: '1', value: '1' },
    { id: 't4', label: '5', value: '5' },
  ],
  initialZones: [
    {
      id: 'z1',
      index: 0,
      expectedValue: '1',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 1,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z3',
      index: 2,
      expectedValue: '5',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z4',
      index: 3,
      expectedValue: '7',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
};

const withProvider = (Story: React.ComponentType) => (
  <AnswerGameProvider config={config}>
    <Story />
  </AnswerGameProvider>
);

const meta: Meta<typeof SortNumbersTileBank> = {
  component: SortNumbersTileBank,
  tags: ['autodocs'],
  decorators: [withProvider],
};
export default meta;

type Story = StoryObj<typeof SortNumbersTileBank>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};
