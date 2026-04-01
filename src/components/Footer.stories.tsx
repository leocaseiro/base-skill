import { withRouter } from '../../.storybook/decorators/withRouter';
import { Footer } from './Footer';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Footer> = {
  component: Footer,
  tags: ['autodocs'],
  decorators: [withRouter],
};
export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
