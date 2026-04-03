import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useFreeSwap } from '@/components/answer-game/useFreeSwap';

const PairZone = ({
  zoneIndex,
  label,
  isWrong,
}: {
  zoneIndex: number;
  label: string | null;
  isWrong: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { swapOrPlace } = useFreeSwap();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const tileId = source.data['tileId'];
        if (typeof tileId === 'string') swapOrPlace(tileId, zoneIndex);
      },
    });
  }, [zoneIndex, swapOrPlace]);

  const ariaLabel = label
    ? `Zone ${zoneIndex + 1}, filled with ${label}`
    : `Zone ${zoneIndex + 1}, empty`;

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
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
      {label ?? ''}
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
            label={placedTile?.label ?? null}
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
};
