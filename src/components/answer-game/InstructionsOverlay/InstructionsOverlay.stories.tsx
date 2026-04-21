import { fn } from 'storybook/test';

import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { SaveCustomGameInput } from './InstructionsOverlay';
import type { GameColorKey } from '@/lib/game-colors';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type PlaygroundGameId = 'sort-numbers' | 'word-spell' | 'number-match';

interface StoryArgs {
  text: string;
  gameTitle: string;
  gameId: PlaygroundGameId;
  customGameName: string;
  customGameColor: GameColorKey;
  ttsEnabled: boolean;
  isBookmarked: boolean;
  totalRounds: number;
  onStart: () => void;
  onSaveCustomGame: (input: SaveCustomGameInput) => Promise<string>;
  onUpdateCustomGame: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: unknown; color?: GameColorKey },
  ) => Promise<void>;
  onToggleBookmark: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  // Raw InstructionsOverlay props intentionally hidden from the Controls
  // panel — either shadowed above (config), derived from other controls
  // (customGameId), or not meaningful in the playground (cover,
  // onDeleteCustomGame, existingCustomGameNames).
  config?: never;
  cover?: never;
  customGameId?: never;
  onDeleteCustomGame?: never;
  existingCustomGameNames?: never;
}

const GAME_COLOR_OPTIONS = [
  'indigo',
  'teal',
  'rose',
  'amber',
  'sky',
  'lime',
  'purple',
  'orange',
  'pink',
  'emerald',
  'slate',
  'cyan',
] as const satisfies readonly GameColorKey[];

const GAME_ID_OPTIONS = [
  'sort-numbers',
  'word-spell',
  'number-match',
] as const satisfies readonly PlaygroundGameId[];

const meta: Meta<StoryArgs> = {
  component: InstructionsOverlay as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/InstructionsOverlay',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Pre-game shell: cover, title, instructions, "Let\'s go!" button, inline simple-config form, bookmark + cog affordances. The three real gameIds (`sort-numbers`, `word-spell`, `number-match`) drive the cover art and the inline SimpleConfigForm — pick one to see the actual renderer a game loads at runtime.\n\n**Custom-game mode:** type a non-empty `customGameName` to flip the shell into custom-game mode — the custom name becomes the primary heading, the original gameTitle moves to a coloured subtitle, and the save-on-play dialog is skipped on "Let\'s go!". Leave `customGameName` blank to preview the default game flow (save-on-play dialog prompts for a name).\n\nPlay-flow assertions (save prompt, custom start, cog opens AdvancedConfigModal, bookmark toggle) live in `InstructionsOverlay.test.tsx`; this story is visual-only.',
      },
    },
  },
  args: {
    text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
    gameTitle: 'Sort Numbers',
    gameId: 'sort-numbers',
    customGameName: '',
    customGameColor: 'indigo' as GameColorKey,
    ttsEnabled: false,
    isBookmarked: false,
    totalRounds: 5,
    onStart: fn(),
    onSaveCustomGame: fn(async () => 'stub-id'),
    onUpdateCustomGame: fn(async () => {}),
    onToggleBookmark: fn(),
    onConfigChange: fn(),
  },
  argTypes: {
    text: { control: 'text' },
    gameTitle: { control: 'text' },
    gameId: {
      control: { type: 'select' },
      options: GAME_ID_OPTIONS,
      description:
        'Drives the GameCover art and the inline SimpleConfigForm renderer.',
    },
    customGameName: {
      control: 'text',
      description:
        'Leave empty for default game flow. Non-empty value flips the shell into custom-game mode (custom name heading, gameTitle as coloured subtitle, save-on-play dialog skipped).',
    },
    customGameColor: {
      control: { type: 'select' },
      options: GAME_COLOR_OPTIONS,
      description:
        'Colour applied to the custom-game heading + subtitle. Only visible when customGameName is non-empty.',
    },
    ttsEnabled: { control: 'boolean' },
    isBookmarked: { control: 'boolean' },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    onStart: { table: { disable: true } },
    onSaveCustomGame: { table: { disable: true } },
    onUpdateCustomGame: { table: { disable: true } },
    onToggleBookmark: { table: { disable: true } },
    onConfigChange: { table: { disable: true } },
    config: { table: { disable: true } },
    cover: { table: { disable: true } },
    customGameId: { table: { disable: true } },
    onDeleteCustomGame: { table: { disable: true } },
    existingCustomGameNames: { table: { disable: true } },
  },
  render: ({
    text,
    gameTitle,
    gameId,
    customGameName,
    customGameColor,
    ttsEnabled,
    isBookmarked,
    totalRounds,
    onStart,
    onSaveCustomGame,
    onUpdateCustomGame,
    onToggleBookmark,
    onConfigChange,
  }) => {
    const trimmedCustomName = customGameName.trim();
    const derivedCustomGameId = trimmedCustomName
      ? 'story-custom-id'
      : undefined;
    return (
      <InstructionsOverlay
        text={text}
        gameTitle={gameTitle}
        gameId={gameId}
        customGameColor={customGameColor}
        ttsEnabled={ttsEnabled}
        isBookmarked={isBookmarked}
        config={{ totalRounds }}
        customGameId={derivedCustomGameId}
        customGameName={trimmedCustomName || undefined}
        onStart={onStart}
        onSaveCustomGame={onSaveCustomGame}
        onUpdateCustomGame={onUpdateCustomGame}
        onToggleBookmark={onToggleBookmark}
        onConfigChange={onConfigChange}
      />
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
