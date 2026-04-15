import { useState } from 'react';
import type { Cover } from '@/games/cover-type';
import type { GradientKey } from '@/lib/cover-gradients';
import type { JSX } from 'react';
import {
  GRADIENTS,
  GRADIENT_KEYS,
  findGradientKey,
  findGradientKeyFromCss,
  gradientCss,
} from '@/lib/cover-gradients';

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
  onChange: (cover?: Cover) => void;
};

const selectedGradientKey = (
  value: Cover | undefined,
): GradientKey | undefined => {
  if (!value) return undefined;
  if (value.kind === 'emoji') return findGradientKey(value.gradient);
  return findGradientKeyFromCss(value.background);
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
  const currentGradient = selectedGradientKey(value);

  const pickEmoji = (emoji: string) => {
    setUrl('');
    const carriedGradient =
      value?.kind === 'emoji'
        ? value.gradient
        : value?.kind === 'image'
          ? findGradientKeyFromCss(value.background)
            ? GRADIENTS[findGradientKeyFromCss(value.background)!]
            : undefined
          : undefined;
    onChange({ kind: 'emoji', emoji, gradient: carriedGradient });
  };

  const setImage = (next: string) => {
    setUrl(next);
    if (next.trim()) {
      const carriedBg =
        value?.kind === 'emoji' && value.gradient
          ? gradientCss(value.gradient)
          : value?.kind === 'image'
            ? value.background
            : undefined;
      onChange({
        kind: 'image',
        src: next.trim(),
        background: carriedBg,
      });
    }
  };

  const useDefault = () => {
    setUrl('');
    const cleared: Cover | undefined = undefined;
    onChange(cleared);
  };

  const clearEmoji = () => {
    onChange();
  };

  const clearImage = () => {
    setUrl('');
    onChange();
  };

  const applyGradient = (key?: GradientKey) => {
    if (!value) return;
    if (value.kind === 'emoji') {
      onChange({
        ...value,
        gradient: key ? GRADIENTS[key] : undefined,
      });
      return;
    }
    onChange({
      ...value,
      background: key ? gradientCss(GRADIENTS[key]) : undefined,
    });
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
        <button
          type="button"
          aria-label="No emoji"
          disabled={hasImage || currentEmoji === undefined}
          onClick={clearEmoji}
          title="Clear emoji so you can use an image URL"
          className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          disabled={currentEmoji !== undefined}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-9 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
        {hasImage && (
          <button
            type="button"
            aria-label="Clear image URL"
            onClick={clearImage}
            title="Clear image URL so you can pick an emoji"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        )}
      </div>

      <div
        className={`flex flex-col gap-1 ${isDefault ? 'opacity-40' : ''}`}
      >
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Background gradient
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}
          role="group"
          aria-label="Cover background gradient"
        >
          {GRADIENT_KEYS.map((key) => {
            const isSelected = currentGradient === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={key}
                aria-pressed={isSelected}
                disabled={isDefault}
                onClick={() => applyGradient(key)}
                className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                style={{
                  background: gradientCss(GRADIENTS[key]),
                  borderColor: isSelected ? '#ffffff' : 'transparent',
                  outline: isSelected
                    ? `3px solid ${GRADIENTS[key][0]}`
                    : undefined,
                  outlineOffset: isSelected ? '-1px' : undefined,
                }}
              />
            );
          })}
          <button
            type="button"
            aria-label="None"
            aria-pressed={value !== undefined && !currentGradient}
            disabled={isDefault}
            onClick={() => applyGradient()}
            title="No gradient"
            className="relative h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/60 bg-muted transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 m-auto h-[2px] w-6 rotate-45 rounded bg-muted-foreground/70"
            />
          </button>
        </div>
      </div>

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
