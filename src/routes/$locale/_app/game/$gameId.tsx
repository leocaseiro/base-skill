import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnswerGameDraftState } from '@/components/answer-game/types';
import type { Cover } from '@/games/cover-type';
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
import type { InProgressSession } from '@/lib/game-engine/session-finder';
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
import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';
import { isRoundsStale } from '@/games/sort-numbers/is-rounds-stale';
import { resolveSimpleConfig } from '@/games/sort-numbers/resolve-simple-config';
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
  draftState: AnswerGameDraftState | null;
  sessionId: string;
  seed: string;
  meta: SessionMeta;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
  bookmarkCover: Cover | null;
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
  // Deterministic order by default. `buildRoundOrder` shuffles when this is
  // false using a nanoid-based seed (crypto.getRandomValues) which VR tests
  // cannot pin, causing baseline drift. Users can still opt into shuffling
  // via the settings panel.
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: sliceWordSpellRounds(8),
};

/**
 * Deterministic default round values for NumberMatch. Using a fixed sequence
 * (rather than `Math.random`) keeps VR baselines stable across runs — nanoid
 * seeds in the route loader bypass any Math.random pin, so the only reliable
 * fix is to remove randomness from the default config entirely. Users still
 * customise via the settings panel.
 */
const DEFAULT_NUMBER_MATCH_ROUND_VALUES: readonly number[] = [5, 8, 3];

const makeDefaultNumberMatchConfig = (): NumberMatchConfig => ({
  gameId: 'number-match',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'distractors',
  distractorCount: 2,
  totalRounds: 3,
  // Deterministic order by default — see DEFAULT_WORD_SPELL_CONFIG comment.
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 12 },
  rounds: DEFAULT_NUMBER_MATCH_ROUND_VALUES.map((value) => ({ value })),
});

export const resizeNumberMatchRounds = (
  prev: NumberMatchRound[],
  count: number,
  range: { min: number; max: number },
): NumberMatchRound[] => {
  const n = Math.max(1, Math.min(count, 50));
  const span = Math.max(1, range.max - range.min + 1);
  // Deterministic fill: cycle through the range starting at `range.min`. This
  // avoids `Math.random` so defaults stay stable (see note above) and is
  // simple enough for users to understand at a glance. They can override any
  // round value via the settings panel.
  const fillValueAt = (index: number): number =>
    range.min + (index % span);

  // Detect a collapsed state: every round has the same value even though the
  // range allows variety. This happens when the user narrows the range down
  // to a single value (collapsing every round to that value) and then widens
  // it again — without this check the preserved values stay stuck at the
  // collapse point and the player sees the same number every round. Also
  // handles the empty-prev case from a legacy saved config.
  const firstValue = prev[0]?.value;
  const allCollapsed =
    prev.length >= 2 &&
    span > 1 &&
    prev.every((r) => r.value === firstValue);
  if (prev.length === 0 || allCollapsed) {
    return Array.from({ length: n }, (_, i) => ({
      value: fillValueAt(i),
    }));
  }

  const next = prev.slice(0, n).map((r, i) => {
    if (r.value >= range.min && r.value <= range.max) return { ...r };
    return { value: fillValueAt(i) };
  });
  while (next.length < n) {
    next.push({ value: fillValueAt(next.length) });
  }
  return next;
};

const makeDefaultSortNumbersConfig = (): SortNumbersConfig =>
  resolveSimpleConfig({
    configMode: 'simple',
    direction: 'ascending',
    start: 2,
    step: 2,
    quantity: 5,
    distractors: false,
  });

