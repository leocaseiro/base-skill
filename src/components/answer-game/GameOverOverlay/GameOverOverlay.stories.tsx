import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { GameOverOverlay } from './GameOverOverlay';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  stars: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

// Maps the user-facing `stars` control back to the `retryCount` the
// component actually accepts. Mirrors the starsFromRetries() thresholds in
// GameOverOverlay.tsx.
const retryCountForStars = (stars: number): number => {
  if (stars >= 5) return 0;
  if (stars === 4) return 1;
  if (stars === 3) return 3;
  if (stars === 2) return 5;
  return 7;
};

const meta: Meta<StoryArgs> = {
  component: GameOverOverlay as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/GameOverOverlay',
  tags: ['autodocs'],
  args: {
    stars: 5,
    onPlayAgain: fn(),
    onHome: fn(),
  },
  argTypes: {
    stars: { control: { type: 'range', min: 1, max: 5, step: 1 } },
    onPlayAgain: { table: { disable: true } },
    onHome: { table: { disable: true } },
  },
  render: ({ stars, onPlayAgain, onHome }) => (
    <GameOverOverlay
      retryCount={retryCountForStars(stars)}
      onPlayAgain={onPlayAgain}
      onHome={onHome}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};

export const ClicksPlayAgain: Story = {
  args: { stars: 5 },
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
  args: { stars: 5 },
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
