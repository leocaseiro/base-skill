import { ThemeToggle } from './ThemeToggle';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Zero-prop round button that flips the document-root `light`/`dark` class. All state lives inside the component (`useState` + `matchMedia`) — there are no props to drive, so the Playground exposes no controls. Use the global Theme toolbar to preview light vs dark visuals.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Playground: Story = {};
