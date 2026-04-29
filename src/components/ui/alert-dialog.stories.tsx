import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, MouseEventHandler } from 'react';

interface StoryArgs {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  onCancel: MouseEventHandler<HTMLButtonElement>;
}

const meta: Meta<StoryArgs> = {
  component: AlertDialog as unknown as ComponentType<StoryArgs>,
  title: 'UI/AlertDialog',
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Delete account',
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onOpenChange: fn(),
    onConfirm: fn(),
    onCancel: fn(),
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    onOpenChange: { table: { disable: true } },
    onConfirm: { table: { disable: true } },
    onCancel: { table: { disable: true } },
  },
  render: ({
    triggerLabel,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onOpenChange,
    onConfirm,
    onCancel,
  }) => (
    <AlertDialog onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const OpensAndConfirms: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('alertdialog')).toBeVisible();
    });
    await userEvent.click(
      await portal.findByRole('button', { name: /^delete$/i }),
    );
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  },
};

export const CancelsWithEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('alertdialog')).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  },
};

export const Cancelled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await userEvent.click(
      await portal.findByRole('button', { name: /cancel/i }),
    );
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  },
};
