import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelCompleteOverlay> = {
  component: LevelCompleteOverlay,
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

export const Level1: Story = { args: { level: 1 } };
export const Level3: Story = { args: { level: 3 } };
export const Level10: Story = { args: { level: 10 } };

export const ClicksNextLevel: Story = {
  args: { level: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /next level/i }),
    );
    await waitFor(() => {
      expect(args.onNextLevel).toHaveBeenCalledTimes(1);
    });
  },
};

export const ClicksDone: Story = {
  args: { level: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /done/i }),
    );
    await waitFor(() => {
      expect(args.onDone).toHaveBeenCalledTimes(1);
    });
  },
};
