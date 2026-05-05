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
    crackThrottleMs: {
      control: { type: 'range', min: 0, max: 200, step: 10 },
      description:
        'Min ms between crack-sound plays. Higher = fewer cracks per rapid tap. 0 disables throttle.',
    },
    crackMaxConcurrent: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description:
        'Max simultaneous crack voices. Drops new plays past the cap.',
    },
    crackVolume: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
    },
    celebrateVolume: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
    },
    forceReducedMotion: {
      control: { type: 'radio' },
      options: [undefined, true, false],
      labels: {
        undefined: 'OS setting',
        true: 'Force reduced',
        false: 'Force full motion',
      },
      description:
        'Override prefers-reduced-motion for testing the a11y branch.',
    },
    backgroundColor: {
      control: { type: 'color' },
    },
    scaleOverrides: { table: { disable: true } },
    onComplete: { table: { disable: true } },
  },
  args: {
    animal: 'random',
    tapsToHatch: 20,
    crackThrottleMs: 60,
    crackMaxConcurrent: 4,
    crackVolume: 0.8,
    celebrateVolume: 0.9,
    forceReducedMotion: undefined,
    backgroundColor: '#7e48c0',
    onComplete: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DinoEggHatch>;

export const Playground: Story = {};

export const NoThrottle: Story = {
  args: { crackThrottleMs: 0, crackMaxConcurrent: 8 },
};

export const ReducedMotion: Story = {
  args: { forceReducedMotion: true },
};
