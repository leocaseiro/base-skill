import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Registers a container element as a drop target for the tile bank.
 *
 * This makes the bank an accepted HTML5 drop zone so the browser shows
 * a "move" cursor (instead of the "no drop" reject animation) when a slot
 * tile is dragged over it. The actual REMOVE_TILE dispatch is handled by
 * useSlotTileDrag's onDrop — the bank target intentionally carries no
 * zoneIndex so that path treats it as "return to bank".
 *
 * isDragOver is true while any drag is over the bank container. Bank
 * components use this to show a dashed-border preview on the dragged
 * tile's own hole when that tile came from a slot (its hole is not a
 * registered drop target, so onDragEnter on the individual hole never fires).
 */
export const useBankDropTarget = (): {
  bankRef: RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
} => {
  const bankRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const el = bankRef.current;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ isBankTarget: true }),
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: () => setIsDragOver(false),
    });
  }, []);

  return { bankRef, isDragOver };
};
