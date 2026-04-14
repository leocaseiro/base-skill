import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';
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
    { word: 'cat', image: 'https://placehold.co/160?text=🐱' },
    { word: 'dog', image: 'https://placehold.co/160?text=🐶' },
  ],
};

const WordSpellWithHarness = ({
  config,
}: {
  config: WordSpellConfig;
}) => (
  <SkinHarness gameId="word-spell">
    {({ skin }) => <WordSpell config={{ ...config, skin: skin.id }} />}
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
