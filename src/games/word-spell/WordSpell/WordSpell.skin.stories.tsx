import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';
import type { AnswerGameDraftState } from '@/components/answer-game/types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';
import { SkinHarness, registerSkin } from '@/lib/skin';

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
    '--skin-sentence-gap-border': '#ec4899',
    '--skin-question-audio-bg': '#ec4899',
  },
  onCorrectPlace: (zoneIndex, value) => {
    console.log(`[word-spell demo] correct @ ${zoneIndex}: ${value}`);
  },
  onWrongPlace: (zoneIndex, value) => {
    console.log(`[word-spell demo] wrong @ ${zoneIndex}: ${value}`);
  },
};

registerSkin('word-spell', demoSkin);

const fiveRoundConfig: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 5,
  roundsInOrder: true,
  ttsEnabled: false,
  tileUnit: 'letter',
  mode: 'picture',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160?text=cat' },
    { word: 'dog', image: 'https://placehold.co/160?text=dog' },
    { word: 'hen', image: 'https://placehold.co/160?text=hen' },
    { word: 'pig', image: 'https://placehold.co/160?text=pig' },
    { word: 'fox', image: 'https://placehold.co/160?text=fox' },
  ],
};

// Stable tiles/zones for "dog" (round index 1) — used in HUD stories
const dogDraftState = (roundIndex: number): AnswerGameDraftState => ({
  allTiles: [
    { id: 'tile-d', label: 'd', value: 'd' },
    { id: 'tile-g', label: 'g', value: 'g' },
    { id: 'tile-o', label: 'o', value: 'o' },
  ],
  bankTileIds: ['tile-d', 'tile-g', 'tile-o'],
  zones: [
    {
      id: 'z0',
      index: 0,
      expectedValue: 'd',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z1',
      index: 1,
      expectedValue: 'o',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 2,
      expectedValue: 'g',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
  activeSlotIndex: 0,
  phase: 'playing',
  roundIndex,
  retryCount: 0,
  levelIndex: 0,
});

const baseConfig: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 2,
  roundsInOrder: true,
  ttsEnabled: false,
  tileUnit: 'letter',
  mode: 'picture',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160?text=cat' },
    { word: 'dog', image: 'https://placehold.co/160?text=dog' },
  ],
};

const WordSpellWithHarness = ({
  config,
  initialState,
}: {
  config: WordSpellConfig;
  initialState?: AnswerGameDraftState;
}) => (
  <SkinHarness gameId="word-spell">
    {({ skin }) => (
      <WordSpell
        config={{ ...config, skin: skin.id }}
        initialState={initialState}
        seed="storybook"
      />
    )}
  </SkinHarness>
);

const meta: Meta<typeof WordSpellWithHarness> = {
  title: 'Games/WordSpell/Skin Harness',
  component: WordSpellWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof WordSpellWithHarness>;

export const Default: Story = {};

export const HUD_Round2Of5: Story = {
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(1),
  },
};

export const HUD_Round5Of5: Story = {
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(4),
  },
};
