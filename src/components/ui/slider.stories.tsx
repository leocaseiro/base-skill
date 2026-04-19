import { expect, userEvent, within } from 'storybook/test';

import { Slider } from './slider';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Slider> = {
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'range', min: 1, max: 200, step: 1 } },
    step: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
  },
};

export const Volume: Story = {
  args: {
    defaultValue: [80],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Volume',
  },
};

export const SpeechRate: Story = {
  args: {
    defaultValue: [10],
    min: 5,
    max: 20,
    step: 1,
    className: 'w-64',
    'aria-label': 'Speech rate',
  },
};

export const KeyboardIncrement: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Keyboard-driven slider',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(thumb).toHaveAttribute('aria-valuenow', '51');
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Disabled slider',
    disabled: true,
  },
};
