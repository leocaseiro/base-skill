import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useTileEvaluation } from '@/components/answer-game/useTileEvaluation';

const NumberSlot = ({
  zoneIndex,
  label,
  isActive,
  isWrong,
}: {
  zoneIndex: number;
  label: string | null;
  isActive: boolean;
  isWrong: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { placeTile } = useTileEvaluation();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const tileId = source.data['tileId'];
        if (typeof tileId === 'string') placeTile(tileId, zoneIndex);
      },
    });
  }, [zoneIndex, placeTile]);

  const ariaLabel = label
    ? `Slot ${zoneIndex + 1}, filled with ${label}`
    : `Slot ${zoneIndex + 1}, empty`;

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-active={isActive || undefined}
      data-wrong={isWrong || undefined}
      className={[
        'flex size-14 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all',
        'border-border',
        isActive && !label
          ? 'animate-pulse ring-2 ring-primary ring-offset-2'
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
      {label ?? ''}
    </li>
  );
};

export const NumberSequenceSlots = () => {
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
          <NumberSlot
            key={zone.id}
            zoneIndex={i}
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