const resolveWordSpellConfig = (
  saved: Record<string, unknown> | null,
): WordSpellConfig => {
  const base: WordSpellConfig = {
    ...DEFAULT_WORD_SPELL_CONFIG,
    rounds: (DEFAULT_WORD_SPELL_CONFIG.rounds ?? []).map((r) => ({
      ...r,
    })),
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

  // Simple mode: resolve from 5 fields
  if (saved.configMode === 'simple') {
    const skip = saved.skip as
      | { step?: number; start?: number }
      | undefined;
    return resolveSimpleConfig({
      configMode: 'simple',
      direction:
        saved.direction === 'descending' ? 'descending' : 'ascending',
      start: typeof skip?.start === 'number' ? skip.start : 2,
      step: typeof skip?.step === 'number' ? skip.step : 2,
      quantity: typeof saved.quantity === 'number' ? saved.quantity : 5,
      distractors: saved.tileBankMode === 'distractors',
    });
  }

  // Advanced mode (existing logic)
  // Migrate legacy allowSkips: boolean → skip: SkipConfig
  let migratedSaved = saved;
  if (!saved.skip && typeof saved.allowSkips === 'boolean') {
    migratedSaved = {
      ...saved,
      skip: saved.allowSkips
        ? { mode: 'random' }
        : { mode: 'consecutive' },
    };
  }

  const merged: SortNumbersConfig = {
    ...base,
    ...(migratedSaved as Partial<SortNumbersConfig>),
    gameId: 'sort-numbers',
    component: 'SortNumbers',
  };

  // Existing saved configs without configMode are treated as advanced
  if (saved.configMode !== 'simple') {
    merged.configMode = 'advanced';
  }

  const tr = Math.max(1, merged.totalRounds);
  merged.totalRounds = tr;

  // Normalize skip: mode 'by' requires step and start.
  if (merged.skip.mode === 'by') {
    const partial = merged.skip as {
      mode: 'by';
      step?: number;
      start?: 'range-min' | 'random' | number;
    };
    merged.skip = {
      mode: 'by',
      step: typeof partial.step === 'number' ? partial.step : 2,
      start: partial.start ?? 'range-min',
    };
  }

  const roundsStale =
    Array.isArray(merged.rounds) &&
    isRoundsStale(merged.rounds, {
      quantity: merged.quantity,
      range: merged.range,
      skip: merged.skip,
    });

  if (
    !Array.isArray(merged.rounds) ||
    merged.rounds.length === 0 ||
    merged.rounds.length !== tr ||
    roundsStale
  ) {
    merged.rounds = generateSortRounds({
      range: merged.range,
      quantity: merged.quantity,
      skip: merged.skip,
      totalRounds: tr,
    });
  }

  // Advanced configs don't support level mode — clear the leaked base default.
  merged.levelMode = undefined;

  return merged;
};

const WordSpellGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
  bookmarkCover,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
  bookmarkCover: Cover | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig, savedConfigs } = useSavedConfigs();
  const existingBookmarkNames = useMemo(
    () =>
      savedConfigs
        .filter((d) => d.gameId === gameId)
        .map((d) => d.name),
    [savedConfigs, gameId],
  );
  const initial = useMemo(
    () => resolveWordSpellConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(
    draftState === null,
  );
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
        gameId={gameId}
        cover={bookmarkCover ?? undefined}
        bookmarkId={bookmarkId ?? undefined}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}
        onSaveBookmark={async ({ name, color, config, cover }) =>
          save({
            gameId,
            name,
            color,
            config,
            cover,
          })
        }
        onUpdateBookmark={
          bookmarkId
            ? async (name, config, extras) => {
                await updateConfig(bookmarkId, config, name, extras);
              }
            : undefined
        }
        existingBookmarkNames={existingBookmarkNames}
      />
    );
  }

  return (
    <WordSpell
      key={cfg.inputMethod}
      config={cfg}
      initialState={draftState ?? undefined}
      sessionId={sessionId}
      seed={seed}
    />
  );
};

const NumberMatchGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
  bookmarkCover,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
  bookmarkCover: Cover | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig, savedConfigs } = useSavedConfigs();
  const existingBookmarkNames = useMemo(
    () =>
      savedConfigs
        .filter((d) => d.gameId === gameId)
        .map((d) => d.name),
    [savedConfigs, gameId],
  );
  const initial = useMemo(
    () => resolveNumberMatchConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(
    draftState === null,
  );
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
        gameId={gameId}
        cover={bookmarkCover ?? undefined}
        bookmarkId={bookmarkId ?? undefined}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveNumberMatchConfig(c))}
        onSaveBookmark={async ({ name, color, config, cover }) =>
          save({
            gameId,
            name,
            color,
            config,
            cover,
          })
        }
        onUpdateBookmark={
          bookmarkId
            ? async (name, config, extras) => {
                await updateConfig(bookmarkId, config, name, extras);
              }
            : undefined
        }
        existingBookmarkNames={existingBookmarkNames}
      />
    );
  }

  return (
    <NumberMatch
      key={cfg.inputMethod}
      config={cfg}
      initialState={draftState ?? undefined}
      sessionId={sessionId}
      seed={seed}
    />
  );
};

const SortNumbersGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
  bookmarkCover,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
  bookmarkCover: Cover | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig, savedConfigs } = useSavedConfigs();
  const existingBookmarkNames = useMemo(
    () =>
      savedConfigs
        .filter((d) => d.gameId === gameId)
        .map((d) => d.name),
    [savedConfigs, gameId],
  );
  const initial = useMemo(
    () => resolveSortNumbersConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(
    draftState === null,
  );
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
        gameId={gameId}
        cover={bookmarkCover ?? undefined}
        bookmarkId={bookmarkId ?? undefined}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={
          (bookmarkColor ?? undefined) as BookmarkColorKey | undefined
        }
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveSortNumbersConfig(c))}
        onSaveBookmark={async ({ name, color, config, cover }) =>
          save({
            gameId,
            name,
            color,
            config,
            cover,
          })
        }
        onUpdateBookmark={
          bookmarkId
            ? async (name, config, extras) => {
                await updateConfig(bookmarkId, config, name, extras);
              }
            : undefined
        }
        existingBookmarkNames={existingBookmarkNames}
      />
    );
  }

  return (
    <SortNumbers
      key={cfg.inputMethod}
      config={cfg}
      initialState={draftState ?? undefined}
      sessionId={sessionId}
      seed={seed}
    />
  );
};

const GameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
  bookmarkCover,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
  bookmarkCover: Cover | null;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    return (
      <SortNumbersGameBody
        gameId={gameId}
        sessionId={sessionId}
        seed={seed}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
        bookmarkCover={bookmarkCover}
      />
    );
  }

  if (gameId === 'word-spell') {
    return (
      <WordSpellGameBody
        gameId={gameId}
        sessionId={sessionId}
        seed={seed}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
        bookmarkCover={bookmarkCover}
      />
    );
  }

  if (gameId === 'number-match') {
    return (
      <NumberMatchGameBody
        gameId={gameId}
        sessionId={sessionId}
        seed={seed}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
        bookmarkCover={bookmarkCover}
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
  draftState,
  sessionId,
  seed,
  meta,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
  bookmarkCover,
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
      sessionId={sessionId}
      seed={seed}
      draftState={draftState}
      gameSpecificConfig={gameSpecificConfig}
      bookmarkId={bookmarkId}
      bookmarkName={bookmarkName}
      bookmarkColor={bookmarkColor}
      bookmarkCover={bookmarkCover}
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
    const defaultConfig = makeDefaultConfig(gameId);

    // Route loaders run server-side (SSR) where IndexedDB is unavailable.
    // Return minimal defaults so the client hydrates and re-runs on the client.
    if (typeof indexedDB === 'undefined') {
      const sessionId = nanoid();
      const seed = nanoid();
      const initialState: GameEngineState = {
        phase: 'instructions',
        roundIndex: 0,
        score: 0,
        streak: 0,
        retryCount: 0,
        content: STUB_CONTENT,
        currentRound: {
          roundId: STUB_CONTENT.rounds[0]?.id ?? '',
          answer: null,
          hintsUsed: 0,
        },
      };
      return {
        config: defaultConfig,
        initialLog: null,
        draftState: null,
        sessionId,
        seed,
        meta: {
          profileId,
          gameId,
          gradeBand: defaultConfig.gradeBand,
          seed,
          initialContent: STUB_CONTENT,
          initialState,
        },
        gameSpecificConfig: null,
        bookmarkId: null,
        bookmarkName: null,
        bookmarkColor: null,
        bookmarkCover: null,
      };
    }

    const db = await getOrCreateDatabase();
    const config = await loadGameConfig(
      gameId,
      profileId,
      defaultConfig.gradeBand,
      db,
      defaultConfig,
    );

    const inProgressSession: InProgressSession | null =
      await findInProgressSession(profileId, gameId, db);
    const initialLog = inProgressSession?.log ?? null;
    const draftState = inProgressSession?.draftState ?? null;

    let gameSpecificConfig: Record<string, unknown> | null = null;
    let bookmarkId: string | null = null;
    let bookmarkName: string | null = null;
    let bookmarkColor: string | null = null;
    let bookmarkCover: Cover | null = null;

    if (deps.configId) {
      const savedDoc = await db.saved_game_configs
        .findOne(deps.configId)
        .exec();
      if (savedDoc) {
        gameSpecificConfig = savedDoc.config;
        bookmarkId = savedDoc.id;
        bookmarkName = savedDoc.name;
        bookmarkColor = savedDoc.color;
        bookmarkCover = savedDoc.cover ?? null;
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
      draftState,
      sessionId,
      seed,
      meta,
      gameSpecificConfig,
      bookmarkId,
      bookmarkName,
      bookmarkColor,
      bookmarkCover,
    };
  },
  component: RouteComponent,
});
