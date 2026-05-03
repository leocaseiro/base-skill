import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
import type { SpotAllConfig } from '@/games/spot-all/types';
import type { WordSpellConfig } from '@/games/word-spell/types';
import type { GameColorKey } from '@/lib/game-colors';
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
import { DebugPanel } from '@/components/DebugPanel';
import { GameShell } from '@/components/game/GameShell';
import { cumulativeGraphemes } from '@/data/words';
import { getOrCreateDatabase } from '@/db/create-database';
import { useBookmarks } from '@/db/hooks/useBookmarks';
import { useCustomGames } from '@/db/hooks/useCustomGames';
import { lastSessionConfigId } from '@/db/last-session-game-config';
import { NumberMatch } from '@/games/number-match/NumberMatch/NumberMatch';
import { createAdvancedLevelGenerator } from '@/games/sort-numbers/advanced-level-generator';
import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';
import { isRoundsStale } from '@/games/sort-numbers/is-rounds-stale';
import { resolveSimpleConfig } from '@/games/sort-numbers/resolve-simple-config';
import { SortNumbers } from '@/games/sort-numbers/SortNumbers/SortNumbers';
import { resolveSimpleConfig as resolveSpotAllSimpleConfig } from '@/games/spot-all/resolve-simple-config';
import { SpotAll } from '@/games/spot-all/SpotAll/SpotAll';
import { defaultSelection } from '@/games/word-spell/level-unit-selection';
import { resolveSimpleConfig as resolveWordSpellSimpleConfig } from '@/games/word-spell/resolve-simple-config';
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
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  /** Raw persisted `session_history_index.initialContent` for resume flows. */
  persistedContent: Record<string, unknown> | null;
}

const DEFAULT_RECALL_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 4,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'recall',
  tileUnit: 'letter',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      graphemesAllowed: cumulativeGraphemes(1),
      graphemesRequired: defaultSelection().map((u) => ({
        g: u.g,
        p: u.p,
      })),
    },
  },
};

const DEFAULT_PICTURE_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 8,
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      hasVisual: true,
    },
  },
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
  // Deterministic order by default — keeps VR baselines stable (see note above).
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 12 },
  rounds: DEFAULT_NUMBER_MATCH_ROUND_VALUES.map((value) => ({ value })),
});

