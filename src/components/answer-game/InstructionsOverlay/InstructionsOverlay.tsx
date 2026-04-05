// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameNameChip } from '@/components/GameNameChip';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import { configToTags } from '@/lib/config-tags';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveBookmark: (
    name: string,
    color: BookmarkColorKey,
  ) => Promise<void>;
  onUpdateBookmark?: (
    name: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  configFields: ConfigField[];
}

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
  config,
  onConfigChange,
  onSaveBookmark,
  onUpdateBookmark,
  configFields,
}: InstructionsOverlayProps) => {
  const { t } = useTranslation('games');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = BOOKMARK_COLORS[bookmarkColor];
  const tags = configToTags(config);

  return (
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 flex flex-col items-center justify-start overflow-y-auto bg-background/95 px-5 py-8"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        {/* 1. Game name chip */}
        <div className="w-full">
          <GameNameChip
            title={gameTitle}
            bookmarkName={bookmarkName}
            bookmarkColor={bookmarkColor}
            subject={subject}
          />
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
        <div className="w-full overflow-hidden rounded-xl border border-border">
          {/* Settings header */}
          <button
            type="button"
            aria-label={t('instructions.settings')}
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex min-h-12 w-full items-center gap-2 bg-muted px-3 text-left"
            style={
              settingsOpen
                ? { background: settingsColors.playBg }
                : undefined
            }
          >
            <span
              className="flex-1 text-sm font-semibold"
              style={{ color: settingsOpen ? 'white' : undefined }}
            >
              {t('instructions.settings')}
            </span>
            <span
              className="text-xs"
              style={{
                color: settingsOpen
                  ? 'rgba(255,255,255,0.7)'
                  : undefined,
              }}
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
                  className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded: form + save actions */}
          {settingsOpen && (
            <div className="flex flex-col gap-3 bg-muted/30 p-3">
              <ConfigFormFields
                fields={configFields}
                config={config}
                onChange={onConfigChange}
              />

              <div className="border-t border-border pt-3 flex flex-col gap-2">
                {bookmarkName && onUpdateBookmark ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                      Bookmark name
                      <input
                        type="text"
                        defaultValue={bookmarkName}
                        id="instructions-bookmark-name"
                        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Update ${bookmarkName}`}
                      onClick={() => {
                        const el =
                          document.querySelector<HTMLInputElement>(
                            '#instructions-bookmark-name',
                          );
                        void onUpdateBookmark(
                          el?.value ?? bookmarkName,
                          config,
                        );
                      }}
                      className="h-12 w-full rounded-xl font-bold text-white text-sm"
                      style={{ background: settingsColors.playBg }}
                    >
                      {t('instructions.updateBookmark', {
                        name: bookmarkName,
                        defaultValue: `Update "${bookmarkName}"`,
                      })}
                    </button>
                    <button
                      type="button"
                      aria-label="Save as new bookmark"
                      onClick={() => setSettingsOpen(false)}
                      className="h-12 w-full rounded-xl border border-input bg-background text-sm font-semibold text-primary"
                    >
                      {t('instructions.saveAsNew', {
                        defaultValue: 'Save as new bookmark…',
                      })}
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                    {t('common:saveConfig.saveBookmarkLabel', {
                      defaultValue: 'Save as bookmark',
                    })}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBookmarkName}
                        onChange={(e) =>
                          setNewBookmarkName(e.target.value)
                        }
                        placeholder="e.g. Easy Mode"
                        className="h-12 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Save bookmark"
                        onClick={() => {
                          if (newBookmarkName.trim()) {
                            void onSaveBookmark(
                              newBookmarkName.trim(),
                              DEFAULT_BOOKMARK_COLOR,
                            );
                            setNewBookmarkName('');
                          }
                        }}
                        className="h-12 w-12 flex-shrink-0 rounded-lg bg-primary text-lg text-primary-foreground"
                      >
                        🔖
                      </button>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
