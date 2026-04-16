import { InstructionsOverlay } from './InstructionsOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const baseArgs = {
  text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  gameId: 'sort-numbers',
  customGameColor: 'indigo' as const,
  config: { totalRounds: 5 },
  onConfigChange: () => {},
  onSaveCustomGame: async () => 'stub-id',
};

const meta: Meta<typeof InstructionsOverlay> = {
  component: InstructionsOverlay,
  tags: ['autodocs'],
  args: baseArgs,
  argTypes: {
    onStart: { action: 'started' },
    onSaveCustomGame: { action: 'customGameSaved' },
    onUpdateCustomGame: { action: 'customGameUpdated' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof InstructionsOverlay>;

export const Default: Story = {};

export const WithCustomGame: Story = {
  args: {
    ...baseArgs,
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal',
  },
};

export const WordSpellDefault: Story = {
  args: {
    ...baseArgs,
    text: 'Drag the letters to spell the word.',
    gameTitle: 'Word Spell',
    gameId: 'word-spell',
    config: { inputMethod: 'drag', totalRounds: 8, ttsEnabled: true },
  },
};
