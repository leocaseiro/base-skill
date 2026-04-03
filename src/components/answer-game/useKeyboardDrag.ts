import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface KeyboardDrag {
  pickedUpTileId: string | null;
  keyboardDragRef: RefObject<HTMLDivElement | null>;
}

export function useKeyboardDrag(): KeyboardDrag {
  const [pickedUpTileId, setPickedUpTileId] = useState<string | null>(
    null,
  );
  const pickedUpRef = useRef<string | null>(null);
  const keyboardDragRef = useRef<HTMLDivElement | null>(null);

  const syncPickedUp = useCallback((id: string | null) => {
    pickedUpRef.current = id;
    setPickedUpTileId(id);
  }, []);

  useEffect(() => {
    const node = keyboardDragRef.current;
    if (!node) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        const tileId = target.dataset['tileId'];
        if (tileId && !pickedUpRef.current) {
          syncPickedUp(tileId);
          return;
        }
        if (pickedUpRef.current) {
          syncPickedUp(null);
        }
      } else if (event.key === 'Escape' && pickedUpRef.current) {
        syncPickedUp(null);
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [syncPickedUp]);

  return {
    pickedUpTileId,
    keyboardDragRef,
  };
}
