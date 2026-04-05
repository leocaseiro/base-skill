import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useSlotTileDrag } from '@/components/answer-game/useSlotTileDrag';
import { useTileEvaluation } from '@/components/answer-game/useTileEvaluation';

const LetterSlot = ({
  zoneIndex,
  tileId,
  label,
  isActive,
  isWrong,
}: {
  zoneIndex: number;
  tileId: string | null;
  label: string | null;
  isActive: boolean;
  isWrong: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { placeTile } = useTileEvaluation();
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
          placeTile(sourceTileId, zoneIndex);
      },
    });
  }, [zoneIndex, placeTile]);

  // Drag source for placed tiles — touch drag & HTML5 DnD
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
      placeTile(droppedTileId, targetZoneIndex),
  });

  const ariaLabel = label
    ? `Slot ${zoneIndex + 1}, filled with ${label}`
    : `Slot ${zoneIndex + 1}, empty`;

  // Tap any placed tile to return it to the bank
  const handleClick = () => {
    if (tileId) dispatch({ type: 'REMOVE_TILE', zoneIndex });
  };

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-zone-index={zoneIndex}
      data-active={isActive || undefined}
      data-wrong={isWrong || undefined}
      className={[
        'flex size-14 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all',
        'border-border',
        isActive && !label
          ? 'ring-2 ring-primary ring-offset-2 animate-pulse'
          : '',
        isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : '',
        label && !isWrong
          ? 'border-primary bg-primary/10 text-primary'
          : '',
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

export const OrderedLetterSlots = () => {
  const { zones, activeSlotIndex, allTiles } = useAnswerGameContext();

  return (
    <ol
      aria-label="Answer slots"
      className="flex flex-wrap justify-center gap-2"
    >
      {zones.map((zone, i) => {
        const placedTile = zone.placedTileId
          ? allTiles.find((t) => t.id === zone.placedTileId)
          : null;
        return (
          <LetterSlot
            key={zone.id}
            zoneIndex={i}
            tileId={zone.placedTileId}
            label={placedTile?.label ?? null}
            isActive={
              i === activeSlotIndex && zone.placedTileId === null
            }
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
};