const makeDefaultSpotAllConfig = (): SpotAllConfig =>
  resolveSpotAllSimpleConfig({
    configMode: 'simple',
    selectedConfusablePairs: [
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
      { pair: ['p', 'q'], type: 'mirror-horizontal' },
    ],
    selectedReversibleChars: [],
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

export const resolveWordSpellConfig = (
  saved: Record<string, unknown> | null,
): WordSpellConfig => {
  const mode =
    (saved as { mode?: unknown } | null)?.mode === 'picture'
      ? 'picture'
      : 'recall';
  const base =
    mode === 'picture' ? DEFAULT_PICTURE_CONFIG : DEFAULT_RECALL_CONFIG;
  const baseClone: WordSpellConfig = {
    ...base,
    rounds: base.rounds
      ? base.rounds.map((r) => ({ ...r }))
      : undefined,
    source: base.source
      ? { ...base.source, filter: { ...base.source.filter } }
      : undefined,
  };

  if (!saved || saved.component !== 'WordSpell') return baseClone;

  // Simple-mode: delegate to word-spell's library-source resolver.
  // Any config with selectedUnits (but not explicitly advanced) was produced
  // by the picker and must be re-resolved so source.filter stays in sync.
  if (
    saved.configMode === 'simple' ||
    (saved.configMode !== 'advanced' &&
      Array.isArray(saved.selectedUnits))
  ) {
    const savedInput = saved.inputMethod;
    return resolveWordSpellSimpleConfig({
      configMode: 'simple',
      ...saved,
      inputMethod:
        savedInput === 'type' || savedInput === 'both'
          ? savedInput
          : 'drag',
    } as Parameters<typeof resolveWordSpellSimpleConfig>[0]);
  }

  // Advanced merge — start from mode-appropriate base, then layer saved
  // fields, then enforce the mode invariant.
  const merged: WordSpellConfig = {
    ...baseClone,
    ...(saved as Partial<WordSpellConfig>),
    gameId: 'word-spell',
    component: 'WordSpell',
  };

  // When the picker set selectedUnits, re-derive source.filter so
  // the filter stays in sync even in advanced mode.
  // Picture mode ignores selectedUnits entirely (no grapheme scope).
  if (
    merged.mode !== 'picture' &&
    Array.isArray(merged.selectedUnits) &&
    merged.source
  ) {
    const derived = resolveWordSpellSimpleConfig({
      configMode: 'simple',
      selectedUnits: merged.selectedUnits,
      region: merged.source.filter.region,
      inputMethod: merged.inputMethod,
    });
    merged.source = derived.source;
  }

  // Mode invariant:
  // recall  ⇒ source defined ∧ rounds undefined
  // picture ⇒ explicit rounds ⇒ honor rounds (drop source); else source with hasVisual ∧ rounds undefined
  if (merged.mode === 'recall') {
    if (merged.rounds) {
      const { rounds: _ignored, ...rest } = merged;
      return rest as WordSpellConfig;
    }
    return merged;
  }

  // mode === 'picture' (or 'sentence-gap' — treat as picture for default fallback)
  // picture with explicit rounds ⇒ honor them, drop source
  if (Array.isArray(merged.rounds) && merged.rounds.length > 0) {
    const { source: _ignored, ...rest } = merged;
    return rest;
  }
  // picture without explicit rounds ⇒ source with hasVisual only, drop rounds
  // Strip grapheme constraints — picture mode uses the full word pool.
  const picture = { ...merged };
  if (picture.rounds) {
    delete picture.rounds;
  }
  const pictureRegion = picture.source?.filter.region ?? 'aus';
  picture.source = {
    type: 'word-library',
    filter: { region: pictureRegion, hasVisual: true },
  };
  return picture;
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

const resolveSpotAllConfig = (
  saved: Record<string, unknown> | null,
): SpotAllConfig => {
  const fallback = makeDefaultSpotAllConfig();
  if (!saved || typeof saved !== 'object') return fallback;

  const merged = { ...fallback, ...saved } as SpotAllConfig;
  if (
    (!Array.isArray(merged.selectedConfusablePairs) ||
      merged.selectedConfusablePairs.length === 0) &&
    (!Array.isArray(merged.selectedReversibleChars) ||
      merged.selectedReversibleChars.length === 0)
  ) {
    return fallback;
  }
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

  // Advanced mode always runs as level mode with a single seeded round; the
  // generator produces a fresh round per level using the configured rules.
  merged.totalRounds = 1;

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
    merged.rounds.length !== 1 ||
    roundsStale
  ) {
    merged.rounds = generateSortRounds({
      range: merged.range,
      quantity: merged.quantity,
      skip: merged.skip,
      totalRounds: 1,
    });
  }

  merged.levelMode = {
    generateNextLevel: createAdvancedLevelGenerator({
      range: merged.range,
      quantity: merged.quantity,
      skip: merged.skip,
      direction: merged.direction,
      tileBankMode: merged.tileBankMode,
      distractors: merged.distractors,
    }),
  };

  return merged;
};

const WordSpellGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  persistedContent,
  debug,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  persistedContent: Record<string, unknown> | null;
  debug: boolean;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const {
    save,
    update,
    remove,
    customGames,
    persistLastSessionConfig,
  } = useCustomGames();
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarkTarget = customGameId
    ? ({ targetType: 'customGame', targetId: customGameId } as const)
    : ({ targetType: 'game', targetId: gameId } as const);
  const navigate = useNavigate({ from: '/$locale/game/$gameId' });
  const existingCustomGameNames = useMemo(
    () =>
      customGames.filter((d) => d.gameId === gameId).map((d) => d.name),
    [customGames, gameId],
  );
  const initial = useMemo(
    () => resolveWordSpellConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  // When draftState is null the user saw the instructions overlay,
  // so there is nothing to resume — discard stale persisted content.
  const hasResumableDraft = draftState !== null;
  const [showInstructions, setShowInstructions] =
    useState(!hasResumableDraft);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);

  const debugPanel = debug ? (
    <DebugPanel
      gameId={gameId}
      resolvedConfig={cfg as unknown as Record<string, unknown>}
      rawSavedConfig={gameSpecificConfig}
      customGame={{
        id: customGameId,
        name: customGameName,
        color: customGameColor,
        cover: customGameCover,
      }}
      session={{
        sessionId,
        seed,
        draftState,
        persistedContent,
      }}
      rounds={cfg.rounds as unknown[]}
    />
  ) : null;

  if (showInstructions) {
    return (
      <>
        <InstructionsOverlay
          text={t('instructions.word-spell')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('word-spell')}
          gameId={gameId}
          cover={customGameCover ?? undefined}
          customGameId={customGameId ?? undefined}
          customGameName={customGameName ?? undefined}
          customGameColor={
            (customGameColor ?? undefined) as GameColorKey | undefined
          }
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}
          onSaveCustomGame={async ({ name, color, config, cover }) =>
            save({
              gameId,
              name,
              color,
              config,
              cover,
            })
          }
          onUpdateCustomGame={
            customGameId
              ? async (name, config, extras) => {
                  await update(customGameId, config, name, extras);
                }
              : undefined
          }
          onDeleteCustomGame={
            customGameId
              ? async (id) => {
                  await remove(id);
                  await navigate({
                    search: (prev) => ({
                      ...prev,
                      configId: undefined,
                    }),
                  });
                }
              : undefined
          }
          existingCustomGameNames={existingCustomGameNames}
          isBookmarked={isBookmarked(bookmarkTarget)}
          onToggleBookmark={() => void toggle(bookmarkTarget)}
          onPersistLastSession={(c) =>
            void persistLastSessionConfig(gameId, c)
          }
        />
        {debugPanel}
      </>
    );
  }

  return (
    <>
      <WordSpell
        key={cfg.inputMethod}
        config={cfg}
        initialState={hasResumableDraft ? draftState : undefined}
        sessionId={sessionId}
        seed={seed}
        persistedContent={hasResumableDraft ? persistedContent : null}
      />
      {debugPanel}
    </>
  );
};

const NumberMatchGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  debug,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  debug: boolean;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const {
    save,
    update,
    remove,
    customGames,
    persistLastSessionConfig,
  } = useCustomGames();
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarkTarget = customGameId
    ? ({ targetType: 'customGame', targetId: customGameId } as const)
    : ({ targetType: 'game', targetId: gameId } as const);
  const navigate = useNavigate({ from: '/$locale/game/$gameId' });
  const existingCustomGameNames = useMemo(
    () =>
      customGames.filter((d) => d.gameId === gameId).map((d) => d.name),
    [customGames, gameId],
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

  const debugPanel = debug ? (
    <DebugPanel
      gameId={gameId}
      resolvedConfig={cfg as unknown as Record<string, unknown>}
      rawSavedConfig={gameSpecificConfig}
      customGame={{
        id: customGameId,
        name: customGameName,
        color: customGameColor,
        cover: customGameCover,
      }}
      session={{
        sessionId,
        seed,
        draftState,
        persistedContent: null,
      }}
      rounds={cfg.rounds as unknown[]}
    />
  ) : null;

  if (showInstructions) {
    return (
      <>
        <InstructionsOverlay
          text={t('instructions.number-match')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('number-match')}
          gameId={gameId}
          cover={customGameCover ?? undefined}
          customGameId={customGameId ?? undefined}
          customGameName={customGameName ?? undefined}
          customGameColor={
            (customGameColor ?? undefined) as GameColorKey | undefined
          }
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveNumberMatchConfig(c))}
          onSaveCustomGame={async ({ name, color, config, cover }) =>
            save({
              gameId,
              name,
              color,
              config,
              cover,
            })
          }
          onUpdateCustomGame={
            customGameId
              ? async (name, config, extras) => {
                  await update(customGameId, config, name, extras);
                }
              : undefined
          }
          onDeleteCustomGame={
            customGameId
              ? async (id) => {
                  await remove(id);
                  await navigate({
                    search: (prev) => ({
                      ...prev,
                      configId: undefined,
                    }),
                  });
                }
              : undefined
          }
          existingCustomGameNames={existingCustomGameNames}
          isBookmarked={isBookmarked(bookmarkTarget)}
          onToggleBookmark={() => void toggle(bookmarkTarget)}
          onPersistLastSession={(c) =>
            void persistLastSessionConfig(gameId, c)
          }
        />
        {debugPanel}
      </>
    );
  }

  return (
    <>
      <NumberMatch
        key={cfg.inputMethod}
        config={cfg}
        initialState={draftState ?? undefined}
        sessionId={sessionId}
        seed={seed}
      />
      {debugPanel}
    </>
  );
};

const SpotAllGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  debug,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  debug: boolean;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const {
    save,
    update,
    remove,
    customGames,
    persistLastSessionConfig,
  } = useCustomGames();
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarkTarget = customGameId
    ? ({ targetType: 'customGame', targetId: customGameId } as const)
    : ({ targetType: 'game', targetId: gameId } as const);
  const navigate = useNavigate({ from: '/$locale/game/$gameId' });
  const existingCustomGameNames = useMemo(
    () =>
      customGames.filter((d) => d.gameId === gameId).map((d) => d.name),
    [customGames, gameId],
  );
  const initial = useMemo(
    () => resolveSpotAllConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(
    draftState === null,
  );
  useEffect(() => {
    setCfg(initial);
  }, [initial]);

  const debugPanel = debug ? (
    <DebugPanel
      gameId={gameId}
      resolvedConfig={cfg as unknown as Record<string, unknown>}
      rawSavedConfig={gameSpecificConfig}
      customGame={{
        id: customGameId,
        name: customGameName,
        color: customGameColor,
        cover: customGameCover,
      }}
      session={{
        sessionId,
        seed,
        draftState: null,
        persistedContent: null,
      }}
      rounds={[]}
    />
  ) : null;

  if (showInstructions) {
    return (
      <>
        <InstructionsOverlay
          text={t('instructions.spot-all')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('spot-all')}
          gameId={gameId}
          cover={customGameCover ?? undefined}
          customGameId={customGameId ?? undefined}
          customGameName={customGameName ?? undefined}
          customGameColor={
            (customGameColor ?? undefined) as GameColorKey | undefined
          }
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(config) =>
            setCfg(resolveSpotAllConfig(config))
          }
          onSaveCustomGame={async ({ name, color, config, cover }) =>
            save({
              gameId,
              name,
              color,
              config,
              cover,
            })
          }
          onUpdateCustomGame={
            customGameId
              ? async (name, config, extras) => {
                  await update(customGameId, config, name, extras);
                }
              : undefined
          }
          onDeleteCustomGame={
            customGameId
              ? async (id) => {
                  await remove(id);
                  await navigate({
                    search: (prev) => ({
                      ...prev,
                      configId: undefined,
                    }),
                  });
                }
              : undefined
          }
          existingCustomGameNames={existingCustomGameNames}
          isBookmarked={isBookmarked(bookmarkTarget)}
          onToggleBookmark={() => void toggle(bookmarkTarget)}
          onPersistLastSession={(c) =>
            void persistLastSessionConfig(gameId, c)
          }
        />
        {debugPanel}
      </>
    );
  }

  return (
    <>
      <SpotAll config={cfg} seed={seed} />
      {debugPanel}
    </>
  );
};

const SortNumbersGameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  debug,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  debug: boolean;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const {
    save,
    update,
    remove,
    customGames,
    persistLastSessionConfig,
  } = useCustomGames();
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarkTarget = customGameId
    ? ({ targetType: 'customGame', targetId: customGameId } as const)
    : ({ targetType: 'game', targetId: gameId } as const);
  const navigate = useNavigate({ from: '/$locale/game/$gameId' });
  const existingCustomGameNames = useMemo(
    () =>
      customGames.filter((d) => d.gameId === gameId).map((d) => d.name),
    [customGames, gameId],
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

  const debugPanel = debug ? (
    <DebugPanel
      gameId={gameId}
      resolvedConfig={cfg as unknown as Record<string, unknown>}
      rawSavedConfig={gameSpecificConfig}
      customGame={{
        id: customGameId,
        name: customGameName,
        color: customGameColor,
        cover: customGameCover,
      }}
      session={{
        sessionId,
        seed,
        draftState,
        persistedContent: null,
      }}
      rounds={cfg.rounds as unknown[]}
    />
  ) : null;

  if (showInstructions) {
    return (
      <>
        <InstructionsOverlay
          text={t('instructions.sort-numbers')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('sort-numbers')}
          gameId={gameId}
          cover={customGameCover ?? undefined}
          customGameId={customGameId ?? undefined}
          customGameName={customGameName ?? undefined}
          customGameColor={
            (customGameColor ?? undefined) as GameColorKey | undefined
          }
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveSortNumbersConfig(c))}
          onSaveCustomGame={async ({ name, color, config, cover }) =>
            save({
              gameId,
              name,
              color,
              config,
              cover,
            })
          }
          onUpdateCustomGame={
            customGameId
              ? async (name, config, extras) => {
                  await update(customGameId, config, name, extras);
                }
              : undefined
          }
          onDeleteCustomGame={
            customGameId
              ? async (id) => {
                  await remove(id);
                  await navigate({
                    search: (prev) => ({
                      ...prev,
                      configId: undefined,
                    }),
                  });
                }
              : undefined
          }
          existingCustomGameNames={existingCustomGameNames}
          isBookmarked={isBookmarked(bookmarkTarget)}
          onToggleBookmark={() => void toggle(bookmarkTarget)}
          onPersistLastSession={(c) =>
            void persistLastSessionConfig(gameId, c)
          }
        />
        {debugPanel}
      </>
    );
  }

  return (
    <>
      <SortNumbers
        key={cfg.inputMethod}
        config={cfg}
        initialState={draftState ?? undefined}
        sessionId={sessionId}
        seed={seed}
      />
      {debugPanel}
    </>
  );
};

