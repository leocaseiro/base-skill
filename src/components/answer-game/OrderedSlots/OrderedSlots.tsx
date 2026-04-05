import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useTouchKeyboard } from '../TouchKeyboardContext';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useSlotTileDrag } from '../useSlotTileDrag';
import { useTileEvaluation } from '../useTileEvaluation';

const AnswerSlot = ({
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
  const focusKeyboard = useTouchKeyboard();

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

  // Scroll active slot into view when the native keyboard is open
  useEffect(() => {
    if (!isActive || !focusKeyboard) return;
    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardOpen = window.innerHeight - vv.height > 150;
      if (keyboardOpen) {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };
    window.visualViewport?.addEventListener(
      'resize',
      handleViewportResize,
    );
    return () =>
      window.visualViewport?.removeEventListener(
        'resize',
        handleViewportResize,
      );
  }, [isActive, focusKeyboard]);

  const ariaLabel = label
    ? `Slot ${zoneIndex + 1}, filled with ${label}`
    : `Slot ${zoneIndex + 1}, empty`;

  const handleSlotClick = () => {
    if (!tileId) focusKeyboard?.();
  };

  const handleSlotKeyDown = (e: React.KeyboardEvent) => {
    if (!tileId && (e.key === 'Enter' || e.key === ' '))
      focusKeyboard?.();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- li is a tap zone for touch keyboard; onKeyDown handles keyboard accessibility
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-zone-index={zoneIndex}
      data-active={isActive || undefined}
      data-wrong={isWrong || undefined}
      onClick={handleSlotClick}
      onKeyDown={handleSlotKeyDown}
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
      {label ? (
        <button
          ref={dragRef}
          type="button"
          aria-label={ariaLabel}
          className="flex size-full touch-none select-none cursor-grab items-center justify-center"
          onClick={() => dispatch({ type: 'REMOVE_TILE', zoneIndex })}
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

export const OrderedSlots = () => {
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
          <AnswerSlot
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
