// src/components/game/GameShell.tsx
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type {
  GameEngineState,
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { JSX, ReactNode } from 'react';
import { useGameRoundProgress } from '@/lib/game-engine/GameRoundContext';
import {
  GameEngineProvider,
  useGameDispatch,
  useGameState,
} from '@/lib/game-engine/index';

export interface GameShellProps {
  config: ResolvedGameConfig;
  moves: Record<string, MoveHandler>;
  initialState: GameEngineState;
  sessionId: string;
  meta: SessionMeta;
  initialLog?: MoveLog;
  children: ReactNode;
}

interface GameShellChromeProps {
  config: ResolvedGameConfig;
  children: ReactNode;
}

const GameShellChrome = ({
  config,
  children,
}: GameShellChromeProps): JSX.Element => {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });

  const roundOverride = useGameRoundProgress();
  const roundCurrent = roundOverride?.current ?? state.roundIndex + 1;
  const roundTotal = roundOverride?.total ?? config.maxRounds;
  const title =
    config.title[locale] ?? config.title['en'] ?? config.gameId;

  const handleExit = () => {
    void navigate({ to: '/$locale', params: { locale } });
  };

  const handleUndo = () => {
    dispatch({
      type: 'UNDO',
      args: { targetStep: Math.max(0, state.roundIndex) },
      timestamp: Date.now(),
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <button
          className="text-sm text-muted-foreground"
          onClick={handleExit}
          aria-label="Back"
          type="button"
        >
          <span aria-hidden="true">← </span>
          <span>{title}</span>
        </button>
        <span className="text-sm font-medium" data-testid="game-round">
          {t('shell.round', {
            current: roundCurrent,
            total: roundTotal,
          })}
        </span>
      </header>

      {/* Sub-bar: score + progress + optional timer */}
      <div className="flex items-center gap-4 border-b px-4 py-2 text-sm">
        <span data-testid="game-score">{state.score}</span>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.round((roundCurrent / roundTotal) * 100)}%`,
              }}
            />
          </div>
        </div>
        {config.timerVisible &&
          config.timerDurationSeconds !== null && (
            <span data-testid="game-timer">
              ⏱ {config.timerDurationSeconds}s
            </span>
          )}
      </div>

      {/* Game area (div, not main — app layout already has a single page <main>) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-around border-t px-4 py-2">
        {config.maxUndoDepth !== 0 && (
          <button
            className="flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-muted disabled:opacity-40"
            onClick={handleUndo}
            aria-label="Undo"
            type="button"
          >
            ⟲ {t('shell.undo')}
          </button>
        )}
        <button
          className="rounded px-3 py-1 text-sm hover:bg-muted"
          type="button"
          aria-label="Pause"
        >
          II {t('shell.pause')}
        </button>
        <button
          className="rounded px-3 py-1 text-sm hover:bg-muted"
          onClick={handleExit}
          aria-label="Exit"
          type="button"
        >
          ✕ {t('shell.exit')}
        </button>
      </footer>
    </div>
  );
};

export const GameShell = ({
  config,
  moves,
  initialState,
  sessionId,
  meta,
  initialLog,
  children,
}: GameShellProps): JSX.Element => (
  <GameEngineProvider
    config={config}
    moves={moves}
    initialState={initialState}
    sessionId={sessionId}
    meta={meta}
    initialLog={initialLog}
  >
    <GameShellChrome config={config}>{children}</GameShellChrome>
  </GameEngineProvider>
);
