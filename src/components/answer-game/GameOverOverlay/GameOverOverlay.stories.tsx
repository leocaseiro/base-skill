import { GameOverOverlay } from './GameOverOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GameOverOverlay> = {
  component: GameOverOverlay,
  tags: ['autodocs'],
  argTypes: {
    onPlayAgain: { action: 'playAgain' },
    onHome: { action: 'home' },
  },
};
export default meta;

type Story = StoryObj<typeof GameOverOverlay>;

export const FiveStars: Story = { args: { retryCount: 0 } };
export const ThreeStars: Story = { args: { retryCount: 3 } };
export const OneStar: Story = { args: { retryCount: 10 } };
