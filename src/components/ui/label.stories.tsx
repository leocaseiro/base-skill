import { Input } from './input';
import { Label } from './label';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Label> = {
  component: Label,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Your name" />
    </div>
  ),
};
