import { fn } from 'storybook/test';

import { withRouter } from '../../.storybook/decorators/withRouter';
import { UpdateBanner } from './UpdateBanner';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { ServiceWorkerContext } from '@/lib/service-worker/ServiceWorkerContext';

interface StoryArgs {
  updateAvailable: boolean;
  applyUpdate: () => void;
}

const ServiceWorkerHarness = ({
  updateAvailable,
  applyUpdate,
  children,
}: StoryArgs & { children: ReactNode }) => (
  <ServiceWorkerContext.Provider
    value={{ updateAvailable, applyUpdate }}
  >
    {children}
  </ServiceWorkerContext.Provider>
);

const meta: Meta<StoryArgs> = {
  component: UpdateBanner as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders a primary-coloured "New version available" banner when `ServiceWorkerContext.updateAvailable` is true, the route is not a `/game/` path, and the banner has not been dismissed. The Playground exposes `updateAvailable` and the `applyUpdate` callback via the `ServiceWorkerContext` provider wrapped around the component; the internal `dismissed` state is reachable by clicking the "✕" button. Use the global Theme toolbar to preview the banner across `light` / `dark` / `forest-light` / `forest-dark` / `high-contrast`.',
      },
    },
  },
  args: {
    updateAvailable: true,
    applyUpdate: fn(),
  },
  argTypes: {
    updateAvailable: {
      control: 'boolean',
      description:
        'Toggles `ServiceWorkerContext.updateAvailable`. Banner only renders when true.',
    },
    applyUpdate: { table: { disable: true } },
  },
  render: ({ updateAvailable, applyUpdate }) => (
    <ServiceWorkerHarness
      updateAvailable={updateAvailable}
      applyUpdate={applyUpdate}
    >
      <UpdateBanner />
    </ServiceWorkerHarness>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
