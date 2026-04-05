import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import type { NumberMatchConfig } from '@/games/number-match/types';
import type { SortNumbersConfig } from '@/games/sort-numbers/types';
import type { WordSpellConfig } from '@/games/word-spell/types';
import type {
  GameEngineState,
  MoveLog,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { JSX } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { getOrCreateDatabase } from '@/db/create-database';
import { NumberMatch } from '@/games/number-match/NumberMatch/NumberMatch';
import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';
import { SortNumbers } from '@/games/sort-numbers/SortNumbers/SortNumbers';
import { WordSpell } from '@/games/word-spell/WordSpell/WordSpell';
import { loadGameConfig } from '@/lib/game-engine/config-loader';
import { findInProgressSession } from '@/lib/game-engine/session-finder';

const STUB_CONTENT: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Question 1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Question 2' }, correctAnswer: 'B' },
    { id: 'r3', prompt: { en: 'Question 3' }, correctAnswer: 'C' },
  ],
};

const makeDefaultConfig = (gameId: string): ResolvedGameConfig => ({
  gameId,
  title: { en: gameId },
  gradeBand: 'year1-2',
  maxRounds: 3,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: false,
  timerDurationSeconds: null,
  difficulty: 'medium',
});

interface GameRouteLoaderData {
  config: ResolvedGameConfig;
  initialLog: MoveLog | null;
  sessionId: string;
  meta: SessionMeta;
  gameSpecificConfig: Record<string, unknown> | null;
}

const DEFAULT_WORD_SPELL_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
    { word: 'sun', emoji: '☀️' },
    { word: 'pin', emoji: '📌' },
    { word: 'sad', emoji: '☹️' },
    { word: 'ant', emoji: '🐜' },
    { word: 'can', emoji: '🥫' },
    { word: 'mum', emoji: '🤱' },
  ],
};

const makeDefaultNumberMatchConfig = (): NumberMatchConfig => ({
  gameId: 'number-match',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'distractors',
  distractorCount: 2,
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 12 },
  rounds: Array.from({ length: 3 }, () => ({
    value: Math.floor(Math.random() * 12) + 1,
  })),
});

const makeDefaultSortNumbersConfig = (): SortNumbersConfig => ({
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 4,
  roundsInOrder: false,
  ttsEnabled: true,
  direction: 'ascending',
  range: { min: 11, max: 99 },
  quantity: 6,
  allowSkips: true,
  rounds: generateSortRounds({
    range: { min: 11, max: 99 },
    quantity: 6,
    allowSkips: true,
    totalRounds: 8,
  }),
});

const GameBody = ({
  gameId,
  gameSpecificConfig,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    const config =
      (gameSpecificConfig as SortNumbersConfig | null) ??
      makeDefaultSortNumbersConfig();
    return <SortNumbers key={config.inputMethod} config={config} />;
  }

  if (gameId === 'word-spell') {
    const config =
      (gameSpecificConfig as WordSpellConfig | null) ??
      DEFAULT_WORD_SPELL_CONFIG;
    return <WordSpell key={config.inputMethod} config={config} />;
  }

  if (gameId === 'number-match') {
    const config =
      (gameSpecificConfig as NumberMatchConfig | null) ??
      makeDefaultNumberMatchConfig();
    return <NumberMatch key={config.inputMethod} config={config} />;
  }

  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Game not found</p>
    </div>
  );
};

export const GameRoute = ({
  config,
  initialLog,
  sessionId,
  meta,
  gameSpecificConfig,
}: GameRouteLoaderData): JSX.Element => (
  <GameShell
    config={config}
    moves={{}}
    initialState={meta.initialState}
    sessionId={sessionId}
    meta={meta}
    initialLog={initialLog ?? undefined}
  >
    <GameBody
      gameId={config.gameId}
      gameSpecificConfig={gameSpecificConfig}
    />
  </GameShell>
);

const RouteComponent = (): JSX.Element => {
  const data = Route.useLoaderData();
  return <GameRoute {...data} />;
};

export const Route = createFileRoute('/$locale/_app/game/$gameId')({
  validateSearch: (search: Record<string, unknown>) => ({
    configId:
      typeof search.configId === 'string' ? search.configId : undefined,
  }),
  loaderDeps: ({ search }) => ({ configId: search.configId }),
  loader: async ({ params, deps }): Promise<GameRouteLoaderData> => {
    const { gameId } = params;
    const profileId = 'default';

    const db = await getOrCreateDatabase();
    const defaultConfig = makeDefaultConfig(gameId);
    const config = await loadGameConfig(
      gameId,
      profileId,
      defaultConfig.gradeBand,
      db,
      defaultConfig,
    );

    const initialLog = await findInProgressSession(
      profileId,
      gameId,
      db,
    );

    let gameSpecificConfig: Record<string, unknown> | null = null;
    if (deps.configId) {
      const savedDoc = await db.saved_game_configs
        .findOne(deps.configId)
        .exec();
      if (savedDoc) gameSpecificConfig = savedDoc.config;
    }

    const sessionId = initialLog?.sessionId ?? nanoid();
    const seed = initialLog?.seed ?? nanoid();
    const initialContent = initialLog?.initialContent ?? STUB_CONTENT;
    const initialState: GameEngineState = initialLog?.initialState ?? {
      phase: 'instructions',
      roundIndex: 0,
      score: 0,
      streak: 0,
      retryCount: 0,
      content: initialContent,
      currentRound: {
        roundId: initialContent.rounds[0]?.id ?? '',
        answer: null,
        hintsUsed: 0,
      },
    };

    const meta: SessionMeta = {
      profileId,
      gameId,
      gradeBand: config.gradeBand,
      seed,
      initialContent,
      initialState,
    };

    return { config, initialLog, sessionId, meta, gameSpecificConfig };
  },
  component: RouteComponent,
});
