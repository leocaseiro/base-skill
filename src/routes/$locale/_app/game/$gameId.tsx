// src/routes/$locale/_app/game/$gameId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useState } from 'react';
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
  distractorCount: 5,
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
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: true,
  direction: 'ascending',
  range: { min: 1, max: 20 },
  quantity: 4,
  allowSkips: false,
  rounds: generateSortRounds({
    range: { min: 1, max: 20 },
    quantity: 4,
    allowSkips: false,
    totalRounds: 3,
  }),
});

const SortNumbersConfigPanel = ({
  config,
  onChange,
}: {
  config: SortNumbersConfig;
  onChange: (c: SortNumbersConfig) => void;
}) => {
  const [open, setOpen] = useState(false);

  const regenerate = () => {
    onChange({
      ...config,
      rounds: generateSortRounds({
        range: config.range,
        quantity: config.quantity,
        allowSkips: config.allowSkips,
        totalRounds: config.totalRounds,
      }),
    });
  };

  return (
    <details
      open={open}
      onToggle={(e) =>
        setOpen((e.currentTarget as HTMLDetailsElement).open)
      }
      className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
    >
      <summary className="cursor-pointer font-medium">
        ⚙️ Game Config
      </summary>
      <div className="mt-3 flex flex-col gap-3">
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
              onChange({ ...config, quantity: Number(e.target.value) })
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
            max={100}
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
            checked={config.allowSkips}
            onChange={(e) =>
              onChange({ ...config, allowSkips: e.target.checked })
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
          onClick={regenerate}
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
      className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
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
      className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
    >
      <summary className="cursor-pointer font-medium">
        ⚙️ Game Config
      </summary>
      <div className="mt-3 flex flex-col gap-3">
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

const GameBody = ({ gameId }: { gameId: string }): JSX.Element => {
  const [wordSpellConfig, setWordSpellConfig] =
    useState<WordSpellConfig>(DEFAULT_WORD_SPELL_CONFIG);
  const [numberMatchConfig, setNumberMatchConfig] =
    useState<NumberMatchConfig>(makeDefaultNumberMatchConfig);
  const [sortNumbersConfig, setSortNumbersConfig] =
    useState<SortNumbersConfig>(makeDefaultSortNumbersConfig);

  if (gameId === 'sort-numbers') {
    return (
      <>
        {import.meta.env.DEV && (
          <SortNumbersConfigPanel
            config={sortNumbersConfig}
            onChange={setSortNumbersConfig}
          />
        )}
        <SortNumbers
          key={sortNumbersConfig.inputMethod}
          config={sortNumbersConfig}
        />
      </>
    );
  }

  if (gameId === 'word-spell') {
    return (
      <>
        {import.meta.env.DEV && (
          <WordSpellConfigPanel
            config={wordSpellConfig}
            onChange={setWordSpellConfig}
          />
        )}
        <WordSpell
          key={wordSpellConfig.inputMethod}
          config={wordSpellConfig}
        />
      </>
    );
  }
  if (gameId === 'number-match') {
    return (
      <>
        {import.meta.env.DEV && (
          <NumberMatchConfigPanel
            config={numberMatchConfig}
            onChange={setNumberMatchConfig}
          />
        )}
        <NumberMatch
          key={numberMatchConfig.inputMethod}
          config={numberMatchConfig}
        />
      </>
    );
  }
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Game not found</p>
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
