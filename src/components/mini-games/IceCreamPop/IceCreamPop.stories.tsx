import { fn } from 'storybook/test';

import { IceCreamPop } from './IceCreamPop';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof IceCreamPop> = {
  component: IceCreamPop,
  title: 'MiniGames/IceCreamPop',
  tags: ['autodocs'],
  argTypes: {
    maxScoops: {
      control: { type: 'range', min: 5, max: 30, step: 1 },
    },
    onComplete: { table: { disable: true } },
  },
  args: {
    maxScoops: 15,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof IceCreamPop>;

export const Playground: Story = {};
