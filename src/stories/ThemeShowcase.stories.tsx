import { withDb } from '../../.storybook/decorators/withDb';
import { withRouter } from '../../.storybook/decorators/withRouter';
import type { ConfigField } from '@/lib/config-fields';
import type {
  GameEngineState,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { Meta, StoryObj } from '@storybook/react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameShell } from '@/components/game/GameShell';
import { GameNameChip } from '@/components/GameNameChip';

// ── GameShell fixture data ────────────────────────────────────────────────

const content: ResolvedContent = {
  rounds: [
    {
      id: 'r1',
      prompt: { en: 'Sort the numbers' },
      correctAnswer: '1',
    },
  ],
};

const shellConfig: ResolvedGameConfig = {
  gameId: 'theme-showcase',
  title: { en: 'Theme Showcase' },
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
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

const sessionMeta: SessionMeta = {
  profileId: 'storybook-user',
  gameId: 'theme-showcase',
  gradeBand: 'year1-2',
  seed: 'storybook-seed',
  initialContent: content,
  initialState,
};

// ── Bookmark component fixture data ──────────────────────────────────────

const configFields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'Drag' },
      { value: 'type', label: 'Type' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'checkbox',
    key: 'ttsEnabled',
    label: 'Text-to-speech',
  },
];

// ── Story body ────────────────────────────────────────────────────────────

const ShowcaseBody = () => (
  <div className="flex flex-col gap-4 p-4">
    <GameNameChip
      title="Sort Numbers"
      bookmarkName="Easy Numbers"
      bookmarkColor="teal"
    />
    <GameNameChip title="Word Spell" subject="reading" />
    <ConfigFormFields
      fields={configFields}
      config={{ inputMethod: 'drag', totalRounds: 8, ttsEnabled: true }}
      onChange={() => {}}
    />
  </div>
);

// ── Meta ──────────────────────────────────────────────────────────────────

const meta = {
  component: GameShell,
  title: 'Pages/ThemeShowcase',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    config: shellConfig,
    moves: {},
    initialState,
    sessionId: 'showcase-session',
    meta: sessionMeta,
    children: <ShowcaseBody />,
  },
} satisfies Meta<typeof GameShell>;
export default meta;

type Story = StoryObj<typeof GameShell>;

// ── 4 locked-theme VR stories ─────────────────────────────────────────────

export const OceanLight: Story = {
  parameters: { globals: { theme: 'light' } },
};

export const OceanDark: Story = {
  parameters: { globals: { theme: 'dark' } },
};

export const ForestLight: Story = {
  parameters: { globals: { theme: 'forest-light' } },
};

export const ForestDark: Story = {
  parameters: { globals: { theme: 'forest-dark' } },
};
