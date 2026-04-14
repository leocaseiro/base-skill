import { skeuoStyle } from '../styles';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useSlotBehavior } from './useSlotBehavior';
import type { SlotRenderProps } from './useSlotBehavior';
import type { GameSkin } from '@/lib/skin';
import type { ReactNode, Ref } from 'react';

interface SlotProps {
  index: number;
  as?: 'li' | 'span' | 'div';
  className?: string;
  children: (props: SlotRenderProps) => ReactNode;
  /**
   * Optional custom preview renderer. Invoked during drag-hover or swap
   * preview when there is a `previewLabel`. Lets a game render a visual
   * preview (e.g. a domino face) instead of the default bold text. Must
   * apply its own opacity/styling. When omitted, the default
   * `<span>{previewLabel}</span>` is used.
   */
  renderPreview?: (previewLabel: string) => ReactNode;
  /**
   * Optional skin whose `slotDecoration` renderer runs inside the slot.
   * When undefined, no decoration is rendered.
   */
  skin?: GameSkin;
}

export const Slot = ({
  index,
  as: Tag = 'li',
  className,
  children,
  renderPreview,
  skin,
}: SlotProps) => {
  const { zones } = useAnswerGameContext();
  const zone = zones[index];
  const {
    renderProps,
    outerRef,
    slotRef,
    dragRef,
    handleClick,
    pointerHandlers,
    isBeingDragged,
  } = useSlotBehavior(index);

  const {
    label,
    isEmpty,
    isWrong,
    showCursor,
    isPreview,
    previewLabel,
  } = renderProps;

  // When the slot is used inline (as="span", e.g. SentenceWithGaps inside <p>),
  // the inner visual element must also be a <span> to avoid invalid
  // block-in-inline HTML nesting. For list/block contexts, <div> is correct.
  const InnerTag = Tag === 'span' ? 'span' : 'div';

  const ariaLabel = isEmpty
    ? `Slot ${index + 1}, empty`
    : `Slot ${index + 1}, filled with ${label}`;

  const stateClasses = [
    'relative flex items-center justify-center border-2 transition-all overflow-hidden',
    isPreview
      ? 'border-dashed border-primary'
      : isEmpty
        ? 'border-border'
        : isWrong
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-primary bg-primary/10 text-primary',
    // Focus ring on active slot (driven by showCursor, works in all modes)
    showCursor && isWrong
      ? 'ring-2 ring-destructive ring-offset-2'
      : showCursor
        ? 'border-primary ring-2 ring-primary ring-offset-2'
        : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // Outer wrapper: the drop target. p-1.5 expands the hit area ~6 px beyond
    // the visual slot on all sides (pragmatic-board card pattern). data-zone-index
    // here ensures touch elementsFromPoint also covers the expanded region.
    <Tag
      ref={
        outerRef as Ref<
          HTMLLIElement & HTMLSpanElement & HTMLDivElement
        >
      }
      aria-label={ariaLabel}
      data-zone-index={index}
      className="relative p-1.5"
    >
      {/* Inner visual slot: carries the state-dependent styling. */}
      <InnerTag
        ref={slotRef as Ref<HTMLDivElement>}
        className={[stateClasses, className].filter(Boolean).join(' ')}
        style={{
          background: 'var(--skin-slot-bg)',
          borderColor: 'var(--skin-slot-border)',
          borderRadius: 'var(--skin-slot-radius)',
          ...(isPreview
            ? { animation: 'pulse-ring 1.5s ease-in-out infinite' }
            : undefined),
        }}
      >
        {skin?.slotDecoration?.(
          {
            isLocked: zone?.isLocked ?? false,
            isWrong: zone?.isWrong ?? false,
            placedTileId: zone?.placedTileId ?? null,
          },
          index,
        )}
        {isEmpty ? (
          <>
            {isPreview && previewLabel !== null ? (
              renderPreview ? (
                renderPreview(previewLabel)
              ) : (
                <span className="text-xl font-bold opacity-50">
                  {previewLabel}
                </span>
              )
            ) : (
              children(renderProps)
            )}
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
              className={`absolute inset-0 flex touch-none select-none cursor-grab items-center justify-center rounded-[inherit] text-card-foreground${isBeingDragged && !isPreview ? ' invisible pointer-events-none' : ''}${isPreview ? ' opacity-50' : ''}`}
              aria-hidden={
                isBeingDragged && !isPreview ? 'true' : undefined
              }
              style={skeuoStyle}
              onClick={handleClick}
              onPointerDown={pointerHandlers.onPointerDown}
              onPointerMove={pointerHandlers.onPointerMove}
              onPointerUp={pointerHandlers.onPointerUp}
              onPointerCancel={pointerHandlers.onPointerCancel}
            >
              {isPreview && previewLabel !== null ? (
                renderPreview ? (
                  renderPreview(previewLabel)
                ) : (
                  <span className="text-xl font-bold">
                    {previewLabel}
                  </span>
                )
              ) : (
                children(renderProps)
              )}
            </button>
            {showCursor ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-sm bg-destructive animate-blink"
              />
            ) : null}
          </>
        )}
      </InnerTag>
    </Tag>
  );
};
