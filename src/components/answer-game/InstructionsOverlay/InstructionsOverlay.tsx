// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Settings as SettingsIcon, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useConfigDraft } from './useConfigDraft';
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

type HeaderActionsProps = {
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenSettings: () => void;
};

const HeaderActions = ({
  isBookmarked,
  onToggleBookmark,
  onOpenSettings,
}: HeaderActionsProps): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  return (
    <div className="flex items-center gap-2">
      {onToggleBookmark && (
        <button
          type="button"
          aria-label={
            isBookmarked
              ? t('common:bookmark.remove', {
                  defaultValue: 'Remove bookmark',
                })
              : t('common:bookmark.add', {
                  defaultValue: 'Add bookmark',
                })
          }
          aria-pressed={isBookmarked ?? false}
          onClick={onToggleBookmark}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
        >
          <Star
            size={18}
            aria-hidden="true"
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </button>
      )}
      <button
        type="button"
        aria-label={t('instructions.configure', {
          defaultValue: 'Configure',
        })}
        onClick={onOpenSettings}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
      >
        <SettingsIcon size={18} />
      </button>
    </div>
  );
};

export type SaveCustomGameInput = {
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
  customGameId?: string;
  customGameName?: string;
  customGameColor?: GameColorKey;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveCustomGame: (input: SaveCustomGameInput) => Promise<string>;
  onUpdateCustomGame?: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: Cover; color?: GameColorKey },
  ) => Promise<void>;
  onDeleteCustomGame?: (configId: string) => Promise<void>;
  /** Persist current draft as the "last session" snapshot for this gameId. */
  onPersistLastSession?: (
    config: Record<string, unknown>,
  ) => Promise<void> | void;
  existingCustomGameNames?: readonly string[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
};

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  gameId,
  cover,
  customGameId,
  customGameName,
  customGameColor = DEFAULT_GAME_COLOR,
  config,
  onConfigChange,
  onSaveCustomGame,
  onUpdateCustomGame,
  onDeleteCustomGame,
  onPersistLastSession,
  existingCustomGameNames = [],
  isBookmarked,
  onToggleBookmark,
}: InstructionsOverlayProps): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  const navigate = useNavigate({
    from: '/$locale/game/$gameId',
  });
  const router = useRouter();

  const draftApi = useConfigDraft({
    config,
    onConfigChange,
    initialName: customGameName ?? '',
    initialColor: customGameColor,
    initialCover: cover,
    identity: customGameId ?? 'default',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [saveSubmitAttempted, setSaveSubmitAttempted] = useState(false);
  const [customPlayPromptOpen, setCustomPlayPromptOpen] =
    useState(false);
  const [playPromptError, setPlayPromptError] = useState<string | null>(
    null,
  );
  const saveNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveDialogOpen) {
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

  const settingsColors = GAME_COLORS[draftApi.draft.color];
  const resolvedCover = resolveCover(
    { cover: draftApi.draft.cover },
    gameId,
  );

  const SimpleForm = getSimpleConfigFormRenderer(gameId);

  const modalMode =
    customGameId && draftApi.draft.name
      ? ({ kind: 'customGame', configId: customGameId } as const)
      : ({ kind: 'default' } as const);

  const handleOpenModal = (): void => {
    draftApi.openModalSnapshot();
    setModalError(null);
    setModalOpen(true);
  };

  const handleModalOpenChange = (next: boolean): void => {
    if (!next) {
      draftApi.discard();
    }
    setModalOpen(next);
  };

  const handleCancel = (): void => {
    draftApi.discard();
    setModalOpen(false);
  };

  const persistLastSession = async (
    nextConfig: Record<string, unknown>,
  ): Promise<void> => {
    if (!onPersistLastSession) return;
    try {
      await onPersistLastSession(nextConfig);
    } catch (error) {
      console.error('Failed to persist last-session config', error);
      toast.error(
        t('instructions.persistLastSessionError', {
          defaultValue: "Couldn't remember settings",
        }),
      );
    }
  };

  const handlePlay = (): void => {
    if (!draftApi.isDirty) {
      void persistLastSession(draftApi.draft.config);
      onStart();
      return;
    }
    if (customGameId && onUpdateCustomGame) {
      setPlayPromptError(null);
      setCustomPlayPromptOpen(true);
      return;
    }
    // Default game (no customGameId) — fall through to existing save-on-play dialog
    setSaveSubmitAttempted(false);
    setSavingName(
      suggestCustomGameName(gameTitle, existingCustomGameNames),
    );
    setSaveDialogOpen(true);
  };

  const handlePromptUpdate = (): void => {
    if (!customGameId || !onUpdateCustomGame) return;
    void (async () => {
      try {
        await onUpdateCustomGame(
          draftApi.draft.name,
          draftApi.draft.config,
          {
            cover: draftApi.draft.cover,
            color: draftApi.draft.color,
          },
        );
        await persistLastSession(draftApi.draft.config);
        draftApi.commitSaved(draftApi.draft);
        setCustomPlayPromptOpen(false);
        setPlayPromptError(null);
        onStart();
      } catch (error) {
        console.error('Failed to update custom game on play', error);
        const message = t('instructions.updateError', {
          defaultValue: "Couldn't update — try again.",
        });
        setPlayPromptError(message);
        toast.error(message);
      }
    })();
  };

  const handlePromptSaveAsNew = (): void => {
    setCustomPlayPromptOpen(false);
    setSaveSubmitAttempted(false);
    setSavingName(
      suggestCustomGameName(gameTitle, existingCustomGameNames),
    );
    setSaveDialogOpen(true);
  };

  const handlePromptPlayWithoutSaving = (): void => {
    void persistLastSession(draftApi.draft.config);
    setCustomPlayPromptOpen(false);
    onStart();
  };

  const saveOnPlayError: string | null = (() => {
    const trimmed = savingName.trim();
    if (trimmed === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a custom game name.',
      });
    if (existingCustomGameNames.includes(trimmed))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A custom game with that name already exists.',
      });
    return null;
  })();
  const showSaveOnPlayError =
    saveSubmitAttempted && saveOnPlayError !== null;

  const handleSaveAndPlay = (): void => {
    setSaveSubmitAttempted(true);
    if (saveOnPlayError !== null) {
      saveNameRef.current?.focus();
      return;
    }
    const trimmed = savingName.trim();
    void (async () => {
      try {
        const newId = await onSaveCustomGame({
          name: trimmed,
          color: draftApi.draft.color,
          config: draftApi.draft.config,
          cover: draftApi.draft.cover,
        });
        await persistLastSession(draftApi.draft.config);
        setSaveDialogOpen(false);
        await navigate({
          search: (prev) => ({ ...prev, configId: newId }),
        });
        onStart();
      } catch (error) {
        console.error('Failed to save custom game on play', error);
      }
    })();
  };

  const handlePlayWithoutSaving = (): void => {
    void persistLastSession(draftApi.draft.config);
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
        <div className="flex justify-center bg-muted/40 p-4">
          <GameCover cover={resolvedCover} size="hero" />
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                className="text-xl font-extrabold"
                style={
                  customGameName
                    ? { color: settingsColors.text }
                    : undefined
                }
              >
                {customGameName ?? gameTitle}
              </h2>
              {customGameName && (
                <p className="text-xs italic text-foreground/80">
                  {gameTitle}
                </p>
              )}
            </div>
            <HeaderActions
              isBookmarked={isBookmarked}
              onToggleBookmark={onToggleBookmark}
              onOpenSettings={handleOpenModal}
            />
          </div>

          <p className="text-center text-base font-semibold text-foreground leading-relaxed">
            {text}
          </p>

          <button
            type="button"
            onClick={handlePlay}
            className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
          >
            {t('instructions.lets-go')}
          </button>

          {SimpleForm && (
            <div className="border-t border-border pt-4">
              <SimpleForm
                config={draftApi.draft.config}
                onChange={(next) => draftApi.setDraft({ config: next })}
              />
            </div>
          )}
        </div>
      </div>

      <AdvancedConfigModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        gameId={gameId}
        mode={modalMode}
        value={draftApi.draft}
        onChange={(patch) => draftApi.setDraft(patch)}
        existingCustomGameNames={existingCustomGameNames}
        errorMessage={modalError}
        onCancel={handleCancel}
        onDelete={
          customGameId && onDeleteCustomGame
            ? onDeleteCustomGame
            : undefined
        }
        onSaveNew={(payload) => {
          void (async () => {
            try {
              const newId = await onSaveCustomGame({
                name: payload.name,
                color: payload.color,
                config: payload.config,
                cover: payload.cover,
              });
              await persistLastSession(payload.config);
              draftApi.commitSaved({
                config: payload.config,
                name: payload.name,
                color: payload.color,
                cover: payload.cover,
              });
              setModalOpen(false);
              setModalError(null);
              await navigate({
                search: (prev) => ({ ...prev, configId: newId }),
              });
            } catch (error) {
              console.error('Failed to save custom game', error);
              const message = t('instructions.saveError', {
                defaultValue: "Couldn't save — try again.",
              });
              setModalError(message);
              toast.error(message);
            }
          })();
        }}
        onUpdate={
          onUpdateCustomGame
            ? (payload) => {
                void (async () => {
                  try {
                    await onUpdateCustomGame(
                      payload.name,
                      payload.config,
                      {
                        cover: payload.cover,
                        color: payload.color,
                      },
                    );
                    await persistLastSession(payload.config);
                    draftApi.commitSaved({
                      config: payload.config,
                      name: payload.name,
                      color: payload.color,
                      cover: payload.cover,
                    });
                    setModalOpen(false);
                    setModalError(null);
                    await router.invalidate();
                  } catch (error) {
                    console.error(
                      'Failed to update custom game',
                      error,
                    );
                    const message = t('instructions.updateError', {
                      defaultValue: "Couldn't update — try again.",
                    });
                    setModalError(message);
                    toast.error(message);
                  }
                })();
              }
            : undefined
        }
      />

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('instructions.saveOnPlayTitle', {
                defaultValue: 'Save these settings as a custom game?',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {t('instructions.saveOnPlayNameLabel', {
                  defaultValue: 'Custom game name',
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

      {customGameId && customGameName && (
        <Dialog
          open={customPlayPromptOpen}
          onOpenChange={setCustomPlayPromptOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('instructions.customPlayPromptTitle', {
                  name: customGameName,
                  defaultValue: `Save changes to "${customGameName}"?`,
                })}
              </DialogTitle>
            </DialogHeader>
            {playPromptError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
              >
                {playPromptError}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePromptUpdate}
                className="rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateCustomGame', {
                  name: customGameName,
                  defaultValue: `Update "${customGameName}"`,
                })}
              </button>
              <button
                type="button"
                onClick={handlePromptSaveAsNew}
                className="rounded-lg border border-input bg-background py-2 text-sm font-semibold"
              >
                {t('instructions.saveAsNew', {
                  defaultValue: 'Save as new custom game',
                })}
              </button>
              <button
                type="button"
                onClick={handlePromptPlayWithoutSaving}
                className="rounded-lg border border-input bg-background py-2 text-sm"
              >
                {t('instructions.playWithoutSaving', {
                  defaultValue: 'Play without saving',
                })}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>,
    document.body,
  );
};
