import { AuthoringPanel } from './AuthoringPanel';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AuthoringPanel> = {
  component: AuthoringPanel,
  title: 'Data/Authoring/AuthoringPanel',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    initialWord: 'putting',
    onClose: () => {},
    onSaved: () => {},
  },
  argTypes: {
    open: { control: 'boolean' },
    initialWord: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof AuthoringPanel>;

export const Default: Story = {};

export const UnknownWord: Story = {
  args: { initialWord: 'xyzzy' },
};

export const DuplicateOfShipped: Story = {
  args: { initialWord: 'an' },
};

export const LowConfidenceChips: Story = {
  args: { initialWord: 'qxz' },
};
