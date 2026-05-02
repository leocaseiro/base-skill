import { fn } from 'storybook/test';

import { CoinTap } from './CoinTap';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CoinTap> = {
  component: CoinTap,
  title: 'MiniGames/CoinTap',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    starRating: {
      control: { type: 'radio' },
      options: [1, 2, 3, 4, 5],
    },
    onComplete: { table: { disable: true } },
  },
  args: {
    starRating: 3,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof CoinTap>;

export const Playground: Story = {};
