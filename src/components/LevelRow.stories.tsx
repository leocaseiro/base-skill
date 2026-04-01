import { LevelRow } from './LevelRow';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelRow> = {
  component: LevelRow,
  tags: ['autodocs'],
  args: {
    currentLevel: '',
  },
  argTypes: {
    onLevelChange: { action: 'levelChanged' },
  },
};
export default meta;

type Story = StoryObj<typeof LevelRow>;

export const AllSelected: Story = {
  args: { currentLevel: '' },
};

export const KindergartenSelected: Story = {
  args: { currentLevel: 'K' },
};

export const Grade3Selected: Story = {
  args: { currentLevel: '3' },
};
