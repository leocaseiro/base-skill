import { fn } from 'storybook/test';

import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelCompleteOverlay> = {
  component: LevelCompleteOverlay,
  title: 'AnswerGame/LevelCompleteOverlay',
  tags: ['autodocs'],
  args: {
    level: 1,
    onNextLevel: fn(),
    onDone: fn(),
  },
  argTypes: {
    level: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    onNextLevel: { table: { disable: true } },
    onDone: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof LevelCompleteOverlay>;

export const Playground: Story = {};
