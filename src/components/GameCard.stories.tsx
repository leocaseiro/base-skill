import { fn } from 'storybook/test';

import { GameCard } from './GameCard';
import type { GameColorKey } from '@/lib/game-colors';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { GAME_COLOR_KEYS } from '@/lib/game-colors';

type Variant = 'default' | 'customGame';

interface StoryArgs {
  variant: Variant;
  gameId: string;
  title: string;
  chipsText: string;
  customGameName: string;
  customGameColor: GameColorKey;
  bookmarkable: boolean;
  isBookmarked: boolean;
  // Shadowed raw props — driven by StoryArgs above; hidden from Controls.
  chips?: never;
  cover?: never;
  onPlay?: never;
  onOpenCog?: never;
  onToggleBookmark?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameCard as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    variant: 'default',
    gameId: 'sort-numbers',
    title: 'Count in Order',
    chipsText: '🚀 Up, 5 numbers, 2s',
    customGameName: 'Skip by 2',
    customGameColor: 'indigo',
    bookmarkable: false,
    isBookmarked: false,
  },
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['default', 'customGame'] satisfies Variant[],
    },
    gameId: { control: 'text' },
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
    onPlay: { table: { disable: true } },
    onOpenCog: { table: { disable: true } },
    onToggleBookmark: { table: { disable: true } },
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
  }) => {
    const chips = chipsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const bookmarkProps = bookmarkable
      ? { isBookmarked, onToggleBookmark: fn() }
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
            onPlay={fn()}
            onOpenCog={fn()}
            {...bookmarkProps}
          />
        ) : (
          <GameCard
            variant="default"
            gameId={gameId}
            title={title}
            chips={chips}
            onPlay={fn()}
            onOpenCog={fn()}
            {...bookmarkProps}
          />
        )}
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
