import { useEffect } from 'react';

import { OfflineIndicator } from './OfflineIndicator';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  isOffline: boolean;
}

const OfflineHarness = ({ isOffline }: StoryArgs) => {
  useEffect(() => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      'onLine',
    );
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: !isOffline,
      writable: true,
      configurable: true,
    });
    globalThis.dispatchEvent(
      new Event(isOffline ? 'offline' : 'online'),
    );
    return () => {
      if (originalDescriptor) {
        Object.defineProperty(
          globalThis.navigator,
          'onLine',
          originalDescriptor,
        );
      }
    };
  }, [isOffline]);

  return <OfflineIndicator />;
};

const meta: Meta<StoryArgs> = {
  component: OfflineIndicator as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a polite-live-region yellow banner when `navigator.onLine` is false; renders null when online. The component is zero-prop — all state comes from the `online` / `offline` window events. The Playground exposes a single `isOffline` boolean that patches `navigator.onLine` and fires the matching event so the banner can be toggled in place. State-assertion coverage lives in `OfflineIndicator.test.tsx`.',
      },
    },
  },
  args: {
    isOffline: true,
  },
  argTypes: {
    isOffline: {
      control: 'boolean',
      description:
        'Drives `navigator.onLine` and dispatches an `online`/`offline` event so the component toggles between rendering the banner and rendering `null`.',
    },
  },
  render: ({ isOffline }) => <OfflineHarness isOffline={isOffline} />,
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
