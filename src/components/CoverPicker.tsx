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
    const cleared: Cover | undefined = undefined;
    onChange(cleared);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        Cover
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_PALETTE.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={e}
            aria-pressed={currentEmoji === e}
            onClick={() => pickEmoji(e)}
            className={`aspect-square rounded-lg border-2 text-xl ${
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
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
      />
      <button
        type="button"
        onClick={useDefault}
        className="self-start text-xs underline text-muted-foreground"
      >
        Use game default
      </button>
    </div>
  );
};
