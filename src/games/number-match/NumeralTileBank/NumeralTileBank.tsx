import type { TileItem } from '@/components/answer-game/types';
import { tileStyle as tileSurfaceStyle } from '@/components/answer-game/styles';
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
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
      className="grid grid-cols-3 grid-rows-3 gap-1 py-3 px-1"
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

const isLongWord = (label: string): boolean => label.length > 6;

const NumeralTile = ({
  tile,
  tileStyle,
  tilesShowGroup,
}: {
  tile: TileItem;
  tileStyle: TileStyle;
  tilesShowGroup: boolean;
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

  const showDomino =
    tilesShowGroup &&
    tileStyle === 'dots' &&
    !Number.isNaN(numericValue);
  const isWordTile =
    !tilesShowGroup && Number.isNaN(Number(tile.label));
  const sizeClass = showDomino
    ? 'h-[136px] w-[72px]'
    : isWordTile
      ? 'min-w-[80px] h-20 px-2'
      : 'size-20';

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Number ${tile.label}`}
      className={[
        'flex shrink-0 touch-none select-none cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl p-2 transition-transform active:scale-95 active:cursor-grabbing',
        sizeClass,
      ].join(' ')}
      style={tileSurfaceStyle()}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {showDomino ? (
        <DominoTile value={numericValue} />
      ) : isWordTile ? (
        <span
          className={[
            'block text-center font-bold leading-tight hyphens-auto break-words',
            isLongWord(tile.label) ? 'text-sm' : 'text-xl',
          ].join(' ')}
        >
          {tile.label}
        </span>
      ) : (
        <span
          className={`${getNumericTileFontClass(tile.label.length, 80)} font-bold tabular-nums leading-none`}
        >
          {tile.label}
        </span>
      )}
    </button>
  );
};

export interface NumeralTileBankProps {
  tileStyle: TileStyle;
  tilesShowGroup: boolean;
}

export const NumeralTileBank = ({
  tileStyle,
  tilesShowGroup,
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
          const showDomino =
            tilesShowGroup &&
            tileStyle === 'dots' &&
            !Number.isNaN(numericValue);
          const isWordTile =
            !tilesShowGroup && Number.isNaN(Number(tile.label));
          const holeSizeClass = showDomino
            ? 'h-[136px] w-[72px]'
            : isWordTile
              ? 'min-w-[80px] h-20'
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
                  className={['rounded-2xl', holeSizeClass]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    background: 'var(--skin-bank-hole-bg)',
                    boxShadow: 'var(--skin-bank-hole-shadow)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className={`absolute inset-0${isDragging ? ' opacity-30 pointer-events-none' : ''}`}
                  aria-hidden={isDragging || undefined}
                >
                  <NumeralTile
                    tile={tile}
                    tileStyle={tileStyle}
                    tilesShowGroup={tilesShowGroup}
                  />
                </div>
                {isHoverTarget && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl border-2"
                    style={{
                      borderColor: 'var(--skin-hover-border-color)',
                      borderStyle:
                        'var(--skin-hover-border-style)' as React.CSSProperties['borderStyle'],
                    }}
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
                'relative rounded-2xl transition-all',
                holeSizeClass,
                isHoverTarget ? 'border-2' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                background: 'var(--skin-bank-hole-bg)',
                boxShadow: 'var(--skin-bank-hole-shadow)',
                ...(isHoverTarget
                  ? {
                      borderColor: 'var(--skin-hover-border-color)',
                      borderStyle:
                        'var(--skin-hover-border-style)' as React.CSSProperties['borderStyle'],
                    }
                  : {}),
              }}
              aria-hidden="true"
            >
              {isHoverTarget &&
                (showDomino ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50">
                    <DominoTile value={numericValue} />
                  </div>
                ) : isWordTile ? (
                  <span
                    className={[
                      'pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center font-bold leading-tight hyphens-auto break-words opacity-50',
                      isLongWord(tile.label) ? 'text-sm' : 'text-xl',
                    ].join(' ')}
                  >
                    {tile.label}
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center ${getNumericTileFontClass(tile.label.length, 80)} font-bold tabular-nums opacity-50`}
                  >
                    {tile.label}
                  </span>
                ))}
            </div>
          );
        })}
    </div>
  );
};
