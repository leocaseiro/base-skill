import { WordLibraryExplorer } from './WordLibraryExplorer';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WordLibraryExplorer> = {
  title: 'Data/WordLibraryExplorer',
  component: WordLibraryExplorer,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof WordLibraryExplorer>;

export const Default: Story = {
  render: () => <WordLibraryExplorer />,
};