const GameBody = ({
  gameId,
  sessionId,
  seed,
  draftState,
  gameSpecificConfig,
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  persistedContent,
  debug,
}: {
  gameId: string;
  sessionId: string;
  seed: string;
  draftState: AnswerGameDraftState | null;
  gameSpecificConfig: Record<string, unknown> | null;
  customGameId: string | null;
  customGameName: string | null;
  customGameColor: string | null;
  customGameCover: Cover | null;
  persistedContent: Record<string, unknown> | null;
  debug: boolean;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    return (
      <SortNumbersGameBody
        gameId={gameId}
        sessionId={sessionId}
        seed={seed}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        customGameId={customGameId}
        customGameName={customGameName}
        customGameColor={customGameColor}
        customGameCover={customGameCover}
        debug={debug}
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
        customGameId={customGameId}
        customGameName={customGameName}
        customGameColor={customGameColor}
        customGameCover={customGameCover}
        persistedContent={persistedContent}
        debug={debug}
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
        customGameId={customGameId}
        customGameName={customGameName}
        customGameColor={customGameColor}
        customGameCover={customGameCover}
        debug={debug}
      />
    );
  }

  if (gameId === 'spot-all') {
    return (
      <SpotAllGameBody
        gameId={gameId}
        sessionId={sessionId}
        seed={seed}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        customGameId={customGameId}
        customGameName={customGameName}
        customGameColor={customGameColor}
        customGameCover={customGameCover}
        debug={debug}
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
  customGameId,
  customGameName,
  customGameColor,
  customGameCover,
  persistedContent,
  debug = false,
}: GameRouteLoaderData & { debug?: boolean }): JSX.Element => (
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
      customGameId={customGameId}
      customGameName={customGameName}
      customGameColor={customGameColor}
      customGameCover={customGameCover}
      persistedContent={persistedContent}
      debug={debug}
    />
  </GameShell>
);

export const buildGamePageTitle = (name: string | null): string =>
  name ? `${name} | BaseSkill` : 'BaseSkill';

const RouteComponent = (): JSX.Element => {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const debug = search.debug === true || import.meta.env.DEV;
  const { t } = useTranslation('games');
  const gameId = data.config.gameId;
  const gameName =
    data.customGameName ?? t(gameId);

  useEffect(() => {
    document.title = buildGamePageTitle(gameName);
    return () => {
      document.title = 'BaseSkill';
    };
  }, [gameName]);

  return <GameRoute {...data} debug={debug} />;
};

export const Route = createFileRoute('/$locale/_app/game/$gameId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { configId: string | undefined; debug?: true } => {
    const debug =
      search.debug === '1' ||
      search.debug === 'true' ||
      search.debug === true;
    return {
      configId:
        typeof search.configId === 'string'
          ? search.configId
          : undefined,
      ...(debug ? { debug: true as const } : {}),
    };
  },
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
        customGameId: null,
        customGameName: null,
        customGameColor: null,
        customGameCover: null,
        persistedContent: null,
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
    let customGameId: string | null = null;
    let customGameName: string | null = null;
    let customGameColor: string | null = null;
    let customGameCover: Cover | null = null;

    if (deps.configId) {
      const savedDoc = await db.custom_games
        .findOne(deps.configId)
        .exec();
      if (savedDoc) {
        gameSpecificConfig = savedDoc.config;
        customGameId = savedDoc.id;
        customGameName = savedDoc.name;
        customGameColor = savedDoc.color;
        customGameCover = savedDoc.cover ?? null;
      }
    } else {
      const lastDoc = await db.saved_game_configs
        .findOne(lastSessionConfigId(gameId))
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
      customGameId,
      customGameName,
      customGameColor,
      customGameCover,
      persistedContent: initialLog
        ? (initialLog.initialContent as unknown as Record<
            string,
            unknown
          >)
        : null,
    };
  },
  component: RouteComponent,
});
