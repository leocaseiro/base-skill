import type {
  GameEvent,
  GameEventBus,
  GameEventType,
} from '@/types/game-events';

type Handler = (event: GameEvent) => void;

export class TypedGameEventBus implements GameEventBus {
  private readonly byType = new Map<GameEventType, Set<Handler>>();
  private readonly wildcards = new Set<Handler>();

  emit(event: GameEvent): void {
    for (const h of this.wildcards) {
      h(event);
    }
    const specific = this.byType.get(event.type);
    if (specific) {
      for (const h of specific) {
        h(event);
      }
    }
  }

  subscribe(
    type: GameEventType | 'game:*',
    handler: Handler,
  ): () => void {
    if (type === 'game:*') {
      this.wildcards.add(handler);
      return () => {
        this.wildcards.delete(handler);
      };
    }
    let bucket = this.byType.get(type);
    if (!bucket) {
      bucket = new Set();
      this.byType.set(type, bucket);
    }
    bucket.add(handler);
    return () => {
      bucket.delete(handler);
      if (bucket.size === 0) {
        this.byType.delete(type);
      }
    };
  }
}

let singleton: GameEventBus | undefined;

export function createGameEventBus(): GameEventBus {
  return new TypedGameEventBus();
}

/** Process-wide singleton for M2 (internal use; public API may ship later). */
export function getGameEventBus(): GameEventBus {
  singleton ??= createGameEventBus();
  return singleton;
}
