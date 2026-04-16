// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCover } from '@/components/GameCover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSimpleConfigFormRenderer } from '@/games/config-fields-registry';
import { resolveCover } from '@/games/cover';
import { DEFAULT_GAME_COLOR, GAME_COLORS } from '@/lib/game-colors';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';
import { suggestCustomGameName } from '@/lib/suggest-custom-game-name';

export type SaveBookmarkInput = {
  name: string;
  color: GameColorKey;
  config: Record<string, unknown>;
  cover?: Cover;
};

type InstructionsOverlayProps = {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  gameId: string;
  cover?: Cover;
  bookmarkId?: string;
  bookmarkName?: string;
  bookmarkColor?: GameColorKey;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveBookmark: (input: SaveBookmarkInput) => Promise<string>;
  onUpdateBookmark?: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: Cover; color?: GameColorKey },
  ) => Promise<void>;
  existingBookmarkNames?: readonly string[];
};

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  gameId,
  cover,
  bookmarkId,
  bookmarkName,
  bookmarkColor = DEFAULT_GAME_COLOR,
  config,
  onConfigChange,
  onSaveBookmark,
  onUpdateBookmark,
  existingBookmarkNames = [],
}: InstructionsOverlayProps): JSX.Element => {
  const { t } = useTranslation('games');
  const navigate = useNavigate({
    from: '/$locale/game/$gameId',
  });
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [saveSubmitAttempted, setSaveSubmitAttempted] = useState(false);
  const saveNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveDialogOpen) {
      // Defer so the Radix Dialog finishes mounting before we grab focus.
      const id = globalThis.setTimeout(
        () => saveNameRef.current?.focus(),
        0,
      );
      return () => globalThis.clearTimeout(id);
    }
    return;
  }, [saveDialogOpen]);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = GAME_COLORS[bookmarkColor];
  const resolvedCover = resolveCover({ cover }, gameId);

  const SimpleForm = getSimpleConfigFormRenderer(gameId);

  const modalMode =
    bookmarkId && bookmarkName
      ? ({
          kind: 'bookmark',
          configId: bookmarkId,
          name: bookmarkName,
          color: bookmarkColor,
          cover,
        } as const)
      : ({ kind: 'default' } as const);

  const handlePlay = () => {
    if (bookmarkId && bookmarkName && onUpdateBookmark) {
      void (async () => {
        try {
          await onUpdateBookmark(bookmarkName, config, {
            cover,
            color: bookmarkColor,
          });
        } catch (error) {
          console.error('Failed to save bookmark on play', error);
        }
        onStart();
      })();
      return;
    }
    setSaveSubmitAttempted(false);
    setSavingName(
      suggestCustomGameName(gameTitle, existingBookmarkNames),
    );
    setSaveDialogOpen(true);
  };

  const saveOnPlayError: string | null = (() => {
    const trimmed = savingName.trim();
    if (trimmed === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a bookmark name.',
      });
    if (existingBookmarkNames.includes(trimmed))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A bookmark with that name already exists.',
      });
    return null;
  })();
  const showSaveOnPlayError =
    saveSubmitAttempted && saveOnPlayError !== null;

  const handleSaveAndPlay = () => {
    setSaveSubmitAttempted(true);
    if (saveOnPlayError !== null) {
      saveNameRef.current?.focus();
      return;
    }
    const trimmed = savingName.trim();
    void (async () => {
      try {
        const newId = await onSaveBookmark({
          name: trimmed,
          color: bookmarkColor,
          config,
          cover,
        });
        setSaveDialogOpen(false);
        await navigate({
          search: (prev) => ({ ...prev, configId: newId }),
        });
        onStart();
      } catch (error) {
        console.error('Failed to save bookmark on play', error);
      }
    })();
  };

  const handlePlayWithoutSaving = () => {
    setSaveDialogOpen(false);
    onStart();
  };

  return createPortal(
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background/95 px-5 pb-8 pt-24"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-lg md:max-w-2xl">
        {/* 1. Hero cover */}
        <div className="flex justify-center bg-muted/40 p-4">
          <GameCover cover={resolvedCover} size="hero" />
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* 2. Title row + cog — matches GameCard heading/subtitle order */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                className="text-xl font-extrabold"
                style={
                  bookmarkName
                    ? { color: settingsColors.text }
                    : undefined
                }
              >
                {bookmarkName ?? gameTitle}
              </h2>
              {bookmarkName && (
                <p className="text-xs italic text-foreground/80">
                  {gameTitle}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label={t('instructions.configure', {
                defaultValue: 'Configure',
              })}
              onClick={() => setModalOpen(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
            >
              <SettingsIcon size={18} />
            </button>
          </div>

          {/* 3. Instructions text */}
          <p className="text-center text-base font-semibold text-foreground leading-relaxed">
            {text}
          </p>

          {/* 4. Let's go button */}
          <button
            type="button"
            onClick={handlePlay}
            className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
          >
            {t('instructions.lets-go')}
          </button>

          {/* 5. Simple settings form (always expanded) */}
          {SimpleForm && (
            <div className="border-t border-border pt-4">
              <SimpleForm config={config} onChange={onConfigChange} />
            </div>
          )}
        </div>
      </div>

      {/* Advanced config modal (opened by cog button) */}
      <AdvancedConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        gameId={gameId}
        mode={modalMode}
        config={config}
        existingBookmarkNames={existingBookmarkNames}
        onCancel={() => setModalOpen(false)}
        onSaveNew={(payload) => {
          void (async () => {
            try {
              const newId = await onSaveBookmark({
                name: payload.name,
                color: payload.color,
                config: payload.config,
                cover: payload.cover,
              });
              onConfigChange(payload.config);
              setModalOpen(false);
              await navigate({
                search: (prev) => ({ ...prev, configId: newId }),
              });
            } catch (error) {
              // Surface duplicate-name and similar errors; keep modal open.
              console.error('Failed to save bookmark', error);
            }
          })();
        }}
        onUpdate={
          onUpdateBookmark
            ? (payload) => {
                void (async () => {
                  try {
                    await onUpdateBookmark(
                      payload.name,
                      payload.config,
                      {
                        cover: payload.cover,
                        color: payload.color,
                      },
                    );
                    onConfigChange(payload.config);
                    setModalOpen(false);
                    await router.invalidate();
                  } catch (error) {
                    console.error('Failed to update bookmark', error);
                  }
                })();
              }
            : undefined
        }
      />

      {/* Save-on-play prompt for default (non-bookmarked) games */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('instructions.saveOnPlayTitle', {
                defaultValue: 'Save these settings as a bookmark?',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {t('instructions.saveOnPlayNameLabel', {
                  defaultValue: 'Bookmark name',
                })}
              </span>
              <input
                ref={saveNameRef}
                type="text"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                aria-invalid={showSaveOnPlayError}
                aria-describedby={
                  showSaveOnPlayError ? 'save-on-play-error' : undefined
                }
                className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                  showSaveOnPlayError
                    ? 'border-destructive'
                    : 'border-input'
                }`}
              />
              {showSaveOnPlayError && (
                <span
                  id="save-on-play-error"
                  role="alert"
                  className="text-xs font-semibold text-destructive"
                >
                  {saveOnPlayError}
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePlayWithoutSaving}
                className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
              >
                {t('instructions.playWithoutSaving', {
                  defaultValue: 'Play without saving',
                })}
              </button>
              <button
                type="button"
                onClick={handleSaveAndPlay}
                aria-disabled={saveOnPlayError !== null}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.saveAndPlay', {
                  defaultValue: 'Save & play',
                })}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
};
