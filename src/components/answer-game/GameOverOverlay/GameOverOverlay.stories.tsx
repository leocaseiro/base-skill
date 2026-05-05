import { Maximize, Menu, X } from 'lucide-react';
import { fn } from 'storybook/test';

import { GameOverOverlay } from './GameOverOverlay';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';

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

interface StoryArgs {
  stars: number;
  onPlayAgain: () => void;
  onHome: () => void;
  // Raw GameOverOverlay prop shadowed by `stars`; declared here only
  // to hide the react-docgen-inferred row from the Controls panel.
  retryCount?: never;
}

// Maps the user-facing `stars` control back to the `retryCount` the
// component actually accepts. Mirrors the starsFromRetries() thresholds in
// GameOverOverlay.tsx.
const retryCountForStars = (stars: number): number => {
  if (stars >= 5) return 0;
  if (stars === 4) return 1;
  if (stars === 3) return 3;
  if (stars === 2) return 5;
  return 7;
};

const meta: Meta<StoryArgs> = {
  component: GameOverOverlay as unknown as ComponentType<StoryArgs>,
  title: 'AnswerGame/GameOverOverlay',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <GameChromeDecorator>
        <Story />
      </GameChromeDecorator>
    ),
  ],
  args: {
    stars: 5,
    onPlayAgain: fn(),
    onHome: fn(),
  },
  argTypes: {
    stars: { control: { type: 'range', min: 1, max: 5, step: 1 } },
    onPlayAgain: { table: { disable: true } },
    onHome: { table: { disable: true } },
    retryCount: { table: { disable: true } },
  },
  render: ({ stars, onPlayAgain, onHome }) => (
    <GameOverOverlay
      retryCount={retryCountForStars(stars)}
      onPlayAgain={onPlayAgain}
      onHome={onHome}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
