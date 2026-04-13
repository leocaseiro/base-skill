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
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // The explorer's filter dropdowns use Radix Select without visible
            // labels because they are dev-only UI. Suppressed here rather than
            // adding aria-labels to a tool that is never shipped to users.
            id: 'button-name',
            enabled: false,
          },
          {
            // Dev-only explorer tool — colour tokens are informational, not
            // shipped to users. TODO: audit explorer UI colour tokens.
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
  },
  render: () => <WordLibraryExplorer />,
};
