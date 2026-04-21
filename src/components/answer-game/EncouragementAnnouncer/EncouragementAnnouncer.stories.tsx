import { useState } from 'react';
import { fn } from 'storybook/test';

import { EncouragementAnnouncer } from './EncouragementAnnouncer';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  message: string;
  onDismiss: () => void;
  // Raw EncouragementAnnouncer prop controlled by the story wrapper;
  // declared here only to hide the react-docgen-inferred row from the
  // Controls panel.
  visible?: never;
}

const ShowTrigger = ({
  message,
  onDismiss,
  startVisible = false,
}: {
  message: string;
  onDismiss: () => void;
  startVisible?: boolean;
}) => {
  const [visible, setVisible] = useState(startVisible);
  const dismiss = () => {
    setVisible(false);
    onDismiss();
  };
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setVisible(true)}
        disabled={visible}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        Show encouragement
      </button>
      <button
        type="button"
        onClick={dismiss}
        disabled={!visible}
        className="rounded-lg bg-muted px-4 py-2 text-foreground disabled:opacity-50"
      >
        Dismiss
      </button>
      <EncouragementAnnouncer
        visible={visible}
        message={message}
        onDismiss={dismiss}
      />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  component:
    EncouragementAnnouncer as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/EncouragementAnnouncer',
  tags: ['autodocs'],
  args: {
    message: 'Keep trying!',
    onDismiss: fn(),
  },
  argTypes: {
    message: { control: 'text' },
    onDismiss: { table: { disable: true } },
    visible: { table: { disable: true } },
  },
  render: ({ message, onDismiss }) => (
    <ShowTrigger message={message} onDismiss={onDismiss} startVisible />
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
