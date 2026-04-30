import type { SpotAllTile as SpotAllTileData } from '../types';
import type { CSSProperties, JSX } from 'react';
import { tileStyle } from '@/components/answer-game/styles';
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
}: SpotAllTileProps): JSX.Element => {
  const stateStyle: CSSProperties = isSelected
    ? {
        background: 'var(--skin-correct-bg)',
        borderColor: 'var(--skin-correct-border)',
      }
    : inCooldown
      ? {
          background: 'var(--skin-wrong-bg)',
          borderColor: 'var(--skin-wrong-border)',
        }
      : { borderColor: 'transparent' };

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={inCooldown}
      aria-pressed={isSelected}
      data-cooldown={inCooldown || undefined}
      className={cn(
        'flex min-h-24 min-w-24 items-center justify-center rounded-xl border-2 px-3 py-2 transition-all',
        'outline-none focus-visible:outline-2 focus-visible:outline-ring/70 focus-visible:outline-offset-2',
        inCooldown && 'animate-[shake_300ms_ease-in-out]',
      )}
      style={{ ...tileStyle(), ...stateStyle }}
    >
      <span
        style={{
          fontFamily: tile.visualVariation?.fontFamily,
          fontSize: tile.visualVariation?.fontSizePx,
          transform: tile.transform,
          display: 'inline-block',
        }}
        className="font-bold leading-none"
      >
        {tile.label}
      </span>
    </button>
  );
};
