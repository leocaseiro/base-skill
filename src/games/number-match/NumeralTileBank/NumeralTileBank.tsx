import type { TileItem } from '@/components/answer-game/types';
import { skeuoStyle } from '@/components/answer-game/styles';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useBankDropTarget } from '@/components/answer-game/useBankDropTarget';
import { useDraggableTile } from '@/components/answer-game/useDraggableTile';

type TileStyle = 'dots' | 'objects' | 'fingers';

/** Pip positions (0–8) for each die value in a 3×3 grid. */
const DICE_PIPS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Top/bottom split for domino tiles (smaller value on top). */
const DOMINO_SPLIT: Record<number, [number, number]> = {
  1: [1, 0],
  2: [2, 0],
  3: [3, 0],
  4: [4, 0],
  5: [5, 0],
  6: [6, 0],
  7: [2, 5],
  8: [4, 4],
  9: [4, 5],
  10: [5, 5],
  11: [5, 6],
  12: [6, 6],
};

/** Renders one half of a domino (a 3x3 pip grid). Internal only. */
const DiceFace = ({ value }: { value: number }) => {
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
  const [top, bottom] = DOMINO_SPLIT[value] ?? [value, 0];
  return (
    <div className="flex flex-col items-center py-3" aria-hidden="true">
      <DiceFace value={top} />
      <span
        data-divider=""
        className="h-px w-11 shrink-0 bg-current opacity-30"
      />
      <DiceFace value={bottom} />
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

  const isDots = tileStyle === 'dots' && !Number.isNaN(numericValue);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={[
        'flex shrink-0 touch-none select-none cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl p-2 transition-transform active:scale-95 active:cursor-grabbing',
        isDots ? 'h-[136px] w-[72px]' : 'size-20',
      ].join(' ')}
      style={skeuoStyle}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {isDots ? (
        <DominoTile value={numericValue} />
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
      {allTiles
        .filter((t) => !t.id.startsWith('typed-'))
        .map((tile) => {
          const inBank = bankTileIds.includes(tile.id);
          const isDragging = tile.id === dragActiveTileId;
          const isHoverTarget =
            tile.id === dragHoverBankTileId ||
            (!dragHoverBankTileId &&
              isDragOver &&
              !inBank &&
              tile.id === dragActiveTileId);
          const numericValue = Number.parseInt(tile.value, 10);
          const isDots =
            tileStyle === 'dots' && !Number.isNaN(numericValue);
          const holeSizeClass = isDots
            ? 'h-[136px] w-[72px]'
            : 'size-20';

          if (inBank) {
            return (
              <div
                key={tile.id}
                className={[
                  'relative rounded-2xl transition-all',
                  holeSizeClass,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div
                  data-tile-bank-hole={tile.id}
                  className={[
                    'rounded-2xl bg-muted/60 shadow-inner',
                    holeSizeClass,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                />
                <div
                  className={`absolute inset-0${isDragging ? ' opacity-30 pointer-events-none' : ''}`}
                  aria-hidden={isDragging || undefined}
                >
                  <NumeralTile tile={tile} tileStyle={tileStyle} />
                </div>
                {isHoverTarget && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-primary"
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
              className={[
                'relative rounded-2xl bg-muted/60 shadow-inner transition-all',
                holeSizeClass,
                isHoverTarget
                  ? 'border-2 border-dashed border-primary'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
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
