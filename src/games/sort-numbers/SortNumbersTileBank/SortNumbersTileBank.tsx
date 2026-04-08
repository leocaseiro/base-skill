import type { TileItem } from '@/components/answer-game/types';
import { skeuoStyle } from '@/components/answer-game/styles';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useBankDropTarget } from '@/components/answer-game/useBankDropTarget';
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
      className="flex size-14 touch-none select-none cursor-grab items-center justify-center rounded-xl text-2xl font-bold transition-transform active:scale-95 active:cursor-grabbing"
      style={skeuoStyle}
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
  const {
    allTiles,
    bankTileIds,
    dragActiveTileId,
    dragHoverBankTileId,
  } = useAnswerGameContext();
  const { bankRef, isDragOver } = useBankDropTarget();

  return (
    <div
      ref={bankRef}
      data-tile-bank=""
      className="flex flex-wrap justify-center gap-3"
    >
      {allTiles.map((tile) => {
        const inBank = bankTileIds.includes(tile.id);
        const isDragging = tile.id === dragActiveTileId;
        const isHoverTarget =
          tile.id === dragHoverBankTileId ||
          (!dragHoverBankTileId &&
            isDragOver &&
            !inBank &&
            tile.id === dragActiveTileId);

        if (inBank) {
          return (
            <div
              key={tile.id}
              className="relative size-14 rounded-xl transition-all"
            >
              <div
                data-tile-bank-hole={tile.id}
                className="size-14 rounded-xl bg-muted/60 shadow-inner"
                aria-hidden="true"
              />
              <div
                className={`absolute inset-0${isDragging ? ' opacity-30 pointer-events-none' : ''}`}
                aria-hidden={isDragging || undefined}
              >
                <NumberTile tile={tile} />
              </div>
              {isHoverTarget && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-primary"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={tile.id}
            data-tile-bank-hole={tile.id}
            className={`relative size-14 rounded-xl bg-muted/60 shadow-inner transition-all${isHoverTarget ? ' border-2 border-dashed border-primary' : ''}`}
            aria-hidden="true"
          >
            {isHoverTarget && (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold opacity-50">
                {tile.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
