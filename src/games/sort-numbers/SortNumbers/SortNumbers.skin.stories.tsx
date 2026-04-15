import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { createSortNumbersLevelGenerator } from '../sort-numbers-level-generator';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';
import type { AnswerGameDraftState } from '@/components/answer-game/types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';
import { registerSkin } from '@/lib/skin';

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
    console.log(`[sort-numbers demo] correct @ ${zoneIndex}: ${value}`);
  },
  onWrongPlace: (zoneIndex, value) => {
    console.log(`[sort-numbers demo] wrong @ ${zoneIndex}: ${value}`);
  },
};
registerSkin('sort-numbers', demoSkin);

// Stable tiles/zones for sequence [3,4,5] — reused across level stories
const levelDraftState = (
  levelIndex: number,
  phase: AnswerGameDraftState['phase'] = 'playing',
): AnswerGameDraftState => ({
  allTiles: [
    { id: 'tile-3', label: '3', value: '3' },
    { id: 'tile-4', label: '4', value: '4' },
    { id: 'tile-5', label: '5', value: '5' },
  ],
  bankTileIds: ['tile-3', 'tile-4', 'tile-5'],
  zones: [
    {
      id: 'z0',
      index: 0,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z1',
      index: 1,
      expectedValue: '4',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 2,
      expectedValue: '5',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
  activeSlotIndex: 0,
  phase,
  roundIndex: 0,
  retryCount: 0,
  levelIndex,
});

const levelModeConfig: SortNumbersConfig = {
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 1,
  roundsInOrder: true,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 3, max: 15 },
  quantity: 3,
  skip: { mode: 'consecutive' },
  distractors: { source: 'random', count: 0 },
  rounds: [{ sequence: [3, 4, 5] }],
  levelMode: {
    generateNextLevel: createSortNumbersLevelGenerator({
      start: 3,
      step: 1,
      quantity: 3,
      direction: 'ascending',
    }),
  },
};

const mixedModeConfig: SortNumbersConfig = {
  ...levelModeConfig,
  levelMode: {
    maxLevels: 5,
    generateNextLevel: createSortNumbersLevelGenerator({
      start: 3,
      step: 1,
      quantity: 3,
      direction: 'ascending',
    }),
  },
  hud: { showDots: true, showFraction: true, showLevel: true },
};

const meta: Meta<typeof SortNumbers> = {
  title: 'Games/SortNumbers/Skin Harness',
  component: SortNumbers,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: levelModeConfig },
};
export default meta;

type Story = StoryObj<typeof SortNumbers>;

export const LevelMode_Level1: Story = {
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(0),
    seed: 'storybook',
  },
};

export const LevelMode_Level3: Story = {
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook',
  },
};

export const LevelMode_Level10: Story = {
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(9),
    seed: 'storybook',
  },
};

export const LevelMode_LevelCompletePop: Story = {
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2, 'round-complete'),
    seed: 'storybook',
  },
};

export const Mixed_LevelPlusFraction: Story = {
  args: {
    config: mixedModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook',
  },
};
