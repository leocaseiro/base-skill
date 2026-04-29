import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRounds } from './format-rounds';
import { useStorageSnapshot } from './useStorageSnapshot';
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
  hasDraftState: boolean;
  hasPersistedContent: boolean;
}

export interface DebugPanelProps {
  gameId: string;
  resolvedConfig: Record<string, unknown>;
  rawSavedConfig: Record<string, unknown> | null;
  customGame: DebugPanelCustomGame;
  session: DebugPanelSession;
  rounds: unknown;
}

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

const JsonBlock = ({ value }: { value: unknown }): JSX.Element => (
  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-zinc-950 p-2 font-mono text-[11px] leading-snug text-zinc-100">
    {JSON.stringify(value, null, 2)}
  </pre>
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
              <JsonBlock value={resolvedConfig} />
            </Section>
            <Section title="Raw Saved Config">
              {rawSavedConfig ? (
                <JsonBlock value={rawSavedConfig} />
              ) : (
                <Empty label="(no saved config — using defaults)" />
              )}
            </Section>
            <Section title="Custom Game">
              {customGame.id ? (
                <JsonBlock
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
              <JsonBlock value={session} />
            </Section>
            <Section
              title={`Rounds (${Array.isArray(rounds) ? rounds.length : 0})`}
            >
              <RoundsTable gameId={gameId} rounds={rounds} />
            </Section>
            <Section title="Storage">
              {storage.loading ? (
                <Empty label="(loading…)" />
              ) : (
                <>
                  <p className="mb-1 font-semibold text-zinc-300">
                    IndexedDB collections
                  </p>
                  {storage.error ? (
                    <Empty label={`(error: ${storage.error})`} />
                  ) : storage.collections.length === 0 ? (
                    <Empty label="(none)" />
                  ) : (
                    <ul className="mb-3 space-y-0.5">
                      {storage.collections.map((c) => (
                        <li
                          key={c.name}
                          className="flex justify-between font-mono text-[11px]"
                        >
                          <span>{c.name}</span>
                          <span>{c.count}</span>
                        </li>
                      ))}
                    </ul>
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
