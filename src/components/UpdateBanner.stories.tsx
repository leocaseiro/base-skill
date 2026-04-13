import { withRouter } from '../../.storybook/decorators/withRouter';
import { UpdateBanner } from './UpdateBanner';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { ServiceWorkerContext } from '@/lib/service-worker/ServiceWorkerContext';

const withUpdateAvailable: Decorator = (Story) => (
  <ServiceWorkerContext.Provider
    value={{ updateAvailable: true, applyUpdate: () => {} }}
  >
    <Story />
  </ServiceWorkerContext.Provider>
);

const meta: Meta<typeof UpdateBanner> = {
  component: UpdateBanner,
  tags: ['autodocs'],
  decorators: [withUpdateAvailable, withRouter],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof UpdateBanner>;

export const Default: Story = {};

export const OceanLight: Story = {
  parameters: { globals: { theme: 'light' } },
};

export const OceanDark: Story = {
  parameters: { globals: { theme: 'dark' } },
};

export const ForestLight: Story = {
  parameters: { globals: { theme: 'forest-light' } },
};

export const ForestDark: Story = {
  parameters: { globals: { theme: 'forest-dark' } },
};
