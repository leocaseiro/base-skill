import { fn } from 'storybook/test';

import { FireworksPainter } from './FireworksPainter';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FireworksPainter> = {
  component: FireworksPainter,
  title: 'MiniGames/FireworksPainter',
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'range', min: 5, max: 30, step: 1 },
    },
    showHandHint: { control: 'boolean' },
    onComplete: { table: { disable: true } },
  },
  args: {
    duration: 10,
    showHandHint: true,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof FireworksPainter>;

export const Playground: Story = {};
