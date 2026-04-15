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
import { configToTags } from '@/lib/config-tags';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = BOOKMARK_COLORS[bookmarkColor];
  const tags = configToTags(config);
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
      className="fixed inset-0 z-40 flex flex-col items-center justify-start overflow-y-auto bg-background/95 px-5 pb-8 pt-10"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        {/* 1. Hero cover + title row */}
        <div className="w-full">
          <GameCover cover={resolvedCover} size="hero" />
          <div className="mt-3 flex items-center justify-between gap-2">
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
        </div>

        {/* 2. Instructions text */}
        <p className="max-w-xs text-center text-base font-semibold text-foreground leading-relaxed">
          {text}
        </p>

        {/* 3. Let's go button */}
        <button
          type="button"
          onClick={onStart}
          className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
        >
          {t('instructions.lets-go')}
        </button>

        {/* 4. Settings chip (collapsed by default) */}
        <div
          className="w-full overflow-hidden rounded-xl border border-border"
          style={
            {
              '--bookmark-play': settingsColors.playBg,
            } as React.CSSProperties
          }
        >
          {/* Settings header */}
          <button
            type="button"
            aria-label={t('instructions.settings')}
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex min-h-12 w-full items-center gap-2 bg-muted px-3 text-left"
            style={
              settingsOpen
                ? { background: 'var(--bookmark-play)' }
                : undefined
            }
          >
            <span
              className={`flex-1 text-sm font-semibold ${settingsOpen ? 'text-white' : ''}`}
            >
              {t('instructions.settings')}
            </span>
            <span
              className={`text-xs ${settingsOpen ? 'text-white/70' : ''}`}
            >
              {settingsOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Collapsed: config summary tags */}
          {!settingsOpen && (
            <div className="flex flex-wrap gap-1 bg-muted/50 px-3 pb-2 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded: simple settings form */}
          {settingsOpen && (
            <div className="flex flex-col gap-3 bg-muted/30 p-3">
              {SimpleForm && (
                <SimpleForm config={config} onChange={onConfigChange} />
              )}
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
