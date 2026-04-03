import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
import { useGameTTS } from '@/components/answer-game/useGameTTS';

const NumberTile = ({ tile }: { tile: TileItem }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();
  const speakTileRef = useRef(speakTile);

  useEffect(() => {
    speakTileRef.current = speakTile;
  }, [speakTile]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
      onDragStart: () => speakTileRef.current(tile.label),
    });
  }, [tile.id, tile.label]);

  const handleClick = () => {
    speakTile(tile.label);
    placeInNextSlot(tile.id);
  };

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
