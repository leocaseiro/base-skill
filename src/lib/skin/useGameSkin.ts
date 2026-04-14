import { useEffect, useMemo } from 'react';
import { resolveSkin } from './registry';
import type { GameSkin } from './game-skin';
import { getGameEventBus } from '@/lib/game-event-bus';

/**
 * Resolve the skin for a game and wire its optional callbacks to the
 * process-wide game event bus. Returns the resolved skin so callers can
 * apply tokens and render slots.
 */
export function useGameSkin(gameId: string, skinId?: string): GameSkin {
  const skin = useMemo(
    () => resolveSkin(gameId, skinId),
    [gameId, skinId],
  );

  useEffect(() => {
    const bus = getGameEventBus();

    const unsubscribers = [
      bus.subscribe('game:evaluate', (event) => {
        if (event.type !== 'game:evaluate') return;
        if (event.gameId !== gameId) return;
        if (event.correct) {
          skin.onCorrectPlace?.(event.zoneIndex, String(event.answer));
        } else {
          skin.onWrongPlace?.(event.zoneIndex, String(event.answer));
        }
      }),
      bus.subscribe('game:tile-ejected', (event) => {
        if (event.type !== 'game:tile-ejected') return;
        if (event.gameId !== gameId) return;
        skin.onTileEjected?.(event.zoneIndex);
      }),
      bus.subscribe('game:drag-start', (event) => {
        if (event.type !== 'game:drag-start') return;
        if (event.gameId !== gameId) return;
        skin.onDragStart?.(event.tileId);
      }),
      bus.subscribe('game:drag-over-zone', (event) => {
        if (event.type !== 'game:drag-over-zone') return;
        if (event.gameId !== gameId) return;
        skin.onDragOverZone?.(event.zoneIndex);
      }),
      bus.subscribe('game:round-advance', (event) => {
        if (event.type !== 'game:round-advance') return;
        if (event.gameId !== gameId) return;
        skin.onRoundComplete?.(event.roundIndex);
      }),
      bus.subscribe('game:level-advance', (event) => {
        if (event.type !== 'game:level-advance') return;
        if (event.gameId !== gameId) return;
        skin.onLevelComplete?.(event.levelIndex);
      }),
      bus.subscribe('game:end', (event) => {
        if (event.type !== 'game:end') return;
        if (event.gameId !== gameId) return;
        skin.onGameOver?.(event.retryCount);
      }),
    ];

    return () => {
      for (const fn of unsubscribers) fn();
    };
  }, [skin, gameId]);

  return skin;
}
