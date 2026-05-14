// src/components/game/GameShell.tsx
import {
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { Maximize, Menu, Minimize, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFullscreen } from './useFullscreen';
import type { AppLocale } from '@/components/AppMenuPanel';
import type {
  GameEngineState,
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { JSX, ReactNode } from 'react';
import { AppMenuPanel } from '@/components/AppMenuPanel';
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
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { useRxDB } from '@/db/hooks/useRxDB';
import { GameEngineProvider } from '@/lib/game-engine/index';

export interface GameShellProps {
  config: ResolvedGameConfig;
  moves: Record<string, MoveHandler>;
  initialState: GameEngineState;
  sessionId: string;
  meta: SessionMeta;
  initialLog?: MoveLog;
  /**
   * Active skin id (e.g. `'classic'`, `'dragon-cave'`). When set, the chrome
   * wrapper receives a `skin--<id>` class so per-skin CSS (e.g. button opacity,
   * background tinting) can override defaults. The double-dash distinguishes
   * the chrome scope from the game-container scope (`.skin-<id>`).
   */
  skinId?: string;
  children: ReactNode;
}

interface GameShellChromeProps {
  sessionId: string;
  skinId?: string;
  children: ReactNode;
}

// Default chrome button opacity reads from a CSS variable so per-skin overrides
// (set on `.skin--<id>` wrappers) cascade down without touching this className.
const ICON_BUTTON_CLASS =
  'pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-background/90 text-foreground opacity-[var(--skin-chrome-button-opacity,0.8)] shadow-sm ring-1 ring-border transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

const GameShellChrome = ({
  sessionId,
  skinId,
  children,
}: GameShellChromeProps): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });
  const { db } = useRxDB();
  const [exitOpen, setExitOpen] = useState(false);
  const fullscreen = useFullscreen();

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

  const switchLocale = (newLocale: AppLocale) => {
    const newPath = location.pathname.replace(
      /^\/(en|pt-BR)/,
      `/${newLocale}`,
    );
    void navigate({ to: newPath });
  };

  // Portaled to `body` so the chrome stays above the instructions overlay
  // (also portaled, z-40). z-[45] is below the exit AlertDialog (z-50).
  // The `skin--<id>` class lets per-skin CSS reach the chrome (which is NOT a
  // descendant of `.game-container.skin-<id>`) — e.g., dragon-cave sets
  // `--skin-chrome-button-opacity: 1` on this wrapper so its icon buttons
  // render at full opacity instead of the default 0.8.
  const skinChromeClass = skinId ? `skin--${skinId}` : '';
  const topChrome = (
    <div
      data-testid="game-chrome"
      className={`${skinChromeClass} pointer-events-none fixed inset-x-0 top-0 z-[45] flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))]`}
    >
      {/* Left cluster: menu */}
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={ICON_BUTTON_CLASS}
              aria-label={t('shell.menu')}
            >
              <Menu aria-hidden className="size-5" strokeWidth={2.25} />
            </button>
          </SheetTrigger>
          <AppMenuPanel locale={locale} onLocaleChange={switchLocale} />
        </Sheet>
      </div>

      {/* Right cluster: fullscreen + close */}
      <div className="flex items-center gap-2">
        {fullscreen.supported ? (
          <button
            type="button"
            className={ICON_BUTTON_CLASS}
            onClick={() => {
              void fullscreen.toggle();
            }}
            aria-label={
              fullscreen.isFullscreen
                ? t('shell.exitFullscreen')
                : t('shell.enterFullscreen')
            }
          >
            {fullscreen.isFullscreen ? (
              <Minimize
                aria-hidden
                className="size-5"
                strokeWidth={2.25}
              />
            ) : (
              <Maximize
                aria-hidden
                className="size-5"
                strokeWidth={2.25}
              />
            )}
          </button>
        ) : null}
        <button
          type="button"
          className={ICON_BUTTON_CLASS}
          onClick={() => setExitOpen(true)}
          aria-label={t('shell.exit')}
        >
          <X aria-hidden className="size-5" strokeWidth={2.25} />
        </button>
      </div>
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
  skinId,
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
    <GameShellChrome sessionId={sessionId} skinId={skinId}>
      {children}
    </GameShellChrome>
  </GameEngineProvider>
);
