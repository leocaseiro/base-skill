import { withDarkMode } from '../../.storybook/decorators';
import { SavedConfigChip } from './SavedConfigChip';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { ConfigField } from '@/lib/config-fields';
import type { Meta, StoryObj } from '@storybook/react';

const mockDoc: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: { inputMethod: 'drag', totalRounds: 8, mode: 'picture' },
  createdAt: new Date().toISOString(),
  color: 'indigo',
};

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'Drag' },
      { value: 'type', label: 'Type' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
];

const meta: Meta<typeof SavedConfigChip> = {
  component: SavedConfigChip,
  tags: ['autodocs'],
  args: {
    doc: mockDoc,
    configFields: fields,
    onPlay: () => {},
    onDelete: () => {},
    onSave: async () => {},
  },
  argTypes: {
    onPlay: { action: 'played' },
    onDelete: { action: 'deleted' },
    onSave: { action: 'saved' },
  },
};
export default meta;

type Story = StoryObj<typeof SavedConfigChip>;

export const Collapsed: Story = {};

export const CollapsedDark: Story = {
  decorators: [withDarkMode],
};

export const TealColor: Story = {
  args: { doc: { ...mockDoc, color: 'teal' } },
};

export const TealColorDark: Story = {
  args: { doc: { ...mockDoc, color: 'teal' } },
  decorators: [withDarkMode],
};
