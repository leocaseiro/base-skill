import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
import { useGameTTS } from '@/components/answer-game/useGameTTS';

type TileStyle = 'dots' | 'objects' | 'fingers';

/** Dot pattern fixed inside the square tile (3 columns, up to 9 dots). */
const DotsTile = ({ count }: { count: number }) => (
  <div
    className="grid w-full grid-cols-3 place-content-center place-items-center gap-x-2.5 gap-y-2 px-0.5"
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, i) => (
      <span key={i} className="size-2.5 rounded-full bg-current" />
    ))}
  </div>
);

const NumeralTile = ({
  tile,
  tileStyle,
}: {
  tile: TileItem;
  tileStyle: TileStyle;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { placeInNextSlot } = useAutoNextSlot();
  const { speakTile } = useGameTTS();
  const numericValue = Number.parseInt(tile.value, 10);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData: () => ({ tileId: tile.id }),
    });
  }, [tile.id]);

  const handleClick = () => {
    speakTile(tile.label);
    placeInNextSlot(tile.id);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className="flex size-20 shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl bg-card p-2 shadow-md transition-transform active:scale-95 active:cursor-grabbing"
      onClick={handleClick}
    >
      {tileStyle === 'dots' && !Number.isNaN(numericValue) ? (
        <DotsTile count={numericValue} />
      ) : (
        <span className="text-3xl font-bold tabular-nums leading-none">
          {tile.label}
        </span>
      )}
    </button>
  );
};

export interface NumeralTileBankProps {
  tileStyle: TileStyle;
}

export const NumeralTileBank = ({
  tileStyle,
}: NumeralTileBankProps) => {
  const { allTiles, bankTileIds } = useAnswerGameContext();
  const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {bankTiles.map((tile) => (
        <NumeralTile key={tile.id} tile={tile} tileStyle={tileStyle} />
      ))}
    </div>
  );
};
