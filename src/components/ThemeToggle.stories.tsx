import { ThemeToggle } from './ThemeToggle';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
