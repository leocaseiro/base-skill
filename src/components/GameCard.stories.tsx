import { fn } from 'storybook/test';

import { GameCard } from './GameCard';
import type { GameColorKey } from '@/lib/game-colors';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { GAME_CATALOG } from '@/games/registry';
import { GAME_COLOR_KEYS } from '@/lib/game-colors';

type Variant = 'default' | 'customGame';

const GAME_IDS = GAME_CATALOG.map((g) => g.id);

interface StoryArgs {
  variant: Variant;
  gameId: string;
  title: string;
  chipsText: string;
  customGameName: string;
  customGameColor: GameColorKey;
  bookmarkable: boolean;
  isBookmarked: boolean;
  onPlay: () => void;
  onOpenCog: () => void;
  onToggleBookmark: () => void;
  // Shadowed raw props — driven by StoryArgs above; hidden from Controls.
  chips?: never;
  cover?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameCard as unknown as ComponentType<StoryArgs>,
  title: 'Components/GameCard',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bookmark-aware game tile used on the homepage and saved-games view. The variant radio toggles between the default cover and the customGame coloured chip; bookmarkable + isBookmarked expose the full bookmark matrix. gameId is a select over the real GAME_CATALOG so the default cover swaps between the three shipped games. The card is wrapped in a w-64 container to mimic GameGrid cell width at xl/2xl breakpoints.',
      },
    },
  },
  args: {
    variant: 'default',
    gameId: 'sort-numbers',
    title: 'Count in Order',
    chipsText: '🚀 Up, 5 numbers, 2s',
    customGameName: 'Skip by 2',
    customGameColor: 'indigo',
    bookmarkable: false,
    isBookmarked: false,
    onPlay: fn(),
    onOpenCog: fn(),
    onToggleBookmark: fn(),
  },
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['default', 'customGame'] satisfies Variant[],
    },
    gameId: {
      control: { type: 'select' },
      options: GAME_IDS,
    },
    title: { control: 'text' },
    chipsText: { control: 'text' },
    customGameName: { control: 'text' },
    customGameColor: {
      control: { type: 'select' },
      options: GAME_COLOR_KEYS,
    },
    bookmarkable: { control: 'boolean' },
    isBookmarked: { control: 'boolean' },
    chips: { table: { disable: true } },
    cover: { table: { disable: true } },
  },
  render: ({
    variant,
    gameId,
    title,
    chipsText,
    customGameName,
    customGameColor,
    bookmarkable,
    isBookmarked,
    onPlay,
    onOpenCog,
    onToggleBookmark,
  }) => {
    const chips = chipsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const bookmarkProps = bookmarkable
      ? { isBookmarked, onToggleBookmark }
      : {};

    return (
      <div className="w-64">
        {variant === 'customGame' ? (
          <GameCard
            variant="customGame"
            gameId={gameId}
            title={title}
            chips={chips}
            customGameName={customGameName || 'Custom'}
            customGameColor={customGameColor}
            onPlay={onPlay}
            onOpenCog={onOpenCog}
            {...bookmarkProps}
          />
        ) : (
          <GameCard
            variant="default"
            gameId={gameId}
            title={title}
            chips={chips}
            onPlay={onPlay}
            onOpenCog={onOpenCog}
            {...bookmarkProps}
          />
        )}
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
