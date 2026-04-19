import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  triggerLabel: string;
  item1: string;
  item2: string;
  item3: string;
}

const meta: Meta<StoryArgs> = {
  component: DropdownMenu as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Options',
    item1: 'Profile',
    item2: 'Settings',
    item3: 'Logout',
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    item1: { control: 'text' },
    item2: { control: 'text' },
    item3: { control: 'text' },
  },
  render: ({ triggerLabel, item1, item2, item3 }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{item1}</DropdownMenuItem>
        <DropdownMenuItem>{item2}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{item3}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const OpensAndSelects: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /options/i }),
    );
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('menu')).toBeVisible();
    });
    await userEvent.click(
      await portal.findByRole('menuitem', { name: /profile/i }),
    );
    await waitFor(() => {
      expect(portal.queryByRole('menu')).toBeNull();
    });
  },
};

export const WithDestructiveItem: Story = {
  render: ({ triggerLabel, item1, item2 }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{item1}</DropdownMenuItem>
        <DropdownMenuItem>{item2}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  args: {
    triggerLabel: 'Account',
    item1: 'Profile',
    item2: 'Settings',
    item3: '',
  },
};
