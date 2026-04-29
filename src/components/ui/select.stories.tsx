import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  triggerLabel: string;
  option1: string;
  option2: string;
  option3: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}

const meta: Meta<StoryArgs> = {
  component: Select as unknown as ComponentType<StoryArgs>,
  title: 'UI/Select',
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Select a fruit',
    option1: 'Apple',
    option2: 'Banana',
    option3: 'Orange',
    onValueChange: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    option1: { control: 'text' },
    option2: { control: 'text' },
    option3: { control: 'text' },
    onValueChange: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
  },
  render: ({
    triggerLabel,
    option1,
    option2,
    option3,
    onValueChange,
    onOpenChange,
  }) => (
    <Select onValueChange={onValueChange} onOpenChange={onOpenChange}>
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const Preselected: Story = {
  render: ({
    triggerLabel,
    option1,
    option2,
    option3,
    onValueChange,
    onOpenChange,
  }) => (
    <Select
      defaultValue="banana"
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: ({
    triggerLabel,
    option1,
    option2,
    option3,
    onValueChange,
    onOpenChange,
  }) => (
    <Select
      disabled
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SelectsOption: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('combobox', { name: /select a fruit/i }),
    );
    const portal = within(document.body);
    await userEvent.click(
      portal.getByRole('option', { name: /banana/i }),
    );
    await expect(canvas.getByRole('combobox')).toHaveTextContent(
      /banana/i,
    );
  },
};
