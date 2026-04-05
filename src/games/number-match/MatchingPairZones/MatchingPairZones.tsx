import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useFreeSwap } from '@/components/answer-game/useFreeSwap';
import { useSlotTileDrag } from '@/components/answer-game/useSlotTileDrag';

const PairZone = ({
  zoneIndex,
  tileId,
  label,
  isWrong,
}: {
  zoneIndex: number;
  tileId: string | null;
  label: string | null;
  isWrong: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { swapOrPlace } = useFreeSwap();
  const dispatch = useAnswerGameDispatch();

  // Drop target for HTML5 DnD (bank tiles dragged in via desktop)
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const sourceTileId = source.data['tileId'];
        if (typeof sourceTileId === 'string')
          swapOrPlace(sourceTileId, zoneIndex);
      },
    });
  }, [zoneIndex, swapOrPlace]);

  // Drag source for placed tiles — touch drag & HTML5 DnD
  // REMOVE_TILE is dispatched on drag start so the tile is back in the bank
  // when the drop target fires, keeping the swap/place logic consistent.
  const {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useSlotTileDrag({
    tileId,
    label,
    zoneIndex,
    onDrop: (droppedTileId, targetZoneIndex) =>
      swapOrPlace(droppedTileId, targetZoneIndex),
  });

  const ariaLabel = label
    ? `Zone ${zoneIndex + 1}, filled with ${label}`
    : `Zone ${zoneIndex + 1}, empty`;

  // Tap any placed tile to return it to the bank
  const handleClick = () => {
    if (tileId) dispatch({ type: 'REMOVE_TILE', zoneIndex });
  };

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-zone-index={zoneIndex}
      className={[
        'flex size-20 items-center justify-center rounded-2xl border-2 text-3xl font-bold transition-all',
        isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : label
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-dashed border-muted-foreground/40',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label ? (
        <button
          ref={dragRef}
          type="button"
          aria-label={ariaLabel}
          className="flex size-full touch-none select-none cursor-grab items-center justify-center"
          onClick={handleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {label}
        </button>
      ) : null}
    </li>
  );
};

export const MatchingPairZones = () => {
  const { zones, allTiles } = useAnswerGameContext();

  return (
    <ol
      aria-label="Answer slots"
      className="flex flex-wrap justify-center gap-4"
    >
      {zones.map((zone, i) => {
        const placedTile = zone.placedTileId
          ? allTiles.find((t) => t.id === zone.placedTileId)
          : null;
        return (
          <PairZone
            key={zone.id}
            zoneIndex={i}
            tileId={zone.placedTileId}
            label={placedTile?.label ?? null}
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
};
