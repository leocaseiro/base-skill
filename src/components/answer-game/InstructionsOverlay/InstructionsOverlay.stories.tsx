import { InstructionsOverlay } from './InstructionsOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const baseArgs = {
  text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  gameId: 'sort-numbers',
  bookmarkColor: 'indigo' as const,
  config: { totalRounds: 5 },
  onConfigChange: () => {},
  onSaveBookmark: async () => 'stub-id',
};

const meta: Meta<typeof InstructionsOverlay> = {
  component: InstructionsOverlay,
  tags: ['autodocs'],
  args: baseArgs,
  argTypes: {
    onStart: { action: 'started' },
    onSaveBookmark: { action: 'bookmarkSaved' },
    onUpdateBookmark: { action: 'bookmarkUpdated' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof InstructionsOverlay>;

export const Default: Story = {};

export const DefaultDark: Story = {
  globals: { theme: 'dark' },
};

export const WithBookmark: Story = {
  args: {
    ...baseArgs,
    bookmarkId: 'abc123',
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'teal',
  },
};

export const WithBookmarkDark: Story = {
  args: {
    ...baseArgs,
    bookmarkId: 'abc123',
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'teal',
  },
  globals: { theme: 'dark' },
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
