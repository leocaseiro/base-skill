import { fn } from 'storybook/test';

import { BubblePop } from './BubblePop';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof BubblePop> = {
  component: BubblePop,
  title: 'MiniGames/BubblePop',
  tags: ['autodocs'],
  argTypes: {
    bubbleCount: {
      control: { type: 'range', min: 4, max: 24, step: 2 },
    },
    onComplete: { table: { disable: true } },
  },
  args: {
    bubbleCount: 12,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof BubblePop>;

export const Playground: Story = {};
