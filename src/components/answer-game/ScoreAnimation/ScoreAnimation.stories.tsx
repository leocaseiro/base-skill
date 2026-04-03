import { ScoreAnimation } from './ScoreAnimation';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ScoreAnimation> = {
  component: ScoreAnimation,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ScoreAnimation>;

export const Playing: Story = { args: { visible: false } };
export const Complete: Story = { args: { visible: true } };
