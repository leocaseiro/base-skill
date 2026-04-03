// src/routes/$locale/_app/game/$gameId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import type { NumberMatchConfig } from '@/games/number-match/types';
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
import { WordSpell } from '@/games/word-spell/WordSpell/WordSpell';
import { loadGameConfig } from '@/lib/game-engine/config-loader';
import { findInProgressSession } from '@/lib/game-engine/session-finder';

// Stub content used until M5 introduces game registrations
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
}

const WORD_SPELL_ROUTE_CONFIG: WordSpellConfig = {
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
  ],
};

const NUMBER_MATCH_RANGE = { min: 1, max: 12 } as const;

const generateRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateXRounds = (
  min: number,
  max: number,
  x: number,
): number[] =>
  Array.from({ length: x }, () => generateRandomNumber(min, max));

const NUMBER_MATCH_ROUTE_CONFIG: NumberMatchConfig = {
  gameId: 'number-match',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'distractors',
  distractorCount: 3,
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: NUMBER_MATCH_RANGE.min, max: NUMBER_MATCH_RANGE.max },
  rounds: generateXRounds(
    NUMBER_MATCH_RANGE.min,
    NUMBER_MATCH_RANGE.max,
    3,
  ).map((value) => ({ value })),
};

const GameBody = ({ gameId }: { gameId: string }): JSX.Element => {
  if (gameId === 'word-spell') {
    return <WordSpell config={WORD_SPELL_ROUTE_CONFIG} />;
  }
  if (gameId === 'number-match') {
    return <NumberMatch config={NUMBER_MATCH_ROUTE_CONFIG} />;
  }
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Game component placeholder — real game in M5</p>
    </div>
  );
};

// Exported for direct testing — accepts loader data as props
export const GameRoute = ({
  config,
  initialLog,
  sessionId,
  meta,
}: GameRouteLoaderData): JSX.Element => (
  <GameShell
    config={config}
    moves={{}}
    initialState={meta.initialState}
    sessionId={sessionId}
    meta={meta}
    initialLog={initialLog ?? undefined}
  >
    <GameBody gameId={config.gameId} />
  </GameShell>
);

// Thin route component wrapper that reads from loader
const RouteComponent = (): JSX.Element => {
  const data = Route.useLoaderData();
  return <GameRoute {...data} />;
};

export const Route = createFileRoute('/$locale/_app/game/$gameId')({
  loader: async ({ params }): Promise<GameRouteLoaderData> => {
    const { gameId } = params;
    const profileId = 'default'; // M5: pull from profile context

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

    return { config, initialLog, sessionId, meta };
  },
  component: RouteComponent,
});
