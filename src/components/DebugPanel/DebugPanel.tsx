import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRounds } from './format-rounds';
import {
  buildNumberMatchPreview,
  buildSortNumbersPreview,
} from './numeric-game-previews';
import { useLibraryPreview } from './useLibraryPreview';
import { useStorageSnapshot } from './useStorageSnapshot';
import type { WordFilter } from '@/data/words';
import type { Cover } from '@/games/cover-type';
import type { JSX } from 'react';

export interface DebugPanelCustomGame {
  id: string | null;
  name: string | null;
  color: string | null;
  cover: Cover | null;
}

export interface DebugPanelSession {
  sessionId: string;
  seed: string;
  draftState: unknown;
  persistedContent: unknown;
}

export interface DebugPanelProps {
  gameId: string;
  resolvedConfig: Record<string, unknown>;
  rawSavedConfig: Record<string, unknown> | null;
  customGame: DebugPanelCustomGame;
  session: DebugPanelSession;
  rounds: unknown;
}

const copyToClipboard = (text: string): void => {
  if (typeof navigator !== 'undefined') {
    void navigator.clipboard.writeText(text);
  }
};

const JsonActions = ({
  label,
  value,
}: {
  label: string;
  value: unknown;
}): JSX.Element => (
  <div className="mb-1 flex gap-1">
    <button
      type="button"
      onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700"
      aria-label={`Copy ${label} to clipboard`}
      title="Copy JSON to clipboard"
    >
      📋 Copy
    </button>
    <button
      type="button"
      onClick={() => {
        console.log(`[debug:${label}]`, value);
      }}
      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700"
      aria-label={`Log ${label} to console`}
      title="Dump to browser console"
    >
      🖨️ Log
    </button>
  </div>
);

const Section = ({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}): JSX.Element => (
  <details
    className="border-t border-zinc-700 first:border-t-0"
    open={defaultOpen}
  >
    <summary className="cursor-pointer select-none bg-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:bg-zinc-700">
      {title}
    </summary>
    <div className="px-3 py-2 text-xs text-zinc-100">{children}</div>
  </details>
);

const JsonBlock = ({
  label,
  value,
}: {
  label: string;
  value: unknown;
}): JSX.Element => (
  <>
    <JsonActions label={label} value={value} />
    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-zinc-950 p-2 font-mono text-[11px] leading-snug text-zinc-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  </>
);

const Empty = ({ label }: { label: string }): JSX.Element => (
  <p className="italic text-zinc-400">{label}</p>
);

