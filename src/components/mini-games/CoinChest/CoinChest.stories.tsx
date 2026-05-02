import { fn } from 'storybook/test';

import { CoinChest } from './CoinChest';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CoinChest> = {
  component: CoinChest,
  title: 'MiniGames/CoinChest',
  tags: ['autodocs'],
  argTypes: {
    starRating: {
      control: { type: 'radio' },
      options: [1, 2, 3, 4, 5] as const,
    },
    onComplete: { table: { disable: true } },
  },
  args: {
    starRating: 3,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof CoinChest>;

export const Playground: Story = {};
