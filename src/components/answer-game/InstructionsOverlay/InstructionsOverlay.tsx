// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCover } from '@/components/GameCover';
import { getSimpleConfigFormRenderer } from '@/games/config-fields-registry';
import { resolveCover } from '@/games/cover';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

type InstructionsOverlayProps = {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  gameId: string;
  cover?: Cover;
  bookmarkId?: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveBookmark: (
    name: string,
    color: BookmarkColorKey,
  ) => Promise<void>;
  onUpdateBookmark?: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: Cover; color?: BookmarkColorKey },
  ) => Promise<void>;
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
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  config,
  onConfigChange,
  onSaveBookmark,
  onUpdateBookmark,
}: InstructionsOverlayProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = BOOKMARK_COLORS[bookmarkColor];
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

  return createPortal(
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 flex flex-col items-center justify-start overflow-y-auto bg-background/95 px-5 pb-8 pt-24"
    >
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-lg">
        {/* 1. Hero cover */}
        <div className="flex justify-center bg-muted/40 p-4">
          <GameCover cover={resolvedCover} size="hero" />
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* 2. Title row + cog */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold">{gameTitle}</h2>
              {bookmarkName && (
                <p
                  className="text-xs italic"
                  style={{ color: settingsColors.playBg }}
                >
                  {bookmarkName}
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
            onClick={onStart}
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
        onCancel={() => setModalOpen(false)}
        onSaveNew={(payload) => {
          void onSaveBookmark(payload.name, payload.color);
          setModalOpen(false);
        }}
        onUpdate={
          onUpdateBookmark
            ? (payload) => {
                void onUpdateBookmark(payload.name, payload.config, {
                  cover: payload.cover,
                  color: payload.color,
                });
                onConfigChange(payload.config);
                setModalOpen(false);
              }
            : undefined
        }
      />
    </div>,
    document.body,
  );
};
