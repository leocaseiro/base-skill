import type { SpotAllTile as SpotAllTileData } from '../types';
import type { JSX } from 'react';
import { cn } from '@/lib/utils';

export const SpotAllTile = ({
  tile,
  isSelected,
  feedback,
  onToggle,
}: {
  tile: SpotAllTileData;
  isSelected: boolean;
  feedback: 'none' | 'correct' | 'incorrect';
  onToggle: () => void;
}): JSX.Element => {
  const showCorrect = feedback === 'correct' && tile.isCorrect;
  const showIncorrect =
    feedback === 'incorrect' && isSelected && !tile.isCorrect;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex min-h-24 min-w-24 items-center justify-center rounded-2xl border-2 bg-card px-3 py-2 shadow-sm transition-all',
        isSelected
          ? 'border-primary ring-2 ring-primary/25'
          : 'border-border',
        showCorrect && 'border-emerald-500 bg-emerald-50',
        showIncorrect && 'border-rose-500 bg-rose-50',
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
};
