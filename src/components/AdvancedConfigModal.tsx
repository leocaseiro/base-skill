import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
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
  DEFAULT_GAME_COLOR,
  GAME_COLORS,
  GAME_COLOR_KEYS,
} from '@/lib/game-colors';

export type AdvancedConfigModalMode =
  | { kind: 'default' }
  | {
      kind: 'customGame';
      configId: string;
      name: string;
      color: GameColorKey;
      cover: Cover | undefined;
    };

type SavePayload = {
  configId?: string;
  name: string;
  color: GameColorKey;
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
  /** Invoked when the user confirms deletion of the current custom game. */
  onDelete?: (configId: string) => Promise<void> | void;
  /** Names of existing custom games for this game — used to surface duplicate-name errors inline. */
  existingCustomGameNames?: readonly string[];
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
  onDelete,
  existingCustomGameNames = [],
}: AdvancedConfigModalProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [config, setConfig] =
    useState<Record<string, unknown>>(initialConfig);
  const [cover, setCover] = useState<Cover | undefined>(
    mode.kind === 'customGame' ? mode.cover : undefined,
  );
  const [name, setName] = useState<string>(
    mode.kind === 'customGame' ? mode.name : '',
  );
  const [color, setColor] = useState<GameColorKey>(
    mode.kind === 'customGame' ? mode.color : DEFAULT_GAME_COLOR,
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fields = getAdvancedConfigFields(gameId);

  const trimmedName = name.trim();
  const currentCustomGameName =
    mode.kind === 'customGame' ? mode.name : null;
  const namesTaken = new Set(
    existingCustomGameNames.filter((n) => n !== currentCustomGameName),
  );

  const nameError: string | null = (() => {
    if (trimmedName === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a custom game name.',
      });
    if (namesTaken.has(trimmedName))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A custom game with that name already exists.',
      });
    return null;
  })();

  const saveNewInvalid = nameError !== null;
  const updateIsRename =
    currentCustomGameName !== null &&
    trimmedName !== currentCustomGameName;
  const updateInvalid = updateIsRename && nameError !== null;
  const showNameError = submitAttempted && nameError !== null;

  const payload: SavePayload = {
    configId: mode.kind === 'customGame' ? mode.configId : undefined,
    name: trimmedName,
    color,
    cover,
    // Saving from the advanced modal marks the config as advanced — otherwise
    // a lingering `configMode: 'simple'` causes the route resolver to rebuild
    // the config from simple-form fields only, wiping advanced-only choices
    // like wrongTileBehavior on reload.
    config: { ...config, configMode: 'advanced' },
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

  const handleConfirmDelete = () => {
    if (mode.kind !== 'customGame' || !onDelete) return;
    void (async () => {
      try {
        await onDelete(mode.configId);
      } finally {
        setConfirmDeleteOpen(false);
        onOpenChange(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === 'customGame'
              ? mode.name
              : 'Advanced settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CoverPicker value={cover} onChange={setCover} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {t('instructions.customGameNameLabel', {
                defaultValue: 'Custom game name',
              })}
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skip by 2"
              aria-invalid={showNameError}
              aria-describedby={
                showNameError ? 'custom-game-name-error' : undefined
              }
              className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                showNameError ? 'border-destructive' : 'border-input'
              }`}
            />
            {showNameError && (
              <span
                id="custom-game-name-error"
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
              aria-label="Custom game color"
            >
              {GAME_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: GAME_COLORS[key].playBg,
                    borderColor:
                      color === key
                        ? GAME_COLORS[key].playBg
                        : 'transparent',
                    outline:
                      color === key ? '3px solid white' : undefined,
                    outlineOffset: color === key ? '-4px' : undefined,
                    boxShadow:
                      color === key
                        ? `0 0 0 2px ${GAME_COLORS[key].playBg}`
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

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {mode.kind === 'customGame' && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-destructive bg-background px-3 py-2 text-sm font-semibold text-destructive"
              >
                <Trash2 size={14} aria-hidden="true" />
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
            >
              {t('instructions.cancel', { defaultValue: 'Cancel' })}
            </button>
            {mode.kind === 'customGame' && onUpdate && (
              <button
                type="button"
                onClick={handleUpdate}
                aria-disabled={updateInvalid}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateCustomGame', {
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
                defaultValue: 'Save as new custom game',
              })}
            </button>
          </div>
        </div>
      </DialogContent>

      {mode.kind === 'customGame' && onDelete && (
        <Dialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('instructions.deleteConfirmTitle', {
                  name: mode.name,
                  defaultValue: `Delete "${mode.name}"?`,
                })}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t('instructions.deleteConfirmBody', {
                defaultValue:
                  "This custom game will be removed. You can't undo this.",
              })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
              >
                {t('instructions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground"
              >
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
