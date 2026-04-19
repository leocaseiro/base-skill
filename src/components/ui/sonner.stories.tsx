import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { Toaster } from './sonner';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type ToastVariant = 'default' | 'success' | 'error';

interface StoryArgs {
  variant: ToastVariant;
  message: string;
  triggerLabel: string;
}

const withToastUi: Meta['decorators'] = [
  (Story) => (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
    >
      <Story />
      <Toaster />
    </ThemeProvider>
  ),
];

const meta: Meta<StoryArgs> = {
  title: 'UI/Sonner',
  component: Button as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: withToastUi,
  args: {
    variant: 'default',
    message: 'Event registered!',
    triggerLabel: 'Show toast',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'error'] satisfies ToastVariant[],
    },
    message: { control: 'text' },
    triggerLabel: { control: 'text' },
  },
  render: ({ variant, message, triggerLabel }) => {
    const fire = () => {
      if (variant === 'success') return toast.success(message);
      if (variant === 'error') return toast.error(message);
      return toast(message);
    };
    return <Button onClick={fire}>{triggerLabel}</Button>;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = { args: { variant: 'default' } };
export const Success: Story = {
  args: { variant: 'success', message: 'Saved successfully' },
};
export const Error: Story = {
  args: { variant: 'error', message: 'Something went wrong' },
};

export const ShowsToast: Story = {
  args: {
    variant: 'default',
    message: 'Event registered!',
    triggerLabel: 'Show toast',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /show toast/i }),
    );
    const portal = within(document.body);
    await waitFor(async () => {
      const el = await portal.findByText(/event registered/i);
      await expect(el).toBeVisible();
    });
  },
};
