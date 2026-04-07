import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Registers a container element as a drop target for the tile bank.
 *
 * This makes the bank an accepted HTML5 drop zone so the browser shows
 * a "move" cursor (instead of the "no drop" reject animation) when a slot
 * tile is dragged over it. The actual REMOVE_TILE dispatch is handled by
 * useSlotTileDrag's onDrop — the bank target intentionally carries no
 * zoneIndex so that path treats it as "return to bank".
 */
export const useBankDropTarget = (): {
  bankRef: RefObject<HTMLDivElement | null>;
} => {
  const bankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bankRef.current;
    if (!el) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ isBankTarget: true }),
    });
  }, []);

  return { bankRef };
};
