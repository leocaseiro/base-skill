import { Input } from './input';
import { Label } from './label';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  htmlFor: string;
  children: string;
  placeholder: string;
}

const meta: Meta<StoryArgs> = {
  component: Label as unknown as ComponentType<StoryArgs>,
  title: 'UI/Label',
  tags: ['autodocs'],
  args: {
    htmlFor: 'name',
    children: 'Name',
    placeholder: 'Your name',
  },
  argTypes: {
    htmlFor: { control: 'text' },
    children: { control: 'text' },
    placeholder: { control: 'text' },
  },
  render: ({ htmlFor, children, placeholder }) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <Input id={htmlFor} placeholder={placeholder} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
