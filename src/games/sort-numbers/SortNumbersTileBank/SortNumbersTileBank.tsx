import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

const NumberTile = ({ tile }: { tile: TileItem }) => {
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
      aria-label={`Number ${tile.label}`}
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

export const SortNumbersTileBank = () => {
  const { allTiles, bankTileIds, dragActiveTileId } =
    useAnswerGameContext();

  return (
    <div
      data-tile-bank=""
      className="flex flex-wrap justify-center gap-3"
    >
      {allTiles.map((tile) =>
        bankTileIds.includes(tile.id) &&
        tile.id !== dragActiveTileId ? (
          <NumberTile key={tile.id} tile={tile} />
        ) : (
          <div
            key={tile.id}
            className="size-14 rounded-xl bg-muted/30 shadow-inner"
            aria-hidden="true"
          />
        ),
      )}
    </div>
  );
};
