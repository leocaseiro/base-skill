import { Maximize, Menu, X } from 'lucide-react';
import { fn } from 'storybook/test';

import { FireworksPainter } from './FireworksPainter';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

const ICON_BUTTON_CLASS =
  'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-background/90 text-foreground opacity-80 shadow-sm ring-1 ring-border';

const GameChromeDecorator = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex items-start justify-between gap-3 px-4 pt-4">
      <button
        type="button"
        className={ICON_BUTTON_CLASS}
        aria-label="Menu"
      >
        <Menu aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={ICON_BUTTON_CLASS}
          aria-label="Fullscreen"
        >
          <Maximize aria-hidden className="size-5" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className={ICON_BUTTON_CLASS}
          aria-label="Exit"
        >
          <X aria-hidden className="size-5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  </>
);

const meta: Meta<typeof FireworksPainter> = {
  component: FireworksPainter,
  title: 'MiniGames/FireworksPainter',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <GameChromeDecorator>
        <Story />
      </GameChromeDecorator>
    ),
  ],
  argTypes: {
    duration: {
      control: { type: 'range', min: 5, max: 30, step: 1 },
    },
    showHandHint: { control: 'boolean' },
    onComplete: { table: { disable: true } },
  },
  args: {
    duration: 10,
    showHandHint: true,
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof FireworksPainter>;

export const Playground: Story = {};
