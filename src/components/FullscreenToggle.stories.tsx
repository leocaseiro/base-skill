import { FullscreenToggle } from './FullscreenToggle';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FullscreenToggle> = {
  component: FullscreenToggle,
  title: 'Components/FullscreenToggle',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Zero-prop chrome button that toggles document-level fullscreen. Wraps the `useFullscreen` hook: renders nothing on browsers without native API support and without the iOS pseudo-fullscreen fallback (e.g. PWA standalone or non-iOS desktop without the Fullscreen API). On iPhone Safari the hook falls back to a CSS pseudo-fullscreen mode so the control still appears.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FullscreenToggle>;

export const Playground: Story = {};
