import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type SheetSide = 'right' | 'left' | 'top' | 'bottom';

interface StoryArgs {
  side: SheetSide;
  triggerLabel: string;
  title: string;
  description: string;
  body: string;
  onOpenChange: (open: boolean) => void;
}

const meta: Meta<StoryArgs> = {
  component: Sheet as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    side: 'right',
    triggerLabel: 'Open sheet',
    title: 'Sheet Title',
    description: 'Sheet description here.',
    body: 'Sheet body content.',
    onOpenChange: fn(),
  },
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['right', 'left', 'top', 'bottom'] satisfies SheetSide[],
    },
    triggerLabel: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    body: { control: 'text' },
    onOpenChange: { table: { disable: true } },
  },
  render: ({
    side,
    triggerLabel,
    title,
    description,
    body,
    onOpenChange,
  }) => (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <p className="p-4 text-sm">{body}</p>
      </SheetContent>
    </Sheet>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const FromRight: Story = { args: { side: 'right' } };
export const FromLeft: Story = { args: { side: 'left' } };
export const FromTop: Story = { args: { side: 'top' } };
export const FromBottom: Story = { args: { side: 'bottom' } };

export const OpensAndClosesOnEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /open sheet/i }),
    );
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('dialog')).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(portal.queryByRole('dialog')).toBeNull();
    });
  },
};
