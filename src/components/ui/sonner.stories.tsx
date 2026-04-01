import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { Button } from './button';
import { Toaster } from './sonner';
import type { Meta, StoryObj } from '@storybook/react';

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

const meta = {
  title: 'UI/Sonner',
  component: Button,
  tags: ['autodocs'],
  decorators: withToastUi,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast('Event registered!')}>
      Show toast
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success('Saved successfully')}>
      Show success
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button onClick={() => toast.error('Something went wrong')}>
      Show error
    </Button>
  ),
};
