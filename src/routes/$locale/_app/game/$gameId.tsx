import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  NumberMatchConfig,
  NumberMatchRound,
} from '@/games/number-match/types';
import type { SortNumbersConfig } from '@/games/sort-numbers/types';
import type {
  WordSpellConfig,
  WordSpellRound,
} from '@/games/word-spell/types';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type {
  GameEngineState,
  MoveLog,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { JSX } from 'react';
import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';
import { GameShell } from '@/components/game/GameShell';
import { getOrCreateDatabase } from '@/db/create-database';
import { usePersistLastGameConfig } from '@/db/hooks/usePersistLastGameConfig';
import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';
import { lastSessionSavedConfigId } from '@/db/last-session-game-config';
import { NumberMatch } from '@/games/number-match/NumberMatch/NumberMatch';
import { numberMatchConfigFields } from '@/games/number-match/types';
import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';
import { SortNumbers } from '@/games/sort-numbers/SortNumbers/SortNumbers';
import { sortNumbersConfigFields } from '@/games/sort-numbers/types';
import { wordSpellConfigFields } from '@/games/word-spell/types';
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
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}

const WORD_SPELL_ROUND_POOL: WordSpellRound[] = [
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'sun', emoji: '☀️' },
  { word: 'pin', emoji: '📌' },
  { word: 'sad', emoji: '☹️' },
  { word: 'ant', emoji: '🐜' },
  { word: 'can', emoji: '🥫' },
  { word: 'mum', emoji: '🤱' },
];

const sliceWordSpellRounds = (count: number): WordSpellRound[] => {
  const n = Math.max(1, Math.min(count, WORD_SPELL_ROUND_POOL.length));
  return WORD_SPELL_ROUND_POOL.slice(0, n).map((r) => ({ ...r }));
};

const DEFAULT_WORD_SPELL_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 8,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: sliceWordSpellRounds(8),
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

const resizeNumberMatchRounds = (
  prev: NumberMatchRound[],
  count: number,
  range: { min: number; max: number },
): NumberMatchRound[] => {
  const n = Math.max(1, Math.min(count, 50));
  const next = prev.slice(0, n).map((r) => ({ ...r }));
  const span = Math.max(1, range.max - range.min + 1);
  while (next.length < n) {
    next.push({
      value: range.min + Math.floor(Math.random() * span),
    });
  }
  return next;
};

const makeDefaultSortNumbersConfig = (): SortNumbersConfig => ({
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 8,
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

const resolveWordSpellConfig = (
  saved: Record<string, unknown> | null,
): WordSpellConfig => {
  const base: WordSpellConfig = {
    ...DEFAULT_WORD_SPELL_CONFIG,
    rounds: DEFAULT_WORD_SPELL_CONFIG.rounds.map((r) => ({ ...r })),
  };
  if (!saved || saved.component !== 'WordSpell') return base;
  const merged: WordSpellConfig = {
    ...base,
    ...(saved as Partial<WordSpellConfig>),
    gameId: 'word-spell',
    component: 'WordSpell',
  };
  const targetTotal = Math.max(
    1,
    Math.min(
      merged.totalRounds > 0 ? merged.totalRounds : base.totalRounds,
      WORD_SPELL_ROUND_POOL.length,
    ),
  );
  if (
    !Array.isArray(merged.rounds) ||
    merged.rounds.length === 0 ||
    merged.rounds.length !== targetTotal
  ) {
    merged.rounds = sliceWordSpellRounds(targetTotal);
  }
  merged.totalRounds = merged.rounds.length;
  return merged;
};

const resolveNumberMatchConfig = (
  saved: Record<string, unknown> | null,
): NumberMatchConfig => {
  const base = makeDefaultNumberMatchConfig();
  if (!saved || saved.component !== 'NumberMatch') return base;
  const merged: NumberMatchConfig = {
    ...base,
    ...(saved as Partial<NumberMatchConfig>),
    gameId: 'number-match',
    component: 'NumberMatch',
  };
  const targetLen =
    merged.totalRounds > 0 ? merged.totalRounds : base.totalRounds;
  merged.rounds = resizeNumberMatchRounds(
    Array.isArray(merged.rounds) ? merged.rounds : [],
    targetLen,
    merged.range,
  );
  return merged;
};

const resolveSortNumbersConfig = (
  saved: Record<string, unknown> | null,
): SortNumbersConfig => {
  const base = makeDefaultSortNumbersConfig();
  if (!saved || saved.component !== 'SortNumbers') return base;
  const merged: SortNumbersConfig = {
    ...base,
    ...(saved as Partial<SortNumbersConfig>),
    gameId: 'sort-numbers',
    component: 'SortNumbers',
  };
  const tr = Math.max(1, merged.totalRounds);
  merged.totalRounds = tr;
  if (
    !Array.isArray(merged.rounds) ||
    merged.rounds.length === 0 ||
    merged.rounds.length !== tr
  ) {
    merged.rounds = generateSortRounds({
      range: merged.range,
      quantity: merged.quantity,
      allowSkips: merged.allowSkips,
      totalRounds: tr,
    });
  }
  return merged;
};

const WordSpellGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveWordSpellConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  usePersistLastGameConfig(
    gameId,
    cfg as unknown as Record<string, unknown>,
  );

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.word-spell')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('word-spell')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        subject="reading"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={wordSpellConfigFields}
      />
    );
  }

  return <WordSpell key={cfg.inputMethod} config={cfg} />;
};

const NumberMatchGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveNumberMatchConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  usePersistLastGameConfig(
    gameId,
    cfg as unknown as Record<string, unknown>,
  );

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.number-match')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('number-match')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        subject="math"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveNumberMatchConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={numberMatchConfigFields}
      />
    );
  }

  return <NumberMatch key={cfg.inputMethod} config={cfg} />;
};

const SortNumbersGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveSortNumbersConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  usePersistLastGameConfig(
    gameId,
    cfg as unknown as Record<string, unknown>,
  );

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.sort-numbers')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('sort-numbers')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        subject="math"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveSortNumbersConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={sortNumbersConfigFields}
      />
    );
  }

  return <SortNumbers key={cfg.inputMethod} config={cfg} />;
};

const GameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    return (
      <SortNumbersGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
  }

  if (gameId === 'word-spell') {
    return (
      <WordSpellGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
  }

  if (gameId === 'number-match') {
    return (
      <NumberMatchGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
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
  bookmarkId,
  bookmarkName,
  bookmarkColor,
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
      bookmarkId={bookmarkId}
      bookmarkName={bookmarkName}
      bookmarkColor={bookmarkColor}
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
    let bookmarkId: string | null = null;
    let bookmarkName: string | null = null;
    let bookmarkColor: string | null = null;

    if (deps.configId) {
      const savedDoc = await db.saved_game_configs
        .findOne(deps.configId)
        .exec();
      if (savedDoc) {
        gameSpecificConfig = savedDoc.config;
        bookmarkId = savedDoc.id;
        bookmarkName = savedDoc.name;
        bookmarkColor = savedDoc.color;
      }
    } else {
      const lastDoc = await db.saved_game_configs
        .findOne(lastSessionSavedConfigId(gameId))
        .exec();
      if (lastDoc) gameSpecificConfig = lastDoc.config;
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

    return {
      config,
      initialLog,
      sessionId,
      meta,
      gameSpecificConfig,
      bookmarkId,
      bookmarkName,
      bookmarkColor,
    };
  },
  component: RouteComponent,
});
