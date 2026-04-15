import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { CoverPicker } from '@/components/CoverPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAdvancedConfigFields } from '@/games/config-fields-registry';
import {
  BOOKMARK_COLORS,
  BOOKMARK_COLOR_KEYS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';

export type AdvancedConfigModalMode =
  | { kind: 'default' }
  | {
      kind: 'bookmark';
      configId: string;
      name: string;
      color: BookmarkColorKey;
      cover: Cover | undefined;
    };

type SavePayload = {
  configId?: string;
  name: string;
  color: BookmarkColorKey;
  cover: Cover | undefined;
  config: Record<string, unknown>;
};

type AdvancedConfigModalProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  gameId: string;
  mode: AdvancedConfigModalMode;
  config: Record<string, unknown>;
  onCancel: () => void;
  onUpdate?: (payload: SavePayload) => void;
  onSaveNew: (payload: SavePayload) => void;
  /** Names of existing bookmarks for this game — used to surface duplicate-name errors inline. */
  existingBookmarkNames?: readonly string[];
};

export const AdvancedConfigModal = ({
  open,
  onOpenChange,
  gameId,
  mode,
  config: initialConfig,
  onCancel,
  onUpdate,
  onSaveNew,
  existingBookmarkNames = [],
}: AdvancedConfigModalProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [config, setConfig] =
    useState<Record<string, unknown>>(initialConfig);
  const [cover, setCover] = useState<Cover | undefined>(
    mode.kind === 'bookmark' ? mode.cover : undefined,
  );
  const [name, setName] = useState<string>(
    mode.kind === 'bookmark' ? mode.name : '',
  );
  const [color, setColor] = useState<BookmarkColorKey>(
    mode.kind === 'bookmark' ? mode.color : DEFAULT_BOOKMARK_COLOR,
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fields = getAdvancedConfigFields(gameId);

  const trimmedName = name.trim();
  const currentBookmarkName =
    mode.kind === 'bookmark' ? mode.name : null;
  const namesTaken = new Set(
    existingBookmarkNames.filter((n) => n !== currentBookmarkName),
  );

  const nameError: string | null = (() => {
    if (trimmedName === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a bookmark name.',
      });
    if (namesTaken.has(trimmedName))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A bookmark with that name already exists.',
      });
    return null;
  })();

  const saveNewInvalid = nameError !== null;
  const updateIsRename =
    currentBookmarkName !== null && trimmedName !== currentBookmarkName;
  const updateInvalid = updateIsRename && nameError !== null;
  const showNameError = submitAttempted && nameError !== null;

  const payload: SavePayload = {
    configId: mode.kind === 'bookmark' ? mode.configId : undefined,
    name: trimmedName,
    color,
    cover,
    config,
  };

  const handleSaveNew = () => {
    setSubmitAttempted(true);
    if (saveNewInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onSaveNew(payload);
  };

  const handleUpdate = () => {
    if (!onUpdate) return;
    setSubmitAttempted(true);
    if (updateInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onUpdate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === 'bookmark' ? mode.name : 'Advanced settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CoverPicker value={cover} onChange={setCover} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Bookmark name
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skip by 2"
              aria-invalid={showNameError}
              aria-describedby={
                showNameError ? 'bookmark-name-error' : undefined
              }
              className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                showNameError ? 'border-destructive' : 'border-input'
              }`}
            />
            {showNameError && (
              <span
                id="bookmark-name-error"
                role="alert"
                className="text-xs font-semibold text-destructive"
              >
                {nameError}
              </span>
            )}
          </label>

          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Color
            </div>
            <div
              className="mt-1 grid gap-1"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              role="group"
              aria-label="Bookmark color"
            >
              {BOOKMARK_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: BOOKMARK_COLORS[key].playBg,
                    borderColor:
                      color === key
                        ? BOOKMARK_COLORS[key].playBg
                        : 'transparent',
                    outline:
                      color === key ? '3px solid white' : undefined,
                    outlineOffset: color === key ? '-4px' : undefined,
                    boxShadow:
                      color === key
                        ? `0 0 0 2px ${BOOKMARK_COLORS[key].playBg}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <ConfigFormFields
            fields={fields}
            config={config}
            onChange={setConfig}
          />

          <div className="flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
            >
              {t('instructions.cancel', { defaultValue: 'Cancel' })}
            </button>
            {mode.kind === 'bookmark' && onUpdate && (
              <button
                type="button"
                onClick={handleUpdate}
                aria-disabled={updateInvalid}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateBookmark', {
                  name: mode.name,
                  defaultValue: `Update "${mode.name}"`,
                })}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveNew}
              aria-disabled={saveNewInvalid}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                mode.kind === 'default'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background'
              }`}
            >
              {t('instructions.saveAsNew', {
                defaultValue: 'Save as new bookmark',
              })}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
