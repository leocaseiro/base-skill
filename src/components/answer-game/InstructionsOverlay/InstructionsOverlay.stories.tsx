import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { SaveCustomGameInput } from './InstructionsOverlay';
import type { GameColorKey } from '@/lib/game-colors';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  text: string;
  gameTitle: string;
  gameId: string;
  customGameColor: GameColorKey;
  ttsEnabled: boolean;
  isBookmarked: boolean;
  totalRounds: number;
  customGameId: string;
  customGameName: string;
  onStart: () => void;
  onSaveCustomGame: (input: SaveCustomGameInput) => Promise<string>;
  onUpdateCustomGame: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: unknown; color?: GameColorKey },
  ) => Promise<void>;
  onToggleBookmark: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  // Raw InstructionsOverlay props shadowed by StoryArgs above (config)
  // or intentionally omitted. Declared here only to hide their
  // react-docgen-inferred rows from the Controls panel.
  config?: never;
  cover?: never;
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

const meta: Meta<StoryArgs> = {
  component: InstructionsOverlay as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/InstructionsOverlay',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: { layout: 'fullscreen' },
  args: {
    text: 'Listen to each number and drag it into the correct slot to sort from smallest to biggest.',
    gameTitle: 'Sort Numbers',
    gameId: 'sort-numbers',
    customGameColor: 'indigo' as GameColorKey,
    ttsEnabled: false,
    isBookmarked: false,
    totalRounds: 5,
    customGameId: '',
    customGameName: '',
    onStart: fn(),
    onSaveCustomGame: fn(async () => 'stub-id'),
    onUpdateCustomGame: fn(async () => {}),
    onToggleBookmark: fn(),
    onConfigChange: fn(),
  },
  argTypes: {
    text: { control: 'text' },
    gameTitle: { control: 'text' },
    gameId: { control: 'text' },
    customGameColor: {
      control: { type: 'select' },
      options: GAME_COLOR_OPTIONS,
    },
    ttsEnabled: { control: 'boolean' },
    isBookmarked: { control: 'boolean' },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    customGameId: { control: 'text' },
    customGameName: { control: 'text' },
    onStart: { table: { disable: true } },
    onSaveCustomGame: { table: { disable: true } },
    onUpdateCustomGame: { table: { disable: true } },
    onToggleBookmark: { table: { disable: true } },
    onConfigChange: { table: { disable: true } },
    config: { table: { disable: true } },
    cover: { table: { disable: true } },
    onDeleteCustomGame: { table: { disable: true } },
    existingCustomGameNames: { table: { disable: true } },
  },
  render: ({
    text,
    gameTitle,
    gameId,
    customGameColor,
    ttsEnabled,
    isBookmarked,
    totalRounds,
    customGameId,
    customGameName,
    onStart,
    onSaveCustomGame,
    onUpdateCustomGame,
    onToggleBookmark,
    onConfigChange,
  }) => (
    <InstructionsOverlay
      text={text}
      gameTitle={gameTitle}
      gameId={gameId}
      customGameColor={customGameColor}
      ttsEnabled={ttsEnabled}
      isBookmarked={isBookmarked}
      config={{ totalRounds }}
      customGameId={customGameId || undefined}
      customGameName={customGameName || undefined}
      onStart={onStart}
      onSaveCustomGame={onSaveCustomGame}
      onUpdateCustomGame={onUpdateCustomGame}
      onToggleBookmark={onToggleBookmark}
      onConfigChange={onConfigChange}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const WithCustomGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal' as GameColorKey,
  },
};

export const StartsGame: Story = {
  args: {
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
  },
  play: async ({ args }) => {
    const portal = within(document.body);
    await userEvent.click(
      await portal.findByRole('button', { name: /let/i }),
    );
    await waitFor(() => {
      expect(args.onStart).toHaveBeenCalled();
    });
  },
};

export const TogglesBookmark: Story = {
  args: { isBookmarked: false },
  play: async ({ args }) => {
    const portal = within(document.body);
    const bookmarkButton = await portal.findByRole('button', {
      name: /bookmark/i,
    });
    await userEvent.click(bookmarkButton);
    await waitFor(() => {
      expect(args.onToggleBookmark).toHaveBeenCalledTimes(1);
    });
  },
};

export const OpensSettings: Story = {
  play: async () => {
    const portal = within(document.body);
    const settingsButton = await portal.findByRole('button', {
      name: /configure/i,
    });
    await userEvent.click(settingsButton);
    await waitFor(() => {
      expect(
        portal.getByRole('dialog', { name: /advanced settings/i }),
      ).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        portal.queryByRole('dialog', { name: /advanced settings/i }),
      ).toBeNull();
    });
  },
};
