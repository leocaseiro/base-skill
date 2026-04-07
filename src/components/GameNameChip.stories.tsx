import { withDarkMode } from '../../.storybook/decorators';
import { GameNameChip } from './GameNameChip';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameNameChip> = {
  component: GameNameChip,
  tags: ['autodocs'],
  args: {
    title: 'Word Spell',
  },
};
export default meta;

type Story = StoryObj<typeof GameNameChip>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};

export const WithBookmark: Story = {
  args: {
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'indigo',
  },
};

export const WithBookmarkDark: Story = {
  args: {
    bookmarkName: 'Easy Mode',
    bookmarkColor: 'indigo',
  },
  decorators: [withDarkMode],
};

export const WithSubject: Story = {
  args: { subject: 'reading' },
};

export const WithSubjectDark: Story = {
  args: { subject: 'reading' },
  decorators: [withDarkMode],
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(
        [
          'indigo',
          'teal',
          'rose',
          'amber',
          'sky',
          'lime',
          'purple',
          'orange',
          'pink',
          'emerald',
          'slate',
          'cyan',
        ] as const
      ).map((color) => (
        <GameNameChip
          key={color}
          title="Word Spell"
          bookmarkName={color}
          bookmarkColor={color}
        />
      ))}
    </div>
  ),
};

export const AllColorsDark: Story = {
  ...AllColors,
  decorators: [withDarkMode],
};
