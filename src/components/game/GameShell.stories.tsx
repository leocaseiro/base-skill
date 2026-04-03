// src/components/game/GameShell.stories.tsx
import { withRouter } from '../../../.storybook/decorators/withRouter';
import { GameShell } from './GameShell';
import type {
  GameEngineState,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { createStorybookDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';

const withDb: Decorator = (Story) => (
  <DbProvider openDatabase={createStorybookDatabase}>
    <Story />
  </DbProvider>
);

const content: ResolvedContent = {
  rounds: [
    {
      id: 'r1',
      prompt: { en: 'What sound does "cat" start with?' },
      correctAnswer: 'c',
    },
    {
      id: 'r2',
      prompt: { en: 'What letter comes after A?' },
      correctAnswer: 'b',
    },
    { id: 'r3', prompt: { en: 'Spell "dog"' }, correctAnswer: 'dog' },
  ],
};

const baseConfig: ResolvedGameConfig = {
  gameId: 'word-builder',
  title: { en: 'Word Builder' },
  gradeBand: 'year1-2',
  maxRounds: 3,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: true,
  timerDurationSeconds: 60,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 1,
  score: 1,
  streak: 1,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r2', answer: null, hintsUsed: 0 },
};

const meta_: SessionMeta = {
  profileId: 'storybook-user',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'storybook-seed',
  initialContent: content,
  initialState,
};

const meta = {
  component: GameShell,
  title: 'Game/GameShell',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GameShell>;

export default meta;

type Story = StoryObj<typeof GameShell>;

export const Default: Story = {
  args: {
    config: baseConfig,
    moves: {},
    initialState,
    sessionId: 'storybook-session-001',
    meta: meta_,
    children: (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
        Game component renders here
      </div>
    ),
  },
};

export const NoTimer: Story = {
  args: {
    ...Default.args,
    sessionId: 'storybook-session-002',
    config: {
      ...baseConfig,
      timerVisible: false,
      timerDurationSeconds: null,
    },
  },
};

export const NoUndo: Story = {
  args: {
    ...Default.args,
    sessionId: 'storybook-session-003',
    config: { ...baseConfig, maxUndoDepth: 0 },
  },
};

export const FirstRound: Story = {
  args: {
    ...Default.args,
    sessionId: 'storybook-session-004',
    initialState: {
      ...initialState,
      roundIndex: 0,
      score: 0,
      streak: 0,
    },
  },
};

export const LastRound: Story = {
  args: {
    ...Default.args,
    sessionId: 'storybook-session-005',
    initialState: {
      ...initialState,
      roundIndex: 2,
      score: 2,
      streak: 2,
    },
  },
};
