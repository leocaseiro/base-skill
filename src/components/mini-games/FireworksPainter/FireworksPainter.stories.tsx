import { fn } from 'storybook/test';

import { FireworksPainter } from './FireworksPainter';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FireworksPainter> = {
  component: FireworksPainter,
  title: 'MiniGames/FireworksPainter',
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'range', min: 5, max: 60, step: 5 },
    },
    showHandHint: { control: 'boolean' },
    onComplete: { table: { disable: true } },
  },
  args: {
    duration: 30,
    showHandHint: true,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof FireworksPainter>;

export const Playground: Story = {};
