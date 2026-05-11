import type { SideEffect } from './definition-types';
import type { BaseGameEvent } from '@/types/game-events';
import { getGameEventBus } from '@/lib/game-event-bus';

export interface ExecuteHandle {
  cancel: () => void;
}

export const executeSideEffects = (
  effects: SideEffect[],
  envelope: Pick<
    BaseGameEvent,
    'gameId' | 'sessionId' | 'profileId' | 'roundIndex'
  >,
  onDelayDone?: () => void,
): ExecuteHandle => {
  const bus = getGameEventBus();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  for (const effect of effects) {
    switch (effect.type) {
      case 'emit': {
        bus.emit(effect.event);
        break;
      }
      case 'speak': {
        bus.emit({
          ...envelope,
          timestamp: Date.now(),
          type: 'lifecycle:speak',
          lifecycleEvent: effect.lifecycleEvent,
        });
        break;
      }
      case 'delay': {
        const t = setTimeout(() => {
          timers.delete(t);
          onDelayDone?.();
        }, effect.ms);
        timers.add(t);
        break;
      }
    }
  }

  return {
    cancel: () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
    },
  };
};
