import type { TileItem } from '@/components/answer-game/types';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

type TileStyle = 'dots' | 'objects' | 'fingers';

/** Pip positions (0–8) for each die value in a 3×3 grid. */
const DICE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Which two die values add up to n for values 7–12. */
const DOMINO_SPLIT: Record<number, [number, number]> = {
  7: [4, 3],
  8: [4, 4],
  9: [5, 4],
  10: [6, 4],
  11: [6, 5],
  12: [6, 6],
};

export const DiceFace = ({ value }: { value: number }) => {
  const pips = DICE_PIPS[value] ?? [];
  return (
    <div
      className="grid grid-cols-3 grid-rows-3 gap-1 p-1"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          data-cell=""
          data-pip={pips.includes(i) ? '' : undefined}
          className={[
            'size-2.5 rounded-full',
            pips.includes(i) ? 'bg-current' : 'bg-transparent',
          ].join(' ')}
        />
      ))}
    </div>
  );
};

export const DominoTile = ({ value }: { value: number }) => {
  const [left, right] = DOMINO_SPLIT[value] ?? [6, value - 6];
  return (
    <div className="flex items-center gap-0" aria-hidden="true">
      <DiceFace value={left} />
      <span
        data-divider=""
        className="h-10 w-px shrink-0 bg-current opacity-30"
      />
      <DiceFace value={right} />
    </div>
  );
};

const NumeralTile = ({
  tile,
  tileStyle,
}: {
  tile: TileItem;
  tileStyle: TileStyle;
}) => {
  const {
    ref,
    handleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDraggableTile(tile);
  const numericValue = Number.parseInt(tile.value, 10);

  const isDomino =
    tileStyle === 'dots' &&
    !Number.isNaN(numericValue) &&
    numericValue > 6 &&
    numericValue <= 12;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={[
        'flex shrink-0 touch-none select-none cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl bg-card p-2 shadow-md transition-transform active:scale-95 active:cursor-grabbing',
        isDomino ? 'h-[72px] w-32' : 'size-20',
      ].join(' ')}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {tileStyle === 'dots' && !Number.isNaN(numericValue) ? (
        numericValue <= 6 ? (
          <DiceFace value={numericValue} />
        ) : numericValue <= 12 ? (
          <DominoTile value={numericValue} />
        ) : (
          <span className="text-3xl font-bold tabular-nums leading-none">
            {tile.label}
          </span>
        )
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
  const { allTiles, bankTileIds, dragActiveTileId } =
    useAnswerGameContext();
  return (
    <div
      data-tile-bank=""
      className="flex flex-wrap justify-center gap-3"
    >
      {allTiles.map((tile) => {
        if (
          bankTileIds.includes(tile.id) &&
          tile.id !== dragActiveTileId
        ) {
          return (
            <NumeralTile
              key={tile.id}
              tile={tile}
              tileStyle={tileStyle}
            />
          );
        }
        const numericValue = Number.parseInt(tile.value, 10);
        const isDomino =
          tileStyle === 'dots' &&
          !Number.isNaN(numericValue) &&
          numericValue > 6 &&
          numericValue <= 12;
        return (
          <div
            key={tile.id}
            className={[
              'rounded-2xl bg-muted/30 shadow-inner',
              isDomino ? 'h-[72px] w-32' : 'size-20',
            ].join(' ')}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};
