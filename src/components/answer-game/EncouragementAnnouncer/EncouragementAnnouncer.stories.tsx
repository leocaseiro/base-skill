import { EncouragementAnnouncer } from './EncouragementAnnouncer';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof EncouragementAnnouncer> = {
  component: EncouragementAnnouncer,
  tags: ['autodocs'],
  argTypes: { onDismiss: { action: 'dismissed' } },
};
export default meta;

type Story = StoryObj<typeof EncouragementAnnouncer>;

export const Hidden: Story = {
  args: { visible: false, message: 'Keep trying!' },
};
export const Visible: Story = {
  args: { visible: true, message: 'Almost! Try again.' },
};
