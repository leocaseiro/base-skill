import type { SpotAllTile as SpotAllTileData } from '../types';
import type { JSX } from 'react';
import { cn } from '@/lib/utils';

export interface SpotAllTileProps {
  tile: SpotAllTileData;
  isSelected: boolean;
  inCooldown: boolean;
  onTap: () => void;
}

export const SpotAllTile = ({
  tile,
  isSelected,
  inCooldown,
  onTap,
}: SpotAllTileProps): JSX.Element => (
  <button
    type="button"
    onClick={onTap}
    disabled={inCooldown}
    aria-pressed={isSelected}
    data-cooldown={inCooldown || undefined}
    className={cn(
      'flex min-h-24 min-w-24 items-center justify-center rounded-[var(--skin-tile-radius)] border-2 px-3 py-2 transition-all',
      'bg-[var(--skin-tile-bg)] text-[var(--skin-tile-text)] border-[var(--skin-tile-border)] shadow-[var(--skin-tile-shadow)]',
      isSelected &&
        'border-[var(--skin-correct-border)] bg-[var(--skin-correct-bg)]',
      inCooldown &&
        'border-[var(--skin-wrong-border)] bg-[var(--skin-wrong-bg)] animate-[shake_300ms_ease-in-out]',
    )}
  >
    <span
      style={{
        fontFamily: tile.visualVariation?.fontFamily,
        fontSize: tile.visualVariation?.fontSizePx,
        color: tile.visualVariation?.color,
        transform: tile.transform,
        display: 'inline-block',
      }}
      className="font-bold leading-none"
    >
      {tile.label}
    </span>
  </button>
);
