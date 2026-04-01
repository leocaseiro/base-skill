import { OfflineIndicator } from './OfflineIndicator';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const withOffline: Decorator = (Story) => {
  Object.defineProperty(navigator, 'onLine', {
    value: false,
    writable: true,
  });
  return <Story />;
};

const meta: Meta<typeof OfflineIndicator> = {
  component: OfflineIndicator,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof OfflineIndicator>;

export const Online: Story = {};

export const Offline: Story = {
  decorators: [withOffline],
};
