import { useState } from 'react';
import { fn } from 'storybook/test';
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
import type { ComponentType } from 'react';
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

// ── Custom game component fixture data ──────────────────────────────────────

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

interface ShowcaseBodyProps {
  onConfigChange: (config: Record<string, unknown>) => void;
}

const ShowcaseBody = ({ onConfigChange }: ShowcaseBodyProps) => {
  const [formConfig, setFormConfig] = useState<Record<string, unknown>>(
    {
      inputMethod: 'drag',
      totalRounds: 8,
      ttsEnabled: true,
    },
  );
  return (
    <div className="flex flex-col gap-4 p-4">
      <GameNameChip
        title="Sort Numbers"
        customGameName="Easy Numbers"
        customGameColor="teal"
      />
      <GameNameChip title="Word Spell" subject="reading" />
      <ConfigFormFields
        fields={configFields}
        config={formConfig}
        onChange={(next) => {
          setFormConfig(next);
          onConfigChange(next);
        }}
      />
    </div>
  );
};

// ── Meta ──────────────────────────────────────────────────────────────────

interface StoryArgs {
  onConfigChange: (config: Record<string, unknown>) => void;
  // Shadowed GameShell props — fixed by the showcase, hidden from Controls.
  config?: never;
  moves?: never;
  initialState?: never;
  sessionId?: never;
  meta?: never;
  initialLog?: never;
  children?: never;
}

const meta: Meta<StoryArgs> = {
  component: GameShell as unknown as ComponentType<StoryArgs>,
  title: 'Pages/ThemeShowcase',
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Token-only page composed from GameShell + GameNameChip + ConfigFormFields. Cycle through the registered themes via the toolbar. Form fields are stateful so editing a value updates the rendered preview, and onChange invocations log to the Actions panel.',
      },
    },
  },
  args: {
    onConfigChange: fn(),
  },
  argTypes: {
    onConfigChange: { table: { disable: true } },
    config: { table: { disable: true } },
    moves: { table: { disable: true } },
    initialState: { table: { disable: true } },
    sessionId: { table: { disable: true } },
    meta: { table: { disable: true } },
    initialLog: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  render: ({ onConfigChange }) => (
    <GameShell
      config={shellConfig}
      moves={{}}
      initialState={initialState}
      sessionId="showcase-session"
      meta={sessionMeta}
    >
      <ShowcaseBody onConfigChange={onConfigChange} />
    </GameShell>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