const RoundsTable = ({
  gameId,
  rounds,
}: {
  gameId: string;
  rounds: unknown;
}): JSX.Element => {
  const { columns, rows } = formatRounds(gameId, rounds);
  if (rows.length === 0) {
    return (
      <Empty label="(no rounds in config — library or generator samples at runtime)" />
    );
  }
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-zinc-900">
            {columns.map((c) => (
              <th
                key={c}
                className="border-b border-zinc-700 px-2 py-1 font-medium text-zinc-300"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.index} className="even:bg-zinc-900/50">
              {columns.map((c) => (
                <td
                  key={c}
                  className="border-b border-zinc-800 px-2 py-1 align-top text-zinc-100"
                >
                  {row.cells[c] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const extractLiveRounds = (
  gameId: string,
  persistedContent: unknown,
): unknown[] | null => {
  if (gameId !== 'word-spell') return null;
  if (
    typeof persistedContent !== 'object' ||
    persistedContent === null
  ) {
    return null;
  }
  const live = (persistedContent as { wordSpellRounds?: unknown })
    .wordSpellRounds;
  return Array.isArray(live) ? live : null;
};

const extractLibrarySource = (
  resolvedConfig: Record<string, unknown>,
): {
  filter: WordFilter | null;
  source: Record<string, unknown> | null;
  selectedUnits: unknown;
  totalRounds: unknown;
  roundsInOrder: unknown;
} => {
  const source = resolvedConfig.source as
    | Record<string, unknown>
    | undefined;
  const filter = (source?.filter ?? null) as WordFilter | null;
  return {
    filter,
    source: source ?? null,
    selectedUnits: resolvedConfig.selectedUnits,
    totalRounds: resolvedConfig.totalRounds,
    roundsInOrder: resolvedConfig.roundsInOrder,
  };
};

export const DebugPanel = ({
  gameId,
  resolvedConfig,
  rawSavedConfig,
  customGame,
  session,
  rounds,
}: DebugPanelProps): JSX.Element | null => {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const storage = useStorageSnapshot(open);

  const librarySource = useMemo(
    () => extractLibrarySource(resolvedConfig),
    [resolvedConfig],
  );
  const liveRounds = useMemo(
    () => extractLiveRounds(gameId, session.persistedContent),
    [gameId, session.persistedContent],
  );
  const sortPreview = useMemo(
    () =>
      gameId === 'sort-numbers'
        ? buildSortNumbersPreview(resolvedConfig)
        : null,
    [gameId, resolvedConfig],
  );
  const numberMatchPreview = useMemo(
    () =>
      gameId === 'number-match'
        ? buildNumberMatchPreview(resolvedConfig)
        : null,
    [gameId, resolvedConfig],
  );
  const libraryPreview = useLibraryPreview(
    open && librarySource.filter !== null,
    librarySource.filter,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate; portal target only exists on client
    setHydrated(true);
  }, []);

  if (!hydrated || typeof document === 'undefined') return null;

  const node = (
    <div
      data-testid="debug-panel"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 sm:inset-x-auto sm:right-4"
    >
      {open ? (
        <div className="pointer-events-auto flex max-h-[80vh] w-full flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-xl sm:w-[480px]">
          <div className="flex items-center justify-between bg-zinc-950 px-3 py-2 text-xs font-semibold">
            <span>🛠️ Debug · {gameId}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-0.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close debug panel"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <Section title="Resolved Config" defaultOpen>
              <JsonBlock
                label="resolvedConfig"
                value={resolvedConfig}
              />
            </Section>
            <Section title="Raw Saved Config">
              {rawSavedConfig ? (
                <JsonBlock
                  label="rawSavedConfig"
                  value={rawSavedConfig}
                />
              ) : (
                <Empty label="(no saved config — using defaults)" />
              )}
            </Section>
            <Section title="Custom Game">
              {customGame.id ? (
                <JsonBlock
                  label="customGame"
                  value={{
                    id: customGame.id,
                    name: customGame.name,
                    color: customGame.color,
                    cover: customGame.cover,
                  }}
                />
              ) : (
                <Empty label="(not a custom game)" />
              )}
            </Section>
            <Section title="Session">
              <JsonBlock label="session" value={session} />
            </Section>
            {liveRounds && liveRounds.length > 0 ? (
              <Section
                title={`Live Rounds in session (${liveRounds.length})`}
                defaultOpen
              >
                <JsonActions label="liveRounds" value={liveRounds} />
                <RoundsTable gameId={gameId} rounds={liveRounds} />
              </Section>
            ) : null}
            {numberMatchPreview ? (
              <Section
                title={`Round Pool Preview (${numberMatchPreview.pool.length} values)`}
              >
                <p className="mb-1 text-zinc-400">
                  All values that NumberMatch can pick from this
                  config&apos;s range.
                </p>
                <JsonBlock
                  label="numberMatchPreview"
                  value={numberMatchPreview}
                />
                <p className="mb-1 mt-2 font-semibold text-zinc-300">
                  Pool
                </p>
                <p className="rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-100">
                  {numberMatchPreview.pool.join(', ')}
                </p>
              </Section>
            ) : null}
            {sortPreview ? (
              <Section
                title={`Round Pool Preview (${sortPreview.samples.length} samples)`}
              >
                <p className="mb-1 text-zinc-400">
                  Simulated by running the SortNumbers generator with
                  the current rules. Re-open the panel to reroll random
                  modes.
                </p>
                <JsonBlock label="sortPreview" value={sortPreview} />
                <p className="mb-1 mt-2 font-semibold text-zinc-300">
                  Sample sequences
                </p>
                <ul className="space-y-0.5 font-mono text-[11px]">
                  {sortPreview.samples.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex justify-between text-zinc-200"
                    >
                      <span>#{i + 1}</span>
                      <span>{s.sequence.join(', ')}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
            {librarySource.source ? (
              <Section title="Library Source">
                <JsonBlock
                  label="librarySource"
                  value={{
                    source: librarySource.source,
                    selectedUnits: librarySource.selectedUnits,
                    totalRounds: librarySource.totalRounds,
                    roundsInOrder: librarySource.roundsInOrder,
                  }}
                />
              </Section>
            ) : null}
            {librarySource.source ? (
              <Section
                title={`Library Words${
                  libraryPreview.loading
                    ? ' (loading…)'
                    : ` (${libraryPreview.hitCount} matches)`
                }`}
                defaultOpen
              >
                {libraryPreview.error ? (
                  <Empty label={`(error: ${libraryPreview.error})`} />
                ) : libraryPreview.loading ? (
                  <Empty label="(loading…)" />
                ) : libraryPreview.hitCount === 0 ? (
                  <Empty label="(filter returned 0 words)" />
                ) : (
                  <>
                    {libraryPreview.usedFallback ? (
                      <p className="mb-1 text-amber-400">
                        ⚠ fell back from{' '}
                        {libraryPreview.usedFallback.from} →{' '}
                        {libraryPreview.usedFallback.to}
                      </p>
                    ) : null}
                    <JsonActions
                      label="libraryHits"
                      value={libraryPreview.hits}
                    />
                    <p
                      data-testid="debug-word-preview-bar"
                      className="mb-2 rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-100"
                    >
                      {libraryPreview.hits
                        .map((h) => h.word)
                        .join(', ')}
                    </p>
                    <ul className="space-y-0.5 font-mono text-[11px]">
                      {libraryPreview.hits.map((h) => (
                        <li
                          key={h.word}
                          className="flex justify-between text-zinc-200"
                        >
                          <span>{h.word}</span>
                          <span className="text-zinc-500">
                            L{h.level}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>
            ) : null}
            <Section
              title={`Rounds in config (${Array.isArray(rounds) ? rounds.length : 0})`}
            >
              {Array.isArray(rounds) && rounds.length > 0 ? (
                <JsonActions label="rounds" value={rounds} />
              ) : null}
              <RoundsTable gameId={gameId} rounds={rounds} />
            </Section>
            <Section title="Storage">
              {storage.loading ? (
                <Empty label="(loading…)" />
              ) : (
                <>
                  <JsonActions label="storage" value={storage} />
                  <p className="mb-1 font-semibold text-zinc-300">
                    IndexedDB collections
                  </p>
                  {storage.error ? (
                    <Empty label={`(error: ${storage.error})`} />
                  ) : storage.collections.length === 0 ? (
                    <Empty label="(none)" />
                  ) : (
                    <div className="mb-3 space-y-1">
                      {storage.collections.map((c) => (
                        <details
                          key={c.name}
                          className="rounded bg-zinc-950"
                        >
                          <summary className="flex cursor-pointer select-none justify-between px-2 py-1 font-mono text-[11px] text-zinc-200 hover:bg-zinc-900">
                            <span>{c.name}</span>
                            <span className="text-zinc-400">
                              {c.count}
                            </span>
                          </summary>
                          <div className="px-2 pb-2">
                            {c.count === 0 ? (
                              <Empty label="(empty)" />
                            ) : (
                              <>
                                <JsonActions
                                  label={`idb:${c.name}`}
                                  value={c.docs}
                                />
                                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-zinc-900 p-2 font-mono text-[11px] leading-snug text-zinc-100">
                                  {JSON.stringify(c.docs, null, 2)}
                                </pre>
                              </>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                  <p className="mb-1 font-semibold text-zinc-300">
                    localStorage ({storage.localStorage.length} keys)
                  </p>
                  {storage.localStorage.length === 0 ? (
                    <Empty label="(empty)" />
                  ) : (
                    <ul className="space-y-1">
                      {storage.localStorage.map((entry) => (
                        <li
                          key={entry.key}
                          className="rounded bg-zinc-950 p-1.5 font-mono text-[11px]"
                        >
                          <div className="flex justify-between text-zinc-300">
                            <span className="truncate pr-2">
                              {entry.key}
                            </span>
                            <span>{entry.size}b</span>
                          </div>
                          <div className="break-all text-zinc-500">
                            {entry.preview}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </Section>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg ring-1 ring-zinc-700 hover:bg-zinc-800"
          aria-label="Open debug panel"
        >
          🛠️ Debug
        </button>
      )}
    </div>
  );

  return createPortal(node, document.body);
};
