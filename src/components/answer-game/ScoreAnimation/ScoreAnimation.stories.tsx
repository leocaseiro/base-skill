import { ScoreAnimation } from './ScoreAnimation';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ScoreAnimation> = {
  component: ScoreAnimation,
  title: 'AnswerGame/ScoreAnimation',
  tags: ['autodocs'],
  args: { visible: true },
  argTypes: {
    visible: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof ScoreAnimation>;

export const Playground: Story = {};
