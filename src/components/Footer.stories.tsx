import { withRouter } from '../../.storybook/decorators/withRouter';
import { Footer } from './Footer';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Footer> = {
  component: Footer,
  tags: ['autodocs'],
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component:
          'Zero-prop app-shell footer: Settings link, Docs link, and a locale dropdown. Locale + navigation come from the router decorator (`/$locale` memory route), so there are no props for the Playground to drive — it simply mounts the component inside the Storybook router.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Footer>;

export const Playground: Story = {};
