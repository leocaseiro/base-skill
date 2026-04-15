// src/components/game/GameShell.tsx
import { useNavigate, useParams } from '@tanstack/react-router';
import { LogOut, Pause, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  GameEngineState,
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { JSX, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRxDB } from '@/db/hooks/useRxDB';
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
  sessionId: string;
  children: ReactNode;
}

const GameShellChrome = ({
  config,
  sessionId,
  children,
}: GameShellChromeProps): JSX.Element => {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });
  const { db } = useRxDB();
  const [exitOpen, setExitOpen] = useState(false);

  const title =
    config.title[locale] ?? config.title['en'] ?? config.gameId;

  const handleConfirmExit = async () => {
    if (db) {
      const doc = await db.session_history_index
        .findOne(sessionId)
        .exec();
      if (doc && doc.status === 'in-progress') {
        await doc.incrementalPatch({ status: 'abandoned' });
      }
    }
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
          className="text-sm text-foreground"
          onClick={() => setExitOpen(true)}
          aria-label="Back"
          type="button"
        >
          <span aria-hidden="true">← </span>
          <span>{title}</span>
        </button>
      </header>

      {/* Sub-bar: score + optional timer */}
      <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
        <span data-testid="game-score">{state.score}</span>
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
            <RotateCcw aria-hidden="true" />
            {t('shell.undo')}
          </button>
        )}
        <button
          className="flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-muted"
          type="button"
          aria-label="Pause"
        >
          <Pause aria-hidden="true" />
          {t('shell.pause')}
        </button>
        <button
          className="flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-muted"
          onClick={() => setExitOpen(true)}
          aria-label="Exit"
          type="button"
        >
          <LogOut aria-hidden="true" />
          {t('shell.exit')}
        </button>
      </footer>

      {/* Exit confirmation */}
      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Want to leave the game?</AlertDialogTitle>
            <AlertDialogDescription>
              That&apos;s okay! You can start a new game from the home
              screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Playing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void handleConfirmExit();
              }}
            >
              Leave Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <GameShellChrome config={config} sessionId={sessionId}>
      {children}
    </GameShellChrome>
  </GameEngineProvider>
);
