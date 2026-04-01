import { withRouter } from '../../.storybook/decorators/withRouter';
import { Header } from './Header';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Header> = {
  component: Header,
  tags: ['autodocs'],
  decorators: [withRouter],
};
export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
