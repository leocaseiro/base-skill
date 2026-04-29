import { withDb } from '../../.storybook/decorators/withDb';
import { withRouter } from '../../.storybook/decorators/withRouter';
import { Header } from './Header';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Header> = {
  component: Header,
  title: 'Components/Header',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    docs: {
      description: {
        component:
          'Zero-prop app-shell header: app title, beta chip, version, docs link, debounced search input, ThemeToggle, and a menu sheet whose panel reads live settings + theme docs from RxDB. Both decorators are required — `withDb` for the sheet panel hooks (`useSettings`, `useRxDB`, `safeGetVoices`) and `withRouter` for the `Link` + `useNavigate` calls. No Playground controls: every visible affordance is either intrinsic to the component or driven by the global Theme + Viewport toolbars.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Header>;

export const Playground: Story = {};
