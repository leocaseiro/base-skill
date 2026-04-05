import { useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';

const DRAG_THRESHOLD_PX = 8;

interface GhostInfo {
  el: HTMLDivElement;
  halfW: number;
  halfH: number;
}

const buildGhost = (
  sourceEl: HTMLElement,
  label: string,
  x: number,
  y: number,
): GhostInfo => {
  const rect = sourceEl.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const el = document.createElement('div');
  el.textContent = label;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    left: `${x - halfW}px`,
    top: `${y - halfH}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: 'var(--card, #fff)',
    color: 'var(--card-foreground, #000)',
    fontSize: getComputedStyle(sourceEl).fontSize,
    fontWeight: 'bold',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.95',
    userSelect: 'none',
    transform: 'scale(1.05)',
  });
  document.body.append(el);
  return { el, halfW, halfH };
};

export interface TouchDragHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

interface UseTouchDragOptions {
  /** Empty string disables the drag (no pointer capture, no ghost). */
  tileId: string;
  label: string;
  onDragStart?: () => void;
  onDrop: (tileId: string, zoneIndex: number) => void;
}

export const useTouchDrag = ({
  tileId,
  label,
  onDragStart,
  onDrop,
}: UseTouchDragOptions): TouchDragHandlers => {
  const ghostRef = useRef<GhostInfo | null>(null);
  const isDragging = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const cleanup = useCallback(() => {
    ghostRef.current?.el.remove();
    ghostRef.current = null;
    isDragging.current = false;
    startPos.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || !tileId) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      startPos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = false;
    },
    [tileId],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || !startPos.current) return;

      if (!isDragging.current) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        if (
          Math.abs(dx) > DRAG_THRESHOLD_PX ||
          Math.abs(dy) > DRAG_THRESHOLD_PX
        ) {
          isDragging.current = true;
          ghostRef.current = buildGhost(
            e.currentTarget,
            label,
            e.clientX,
            e.clientY,
          );
          onDragStart?.();
        }
      }

      if (isDragging.current && ghostRef.current) {
        const { el, halfW, halfH } = ghostRef.current;
        el.style.left = `${e.clientX - halfW}px`;
        el.style.top = `${e.clientY - halfH}px`;
      }
    },
    [label, onDragStart],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || !startPos.current) return;

      if (isDragging.current) {
        // Remove ghost before elementsFromPoint so it doesn't interfere.
        ghostRef.current?.el.remove();
        ghostRef.current = null;

        const elements = document.elementsFromPoint(
          e.clientX,
          e.clientY,
        );
        for (const el of elements) {
          if (
            el instanceof HTMLElement &&
            el.dataset['zoneIndex'] !== undefined
          ) {
            const zoneIndex = Number.parseInt(
              el.dataset['zoneIndex'],
              10,
            );
            if (!Number.isNaN(zoneIndex)) {
              onDrop(tileId, zoneIndex);
              break;
            }
          }
        }
      }

      cleanup();
    },
    [tileId, onDrop, cleanup],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') return;
      cleanup();
    },
    [cleanup],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
};
