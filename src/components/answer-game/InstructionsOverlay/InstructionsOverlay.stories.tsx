import { withDarkMode } from '../../../../.storybook/decorators';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const baseArgs = {
  text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  bookmarkColor: 'indigo' as const,
  config: { totalRounds: 8 },
  onConfigChange: () => {},
  onSaveBookmark: async () => {},
  configFields: [
    {
      type: 'number' as const,
      key: 'totalRounds',
      label: 'Total rounds',
      min: 1,
      max: 20,
    },
  ],
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
  decorators: [withDarkMode],
};

export const SettingsExpanded: Story = {
  args: {
    ...baseArgs,
    bookmarkName: 'Easy Mode',
  },
};

export const SettingsExpandedDark: Story = {
  args: {
    ...baseArgs,
    bookmarkName: 'Easy Mode',
  },
  decorators: [withDarkMode],
};
