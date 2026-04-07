import { skeuoStyle } from '../styles';
import { useSlotBehavior } from './useSlotBehavior';
import type { SlotRenderProps } from './useSlotBehavior';
import type { ReactNode, Ref } from 'react';

interface SlotProps {
  index: number;
  as?: 'li' | 'span' | 'div';
  className?: string;
  children: (props: SlotRenderProps) => ReactNode;
}

export const Slot = ({
  index,
  as: Tag = 'li',
  className,
  children,
}: SlotProps) => {
  const {
    renderProps,
    slotRef,
    dragRef,
    handleClick,
    pointerHandlers,
    isBeingDragged,
  } = useSlotBehavior(index);

  const { label, isEmpty, isWrong, isActive, showCursor } = renderProps;

  const ariaLabel = isEmpty
    ? `Slot ${index + 1}, empty`
    : `Slot ${index + 1}, filled with ${label}`;

  const stateClasses = [
    'relative flex items-center justify-center border-2 transition-all overflow-hidden',
    isEmpty && !isActive
      ? 'border-border'
      : isEmpty && isActive
        ? 'border-primary ring-2 ring-primary ring-offset-2'
        : isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-primary bg-primary/10 text-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={
        slotRef as Ref<HTMLLIElement & HTMLSpanElement & HTMLDivElement>
      }
      aria-label={ariaLabel}
      data-zone-index={index}
      className={[stateClasses, className].filter(Boolean).join(' ')}
    >
      {isEmpty ? (
        <>
          {children(renderProps)}
          {showCursor ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-sm bg-primary animate-blink"
            />
          ) : null}
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-muted/60 shadow-inner"
            aria-hidden="true"
          />
          <button
            ref={dragRef}
            type="button"
            className={`absolute inset-0 flex touch-none select-none cursor-grab items-center justify-center rounded-[inherit] text-card-foreground${isBeingDragged ? ' invisible pointer-events-none' : ''}`}
            aria-hidden={isBeingDragged ? 'true' : undefined}
            style={skeuoStyle}
            onClick={handleClick}
            onPointerDown={pointerHandlers.onPointerDown}
            onPointerMove={pointerHandlers.onPointerMove}
            onPointerUp={pointerHandlers.onPointerUp}
            onPointerCancel={pointerHandlers.onPointerCancel}
          >
            {children(renderProps)}
          </button>
        </>
      )}
    </Tag>
  );
};
