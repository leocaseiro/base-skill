import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { GameOverOverlay } from './GameOverOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameOverOverlay> = {
  component: GameOverOverlay,
  tags: ['autodocs'],
  args: {
    retryCount: 0,
    onPlayAgain: fn(),
    onHome: fn(),
  },
  argTypes: {
    retryCount: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
    },
    onPlayAgain: { table: { disable: true } },
    onHome: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof GameOverOverlay>;

export const FiveStars: Story = { args: { retryCount: 0 } };
export const FourStars: Story = { args: { retryCount: 1 } };
export const ThreeStars: Story = { args: { retryCount: 3 } };
export const TwoStars: Story = { args: { retryCount: 5 } };
export const OneStar: Story = { args: { retryCount: 8 } };

export const ClicksPlayAgain: Story = {
  args: { retryCount: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /play again/i }),
    );
    await waitFor(() => {
      expect(args.onPlayAgain).toHaveBeenCalledTimes(1);
    });
  },
};

export const ClicksHome: Story = {
  args: { retryCount: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /home/i }),
    );
    await waitFor(() => {
      expect(args.onHome).toHaveBeenCalledTimes(1);
    });
  },
};
