import { withDb } from '../../../../.storybook/decorators/withDb';
import { SpotAllPrompt } from './SpotAllPrompt';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SpotAllPrompt> = {
  title: 'Games/SpotAll/SpotAllPrompt',
  component: SpotAllPrompt,
  tags: ['autodocs'],
  decorators: [withDb],
  args: { target: 'b', ttsEnabled: false },
  argTypes: {
    target: {
      control: { type: 'select' },
      options: ['b', 'd', 'p', 'q', '2', '9', 'S', 'Z'],
    },
    ttsEnabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof SpotAllPrompt>;

export const Playground: Story = {};
