import { SpotAllPrompt } from './SpotAllPrompt';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SpotAllPrompt> = {
  title: 'Games/SpotAll/SpotAllPrompt',
  component: SpotAllPrompt,
  tags: ['autodocs'],
  args: { target: 'b' },
  argTypes: {
    target: {
      control: { type: 'select' },
      options: ['b', 'd', 'p', 'q', '2', '9', 'S', 'Z'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof SpotAllPrompt>;

export const Playground: Story = {};
