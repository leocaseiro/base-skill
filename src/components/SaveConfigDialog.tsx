// src/components/SaveConfigDialog.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_GAME_COLOR,
  GAME_COLORS,
  GAME_COLOR_KEYS,
} from '@/lib/game-colors';

type SaveConfigDialogProps = {
  open: boolean;
  suggestedName: string;
  existingNames: string[];
  onSave: (name: string, color: GameColorKey) => void;
  onCancel: () => void;
};

export const SaveConfigDialog = ({
  open,
  suggestedName,
  existingNames,
  onSave,
  onCancel,
}: SaveConfigDialogProps): JSX.Element | null => {
  const { t } = useTranslation('common');
  const [name, setName] = useState(suggestedName);
  const [color, setColor] = useState<GameColorKey>(DEFAULT_GAME_COLOR);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('customGame.errorEmpty'));
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError(t('customGame.errorDuplicate', { name: trimmed }));
      return;
    }
    onSave(trimmed, color);
  };

  if (!open) return null;

  const previewColors = GAME_COLORS[color];

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('customGame.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t('customGame.placeholder')}
              aria-label={t('customGame.nameLabel')}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">
              {t('customGame.colorLabel')}
            </span>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              role="group"
              aria-label={t('customGame.colorLabel')}
            >
              {GAME_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: GAME_COLORS[key].playBg,
                    borderColor:
                      color === key
                        ? GAME_COLORS[key].playBg
                        : 'transparent',
                    outline:
                      color === key ? `3px solid white` : undefined,
                    outlineOffset: color === key ? '-5px' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Preview
            </span>
            <div
              className="inline-flex overflow-hidden rounded-lg border"
              style={
                {
                  borderColor: previewColors.border,
                  '--game-play': previewColors.playBg,
                } as React.CSSProperties
              }
            >
              <div className="game-tag-bg game-text px-3 py-2 text-sm font-semibold">
                {name || t('customGame.placeholder')}
              </div>
              <div
                className="flex w-10 items-center justify-center text-sm text-white"
                style={{ background: 'var(--game-play)' }}
              >
                ▶
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('customGame.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('customGame.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
