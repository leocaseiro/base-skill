import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

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
  title: 'answer-game/EncouragementAnnouncer',
  tags: ['autodocs'],
  args: {
    message: 'Keep trying!',
    visible: true,
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

export const Playground: Story = {};

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
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /show encouragement/i }),
    );
    await waitFor(() => {
      expect(canvas.getByText(/keep trying/i)).toBeVisible();
    });
    await waitFor(
      () => {
        expect(args.onDismiss).toHaveBeenCalled();
      },
      { timeout: 3500 },
    );
  },
};
