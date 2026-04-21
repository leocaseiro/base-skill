import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { vi } from 'vitest';

import { EncouragementAnnouncer } from './EncouragementAnnouncer';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const ShowTrigger = ({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setVisible(true)}
        disabled={visible}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        Show encouragement
      </button>
      <EncouragementAnnouncer
        visible={visible}
        message={message}
        onDismiss={() => {
          setVisible(false);
          onDismiss();
        }}
      />
    </>
  );
};

const meta: Meta<StoryArgs> = {
  component:
    EncouragementAnnouncer as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    message: 'Keep trying!',
    visible: false,
    onDismiss: fn(),
  },
  argTypes: {
    message: { control: 'text' },
    visible: { control: 'boolean' },
    onDismiss: { table: { disable: true } },
  },
  render: ({ message, visible, onDismiss }) => (
    <EncouragementAnnouncer
      message={message}
      visible={visible}
      onDismiss={onDismiss}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Hidden: Story = {
  args: { visible: false, message: 'Keep trying!' },
};

export const Visible: Story = {
  args: { visible: true, message: 'Almost! Try again.' },
};

export const ReplayTrigger: Story = {
  args: { message: 'Great job!' },
  render: ({ message, onDismiss }) => (
    <ShowTrigger message={message} onDismiss={onDismiss} />
  ),
};

export const AutoDismissesAfter2s: Story = {
  args: { message: 'Keep trying!' },
  render: ({ message, onDismiss }) => (
    <ShowTrigger message={message} onDismiss={onDismiss} />
  ),
  play: async ({ args, canvasElement }) => {
    vi.useFakeTimers();
    try {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole('button', { name: /show encouragement/i }),
      );
      await waitFor(() => {
        expect(canvas.getByText(/keep trying/i)).toBeVisible();
      });
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(args.onDismiss).toHaveBeenCalled();
      });
    } finally {
      vi.useRealTimers();
    }
  },
};
