import { fn } from 'storybook/test';

import { DinoEggHatch } from './DinoEggHatch';
import { ANIMAL_KEYS } from './sprites';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DinoEggHatch> = {
  component: DinoEggHatch,
  title: 'MiniGames/DinoEggHatch',
  tags: ['autodocs'],
  argTypes: {
    animal: {
      control: { type: 'select' },
      options: ['random', ...ANIMAL_KEYS],
    },
    tapsToHatch: {
      control: { type: 'range', min: 4, max: 40, step: 4 },
    },
    onComplete: { table: { disable: true } },
  },
  args: {
    animal: 'random',
    tapsToHatch: 20,
    onComplete: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DinoEggHatch>;

export const Playground: Story = {};
