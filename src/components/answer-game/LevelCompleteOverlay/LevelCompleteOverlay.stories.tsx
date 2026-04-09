import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelCompleteOverlay> = {
  component: LevelCompleteOverlay,
  tags: ['autodocs'],
  argTypes: {
    onNextLevel: { action: 'nextLevel' },
    onDone: { action: 'done' },
  },
};
export default meta;

type Story = StoryObj<typeof LevelCompleteOverlay>;

export const Level1: Story = { args: { level: 1 } };
export const Level3: Story = { args: { level: 3 } };
export const Level10: Story = { args: { level: 10 } };
