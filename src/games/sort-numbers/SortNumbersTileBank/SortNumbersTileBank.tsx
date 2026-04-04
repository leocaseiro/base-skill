import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

const NumberTile = ({ tile }: { tile: TileItem }) => {
  const { ref, handleClick } = useDraggableTile(tile);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className="flex size-14 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
      onClick={handleClick}
    >
      {tile.label}
    </button>
  );
};

export const SortNumbersTileBank = () => {
  const { allTiles, bankTileIds } = useAnswerGameContext();

  const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {bankTiles.map((tile) => (
        <NumberTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
};
