// src/components/game/GameShell.tsx
import { useNavigate, useParams } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
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
import { GameEngineProvider } from '@/lib/game-engine/index';

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
  const navigate = useNavigate();
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });
  const { db } = useRxDB();
  const [exitOpen, setExitOpen] = useState(false);

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

  const showTimer =
    config.timerVisible && config.timerDurationSeconds !== null;

  // Portaled to `body` so the close control stays above the instructions overlay
  // (also portaled, z-40). z-[45] is below the exit AlertDialog (z-50).
  const topChrome = (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
      {showTimer ? (
        <div
          className="pointer-events-none text-sm tabular-nums text-foreground"
          data-testid="game-timer"
        >
          ⏱ {config.timerDurationSeconds}s
        </div>
      ) : (
        <span className="min-w-0 flex-1" aria-hidden />
      )}
      <button
        className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-background/90 text-foreground opacity-80 shadow-sm ring-1 ring-border transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        type="button"
        onClick={() => setExitOpen(true)}
        aria-label={t('shell.exit')}
      >
        <X aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col">
      {createPortal(topChrome, document.body)}

      {/* Game area (div, not main — app layout already has a single page <main>) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 pt-[max(4.5rem,calc(env(safe-area-inset-top,0px)+3.25rem))]">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          {children}
        </div>
      </div>

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
