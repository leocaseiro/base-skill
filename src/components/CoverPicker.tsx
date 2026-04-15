import { useState } from 'react';
import type { Cover } from '@/games/cover-type';
import type { JSX } from 'react';

const EMOJI_PALETTE = [
  '🦁',
  '🐱',
  '🐶',
  '🐼',
  '🦋',
  '🌈',
  '⭐',
  '🍎',
  '🍌',
  '🍓',
  '🌳',
  '🌊',
  '🚀',
  '🚂',
  '⚽',
  '🎈',
  '🎨',
  '🎵',
  '🔤',
  '🔢',
  '📊',
  '🧩',
  '🎯',
  '💎',
];

type CoverPickerProps = {
  value: Cover | undefined;
  onChange: (cover: Cover | undefined) => void;
};

export const CoverPicker = ({
  value,
  onChange,
}: CoverPickerProps): JSX.Element => {
  const [url, setUrl] = useState<string>(
    value?.kind === 'image' ? value.src : '',
  );
  const currentEmoji =
    value?.kind === 'emoji' ? value.emoji : undefined;
  const hasImage = value?.kind === 'image';
  const isDefault = value === undefined;

  const pickEmoji = (emoji: string) => {
    setUrl('');
    onChange({ kind: 'emoji', emoji });
  };

  const setImage = (next: string) => {
    setUrl(next);
    if (next.trim()) onChange({ kind: 'image', src: next.trim() });
  };

  const useDefault = () => {
    setUrl('');
    onChange();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        Cover
      </div>
      <div
        className={`grid grid-cols-8 gap-1 ${hasImage ? 'opacity-40' : ''}`}
      >
        {EMOJI_PALETTE.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={e}
            aria-pressed={currentEmoji === e}
            disabled={hasImage}
            onClick={() => pickEmoji(e)}
            className={`aspect-square rounded-lg border-2 text-xl disabled:cursor-not-allowed ${
              currentEmoji === e
                ? 'border-primary bg-primary/10'
                : 'border-transparent bg-muted'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => setImage(e.target.value)}
        placeholder="Image URL (optional)"
        disabled={currentEmoji !== undefined}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={useDefault}
        disabled={isDefault}
        title="Reset to the game's default cover"
        className="self-start rounded-lg px-2 py-1 text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        Use game default
      </button>
    </div>
  );
};
