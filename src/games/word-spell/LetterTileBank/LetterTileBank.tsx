import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

const LetterTile = ({ tile }: { tile: TileItem }) => {
  const {
    ref,
    handleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDraggableTile(tile);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Letter ${tile.label}`}
      className="flex size-14 touch-none select-none cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {tile.label}
    </button>
  );
};

export const LetterTileBank = () => {
  const { allTiles, bankTileIds, config } = useAnswerGameContext();

  if (config.inputMethod === 'type') {
    const isTouch = navigator.maxTouchPoints > 0;
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isTouch
          ? 'Tap a slot to type'
          : '⌨️ Type the letters on your keyboard'}
      </p>
    );
  }

  const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {bankTiles.map((tile) => (
        <LetterTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
};
