import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import type {
  NumberMatchConfig,
  NumberMatchRound,
} from '@/games/number-match/types';
import type { SortNumbersConfig } from '@/games/sort-numbers/types';
import type {
  WordSpellConfig,
  WordSpellRound,
} from '@/games/word-spell/types';
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

const SortNumbersConfigPanel = ({
  config,
  onChange,
}: {
  config: SortNumbersConfig;
  onChange: (c: SortNumbersConfig) => void;
}) => {
  const [open, setOpen] = useState(false);

  const regenerate = (next: SortNumbersConfig) => {
    onChange({
      ...next,
      rounds: generateSortRounds({
        range: next.range,
        quantity: next.quantity,
        allowSkips: next.allowSkips,
        totalRounds: next.totalRounds,
      }),
    });
  };

  return (
    <details
      open={open}
      onToggle={(e) =>
        setOpen((e.currentTarget as HTMLDetailsElement).open)
      }
      className="fixed right-4 top-40 z-50 max-h-[min(70vh,calc(100vh-8rem))] w-72 overflow-y-auto rounded-lg border bg-background p-3 text-sm shadow-lg"
    >
      <summary className="cursor-pointer font-medium">
        ⚙️ Game Config
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Input method
          <select
            value={config.inputMethod}
            onChange={(e) =>
              onChange({
                ...config,
                inputMethod: e.target
                  .value as SortNumbersConfig['inputMethod'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="drag">drag</option>
            <option value="type">type</option>
            <option value="both">both</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Wrong tile behaviour
          <select
            value={config.wrongTileBehavior}
            onChange={(e) =>
              onChange({
                ...config,
                wrongTileBehavior: e.target
                  .value as SortNumbersConfig['wrongTileBehavior'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="reject">reject</option>
            <option value="lock-manual">lock-manual</option>
            <option value="lock-auto-eject">lock-auto-eject</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Tile bank mode
          <select
            value={config.tileBankMode}
            onChange={(e) =>
              onChange({
                ...config,
                tileBankMode: e.target
                  .value as SortNumbersConfig['tileBankMode'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="exact">exact</option>
            <option value="distractors">distractors</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Total rounds
          <input
            type="number"
            value={config.totalRounds}
            min={1}
            max={30}
            onChange={(e) => {
              const totalRounds = Number(e.target.value);
              regenerate({ ...config, totalRounds });
            }}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.roundsInOrder === true}
            onChange={(e) =>
              onChange({ ...config, roundsInOrder: e.target.checked })
            }
          />
          Rounds in order
        </label>
        <label className="flex flex-col gap-1">
          Direction
          <select
            value={config.direction}
            onChange={(e) =>
              onChange({
                ...config,
                direction: e.target
                  .value as SortNumbersConfig['direction'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="ascending">ascending</option>
            <option value="descending">descending</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Quantity
          <input
            type="number"
            value={config.quantity}
            min={2}
            max={8}
            onChange={(e) =>
              regenerate({
                ...config,
                quantity: Number(e.target.value),
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Range min
          <input
            type="number"
            value={config.range.min}
            min={1}
            max={config.range.max - 1}
            onChange={(e) =>
              regenerate({
                ...config,
                range: { ...config.range, min: Number(e.target.value) },
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Range max
          <input
            type="number"
            value={config.range.max}
            min={config.range.min + 1}
            max={100}
            onChange={(e) =>
              regenerate({
                ...config,
                range: { ...config.range, max: Number(e.target.value) },
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.allowSkips}
            onChange={(e) =>
              regenerate({ ...config, allowSkips: e.target.checked })
            }
          />
          Allow skips
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.ttsEnabled}
            onChange={(e) =>
              onChange({ ...config, ttsEnabled: e.target.checked })
            }
          />
          TTS enabled
        </label>
        <button
          type="button"
          onClick={() => regenerate(config)}
          className="rounded border px-2 py-1 text-sm"
        >
          Regenerate rounds
        </button>
      </div>
    </details>
  );
};

const WordSpellConfigPanel = ({
  config,
  onChange,
}: {
  config: WordSpellConfig;
  onChange: (c: WordSpellConfig) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={(e) =>
        setOpen((e.currentTarget as HTMLDetailsElement).open)
      }
      className="fixed right-4 top-40 z-50 max-h-[min(70vh,calc(100vh-8rem))] w-72 overflow-y-auto rounded-lg border bg-background p-3 text-sm shadow-lg"
    >
      <summary className="cursor-pointer font-medium">
        ⚙️ Game Config
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Input method
          <select
            value={config.inputMethod}
            onChange={(e) =>
              onChange({
                ...config,
                inputMethod: e.target
                  .value as WordSpellConfig['inputMethod'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="drag">drag</option>
            <option value="type">type</option>
            <option value="both">both</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Wrong tile behaviour
          <select
            value={config.wrongTileBehavior}
            onChange={(e) =>
              onChange({
                ...config,
                wrongTileBehavior: e.target
                  .value as WordSpellConfig['wrongTileBehavior'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="reject">reject</option>
            <option value="lock-manual">lock-manual</option>
            <option value="lock-auto-eject">lock-auto-eject</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Tile bank mode
          <select
            value={config.tileBankMode}
            onChange={(e) =>
              onChange({
                ...config,
                tileBankMode: e.target
                  .value as WordSpellConfig['tileBankMode'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="exact">exact</option>
            <option value="distractors">distractors</option>
          </select>
        </label>
        {config.tileBankMode === 'distractors' ? (
          <label className="flex flex-col gap-1">
            Distractor count
            <input
              type="number"
              min={1}
              max={12}
              value={config.distractorCount ?? 2}
              onChange={(e) =>
                onChange({
                  ...config,
                  distractorCount: Number(e.target.value),
                })
              }
              className="rounded border px-2 py-1"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          Total rounds
          <input
            type="number"
            value={config.totalRounds}
            min={1}
            max={WORD_SPELL_ROUND_POOL.length}
            onChange={(e) => {
              const totalRounds = Number(e.target.value);
              onChange({
                ...config,
                totalRounds,
                rounds: sliceWordSpellRounds(totalRounds),
              });
            }}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Mode
          <select
            value={config.mode}
            onChange={(e) =>
              onChange({
                ...config,
                mode: e.target.value as WordSpellConfig['mode'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="picture">picture</option>
            <option value="scramble">scramble</option>
            <option value="recall">recall</option>
            <option value="sentence-gap">sentence-gap</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Tile unit
          <select
            value={config.tileUnit}
            onChange={(e) =>
              onChange({
                ...config,
                tileUnit: e.target.value as WordSpellConfig['tileUnit'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="letter">letter</option>
            <option value="syllable">syllable</option>
            <option value="word">word</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.roundsInOrder === true}
            onChange={(e) =>
              onChange({ ...config, roundsInOrder: e.target.checked })
            }
          />
          Rounds in order
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.ttsEnabled}
            onChange={(e) =>
              onChange({ ...config, ttsEnabled: e.target.checked })
            }
          />
          TTS enabled
        </label>
      </div>
    </details>
  );
};

const NumberMatchConfigPanel = ({
  config,
  onChange,
}: {
  config: NumberMatchConfig;
  onChange: (c: NumberMatchConfig) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={(e) =>
        setOpen((e.currentTarget as HTMLDetailsElement).open)
      }
      className="fixed right-4 top-40 z-50 max-h-[min(70vh,calc(100vh-8rem))] w-72 overflow-y-auto rounded-lg border bg-background p-3 text-sm shadow-lg"
    >
      <summary className="cursor-pointer font-medium">
        ⚙️ Game Config
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Input method
          <select
            value={config.inputMethod}
            onChange={(e) =>
              onChange({
                ...config,
                inputMethod: e.target
                  .value as NumberMatchConfig['inputMethod'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="drag">drag</option>
            <option value="type">type</option>
            <option value="both">both</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Mode
          <select
            value={config.mode}
            onChange={(e) =>
              onChange({
                ...config,
                mode: e.target.value as NumberMatchConfig['mode'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="numeral-to-group">numeral-to-group</option>
            <option value="group-to-numeral">group-to-numeral</option>
            <option value="numeral-to-word">numeral-to-word</option>
            <option value="word-to-numeral">word-to-numeral</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Tile style
          <select
            value={config.tileStyle}
            onChange={(e) =>
              onChange({
                ...config,
                tileStyle: e.target
                  .value as NumberMatchConfig['tileStyle'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="dots">dots</option>
            <option value="objects">objects</option>
            <option value="fingers">fingers</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Tile bank mode
          <select
            value={config.tileBankMode}
            onChange={(e) =>
              onChange({
                ...config,
                tileBankMode: e.target
                  .value as NumberMatchConfig['tileBankMode'],
              })
            }
            className="rounded border px-2 py-1"
          >
            <option value="exact">exact</option>
            <option value="distractors">distractors</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Distractor count
          <input
            type="number"
            min={0}
            max={10}
            value={config.distractorCount ?? 0}
            onChange={(e) =>
              onChange({
                ...config,
                distractorCount: Number(e.target.value),
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Total rounds
          <input
            type="number"
            value={config.totalRounds}
            min={1}
            max={50}
            onChange={(e) => {
              const totalRounds = Number(e.target.value);
              onChange({
                ...config,
                totalRounds,
                rounds: resizeNumberMatchRounds(
                  config.rounds,
                  totalRounds,
                  config.range,
                ),
              });
            }}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.roundsInOrder === true}
            onChange={(e) =>
              onChange({ ...config, roundsInOrder: e.target.checked })
            }
          />
          Rounds in order
        </label>
        <label className="flex flex-col gap-1">
          Range min
          <input
            type="number"
            value={config.range.min}
            min={1}
            max={config.range.max - 1}
            onChange={(e) =>
              onChange({
                ...config,
                range: { ...config.range, min: Number(e.target.value) },
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Range max
          <input
            type="number"
            value={config.range.max}
            min={config.range.min + 1}
            max={20}
            onChange={(e) =>
              onChange({
                ...config,
                range: { ...config.range, max: Number(e.target.value) },
              })
            }
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.ttsEnabled}
            onChange={(e) =>
              onChange({ ...config, ttsEnabled: e.target.checked })
            }
          />
          TTS enabled
        </label>
      </div>
    </details>
  );
};

const WordSpellGameBody = ({
  gameSpecificConfig,
}: {
  gameSpecificConfig: Record<string, unknown> | null;
}): JSX.Element => {
  const initial = useMemo(
    () => resolveWordSpellConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  return (
    <>
      <WordSpellConfigPanel config={cfg} onChange={setCfg} />
      <WordSpell key={cfg.inputMethod} config={cfg} />
    </>
  );
};

const NumberMatchGameBody = ({
  gameSpecificConfig,
}: {
  gameSpecificConfig: Record<string, unknown> | null;
}): JSX.Element => {
  const initial = useMemo(
    () => resolveNumberMatchConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  return (
    <>
      <NumberMatchConfigPanel config={cfg} onChange={setCfg} />
      <NumberMatch key={cfg.inputMethod} config={cfg} />
    </>
  );
};

const SortNumbersGameBody = ({
  gameSpecificConfig,
}: {
  gameSpecificConfig: Record<string, unknown> | null;
}): JSX.Element => {
  const initial = useMemo(
    () => resolveSortNumbersConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  useEffect(() => {
    setCfg(initial);
  }, [initial]);
  return (
    <>
      <SortNumbersConfigPanel config={cfg} onChange={setCfg} />
      <SortNumbers key={cfg.inputMethod} config={cfg} />
    </>
  );
};

const GameBody = ({
  gameId,
  gameSpecificConfig,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    return (
      <SortNumbersGameBody gameSpecificConfig={gameSpecificConfig} />
    );
  }

  if (gameId === 'word-spell') {
    return (
      <WordSpellGameBody gameSpecificConfig={gameSpecificConfig} />
    );
  }

  if (gameId === 'number-match') {
    return (
      <NumberMatchGameBody gameSpecificConfig={gameSpecificConfig} />
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
