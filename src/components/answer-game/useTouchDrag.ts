import { useCallback, useEffect, useRef } from 'react';
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
    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.95',
    userSelect: 'none',
    transform: 'scale(1.08)',
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
  /** Called when the drag is cancelled or the pointer is released with no valid drop zone. */
  onDragCancel?: () => void;
  onDrop: (tileId: string, zoneIndex: number) => void;
}

export const useTouchDrag = ({
  tileId,
  label,
  onDragStart,
  onDragCancel,
  onDrop,
}: UseTouchDragOptions): TouchDragHandlers => {
  const onDragCancelRef = useRef(onDragCancel);
  useEffect(() => {
    onDragCancelRef.current = onDragCancel;
  }, [onDragCancel]);

  const ghostRef = useRef<GhostInfo | null>(null);
  const isDragging = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const capturedElRef = useRef<HTMLElement | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);

  // Guards against cleanupGhost → releasePointerCapture → lostpointercapture
  // → cleanupGhost re-entry.
  const cleanupInProgressRef = useRef(false);

  const cleanupGhost = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    if (safetyTimerRef.current !== null) {
      globalThis.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    ghostRef.current?.el.remove();
    ghostRef.current = null;

    // Clear refs BEFORE releasePointerCapture so that any synchronous
    // lostpointercapture event triggered by it sees null refs and bails out.
    const el = capturedElRef.current;
    const pointerId = capturedPointerIdRef.current;
    capturedElRef.current = null;
    capturedPointerIdRef.current = null;

    if (el !== null && pointerId !== null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        // Element may no longer be in the DOM — ignore.
      }
    }

    isDragging.current = false;
    startPos.current = null;
    cleanupInProgressRef.current = false;
  }, []);

  const cleanup = useCallback(() => {
    cleanupGhost();
  }, [cleanupGhost]);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || !tileId) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      capturedElRef.current = e.currentTarget;
      capturedPointerIdRef.current = e.pointerId;
      startPos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = false;

      // When the captured element is removed from the DOM (e.g. a slot tile
      // gets auto-ejected while the user is dragging it), the browser fires
      // lostpointercapture and onPointerUp never fires.  Clean up here so the
      // ghost doesn't float for 5 seconds.
      e.currentTarget.addEventListener(
        'lostpointercapture',
        () => {
          if (!cleanupInProgressRef.current && isDragging.current) {
            cleanupGhost();
            onDragCancelRef.current?.();
          }
        },
        { once: true },
      );
    },
    [tileId, cleanupGhost],
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

          safetyTimerRef.current = globalThis.setTimeout(() => {
            cleanupGhost();
            onDragCancelRef.current?.();
          }, 5000);

          document.addEventListener('contextmenu', cleanupGhost, {
            once: true,
          });
          document.addEventListener('visibilitychange', cleanupGhost, {
            once: true,
          });
        }
      }

      if (isDragging.current && ghostRef.current) {
        const { el, halfW, halfH } = ghostRef.current;
        el.style.left = `${e.clientX - halfW}px`;
        el.style.top = `${e.clientY - halfH}px`;
      }
    },
    [label, onDragStart, cleanupGhost],
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
        let dropped = false;
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
              dropped = true;
              break;
            }
          }
        }
        if (!dropped) {
          onDragCancelRef.current?.();
        }
      }

      cleanup();
    },
    [tileId, onDrop, cleanup],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') return;
      if (isDragging.current) {
        onDragCancelRef.current?.();
      }
      cleanupGhost();
    },
    [cleanupGhost],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
};
