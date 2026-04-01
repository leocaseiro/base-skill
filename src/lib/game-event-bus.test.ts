import { describe, expect, it } from 'vitest';
import { createGameEventBus } from './game-event-bus';
import type { GameEvaluateEvent, GameEvent } from '@/types/game-events';

function evaluateEvent(): GameEvaluateEvent {
  return {
    type: 'game:evaluate',
    gameId: 'g1',
    sessionId: 's1',
    profileId: 'p1',
    timestamp: 1,
    roundIndex: 0,
    answer: 7,
    correct: true,
    nearMiss: false,
  };
}

describe('TypedGameEventBus', () => {
  it('delivers emit to exact-type subscribers', () => {
    const bus = createGameEventBus();
    const seen: GameEvent[] = [];
    bus.subscribe('game:evaluate', (e) => seen.push(e));
    const event_ = evaluateEvent();
    bus.emit(event_);
    expect(seen).toEqual([event_]);
  });

  it('delivers all events to game:*', () => {
    const bus = createGameEventBus();
    const seen: GameEvent[] = [];
    bus.subscribe('game:*', (e) => seen.push(e));
    const event_ = evaluateEvent();
    bus.emit(event_);
    expect(seen).toEqual([event_]);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createGameEventBus();
    const seen: GameEvent[] = [];
    const off = bus.subscribe('game:evaluate', (e) => seen.push(e));
    off();
    bus.emit(evaluateEvent());
    expect(seen).toEqual([]);
  });
});
