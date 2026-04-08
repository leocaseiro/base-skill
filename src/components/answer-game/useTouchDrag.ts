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
  /** Called when the tile is dropped on the bank container (empty hole). */
  onDropOnBank?: () => void;
  /** Called when the tile is dropped on a specific bank tile hole. */
  onDropOnBankTile?: (bankTileId: string) => void;
  onHoverZone?: (zoneIndex: number | null) => void;
  /** Called when the ghost enters or leaves a bank tile hole during drag. */
  onHoverBankTile?: (bankTileId: string | null) => void;
}

export const useTouchDrag = ({
  tileId,
  label,
  onDragStart,
  onDragCancel,
  onDrop,
  onDropOnBank,
  onDropOnBankTile,
  onHoverZone,
  onHoverBankTile,
}: UseTouchDragOptions): TouchDragHandlers => {
  const onDragCancelRef = useRef(onDragCancel);
  useEffect(() => {
    onDragCancelRef.current = onDragCancel;
  }, [onDragCancel]);

  const onHoverZoneRef = useRef(onHoverZone);
  useEffect(() => {
    onHoverZoneRef.current = onHoverZone;
  }, [onHoverZone]);

  const onHoverBankTileRef = useRef(onHoverBankTile);
  useEffect(() => {
    onHoverBankTileRef.current = onHoverBankTile;
  }, [onHoverBankTile]);

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
  const lastHoverZoneRef = useRef<number | null>(null);
  const lastHoverBankTileRef = useRef<string | null>(null);

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
    lastHoverZoneRef.current = null;
    lastHoverBankTileRef.current = null;
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

        // Sample 5 points (pointer center + 4 ghost corners) so the drop zone
        // activates as soon as the ghost tile visually overlaps a slot.
        // Hide the ghost once before sampling so it doesn't block elementsFromPoint.
        el.style.visibility = 'hidden';
        const samplePoints: [number, number][] = [
          [e.clientX, e.clientY],
          [e.clientX - halfW, e.clientY - halfH],
          [e.clientX + halfW, e.clientY - halfH],
          [e.clientX - halfW, e.clientY + halfH],
          [e.clientX + halfW, e.clientY + halfH],
        ];
        let detectedZone: number | null = null;
        outer: for (const [px, py] of samplePoints) {
          for (const elem of document.elementsFromPoint(px, py)) {
            if (
              elem instanceof HTMLElement &&
              elem.dataset['zoneIndex'] !== undefined
            ) {
              const parsed = Number.parseInt(
                elem.dataset['zoneIndex'],
                10,
              );
              if (!Number.isNaN(parsed)) {
                detectedZone = parsed;
                break outer;
              }
            }
          }
        }
        el.style.visibility = 'visible';
        if (detectedZone !== lastHoverZoneRef.current) {
          lastHoverZoneRef.current = detectedZone;
          onHoverZoneRef.current?.(detectedZone);
        }

        // Bank tile hover: detect which bank hole the ghost is over.
        if (onHoverBankTileRef.current) {
          let detectedBankTileId: string | null = null;
          if (detectedZone === null) {
            for (const [px, py] of samplePoints) {
              for (const elem of document.elementsFromPoint(px, py)) {
                if (
                  elem instanceof HTMLElement &&
                  elem.dataset['tileBankHole'] !== undefined
                ) {
                  detectedBankTileId =
                    elem.dataset['tileBankHole'] ?? null;
                  break;
                }
              }
              if (detectedBankTileId !== null) break;
            }
          }
          if (detectedBankTileId !== lastHoverBankTileRef.current) {
            lastHoverBankTileRef.current = detectedBankTileId;
            onHoverBankTileRef.current(detectedBankTileId);
          }
        }
      }
    },
    [label, onDragStart, cleanupGhost],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || !startPos.current) return;

      if (isDragging.current) {
        // Capture ghost dimensions before removing.
        const ghostHalfW = ghostRef.current?.halfW ?? 0;
        const ghostHalfH = ghostRef.current?.halfH ?? 0;

        // Remove ghost before elementsFromPoint so it doesn't interfere.
        ghostRef.current?.el.remove();
        ghostRef.current = null;

        // Priority order (honours explicit pointer intent before ghost expansion):
        //   1. Center → zone   (precise slot aim)
        //   2. Center → bank   (explicit bank aim beats corner zone hits)
        //   3. Corners → zone  (expanded zone — ghost visually overlaps slot)
        //   4. Corners → bank  (expanded bank)
        //   5. Cancel
        const centerX = e.clientX;
        const centerY = e.clientY;
        const cornerPoints: [number, number][] = [
          [centerX - ghostHalfW, centerY - ghostHalfH],
          [centerX + ghostHalfW, centerY - ghostHalfH],
          [centerX - ghostHalfW, centerY + ghostHalfH],
          [centerX + ghostHalfW, centerY + ghostHalfH],
        ];

        const findZoneAt = (px: number, py: number): number | null => {
          for (const el of document.elementsFromPoint(px, py)) {
            if (
              el instanceof HTMLElement &&
              el.dataset['zoneIndex'] !== undefined
            ) {
              const parsed = Number.parseInt(
                el.dataset['zoneIndex'],
                10,
              );
              if (!Number.isNaN(parsed)) return parsed;
            }
          }
          return null;
        };
        const findBankTileAt = (
          px: number,
          py: number,
        ): string | null => {
          for (const el of document.elementsFromPoint(px, py)) {
            if (
              el instanceof HTMLElement &&
              el.dataset['tileBankHole'] !== undefined
            ) {
              return el.dataset['tileBankHole'] ?? null;
            }
          }
          return null;
        };
        const isBankAt = (px: number, py: number): boolean =>
          document
            .elementsFromPoint(px, py)
            .some(
              (el) =>
                el instanceof HTMLElement &&
                el.dataset['tileBank'] !== undefined,
            );

        // Priority order:
        //   1. Center → zone   (precise slot aim)
        //   2. Center → bank tile (specific hole — swap or return)
        //   3. Center → bank   (empty bank area — return to bank)
        //   4. Corners → zone  (expanded zone)
        //   5. Corners → bank tile
        //   6. Corners → bank
        //   7. Cancel

        // 1. Center → zone
        const centerZone = findZoneAt(centerX, centerY);
        if (centerZone !== null) {
          onDrop(tileId, centerZone);
          cleanup();
          return;
        }
        // 2. Center → bank tile
        if (onDropOnBankTile) {
          const centerBankTile = findBankTileAt(centerX, centerY);
          if (centerBankTile !== null) {
            onDropOnBankTile(centerBankTile);
            cleanup();
            return;
          }
        }
        // 3. Center → bank
        if (isBankAt(centerX, centerY)) {
          onDropOnBank?.();
          cleanup();
          return;
        }
        // 4. Corners → zone
        let droppedZoneIndex: number | null = null;
        for (const [px, py] of cornerPoints) {
          const z = findZoneAt(px, py);
          if (z !== null) {
            droppedZoneIndex = z;
            break;
          }
        }
        if (droppedZoneIndex === null) {
          // 5. Corners → bank tile
          let cornerBankTile: string | null = null;
          if (onDropOnBankTile) {
            for (const [px, py] of cornerPoints) {
              const bt = findBankTileAt(px, py);
              if (bt !== null) {
                cornerBankTile = bt;
                break;
              }
            }
          }
          if (cornerBankTile !== null && onDropOnBankTile) {
            onDropOnBankTile(cornerBankTile);
          } else {
            // 6. Corners → bank
            let hitBank = false;
            for (const [px, py] of cornerPoints) {
              if (isBankAt(px, py)) {
                hitBank = true;
                break;
              }
            }
            if (hitBank) {
              onDropOnBank?.();
            } else {
              // 7. Cancel
              onDragCancelRef.current?.();
            }
          }
        } else {
          onDrop(tileId, droppedZoneIndex);
        }
      }

      cleanup();
    },
    [tileId, onDrop, onDropOnBank, onDropOnBankTile, cleanup],
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
