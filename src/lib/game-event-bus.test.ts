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
    zoneIndex: 0,
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

describe('celebration events', () => {
  it('emits and receives celebration:start', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:start', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:start',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('celebration:start');
  });

  it('emits and receives celebration:complete with durationMs', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:complete', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:complete',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
      durationMs: 12_000,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(
      (received[0] as GameEvent & { durationMs: number }).durationMs,
    ).toBe(12_000);
  });

  it('emits and receives celebration:skip with skipMethod', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:skip', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:skip',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
      durationMs: 1500,
      skipMethod: 'play-again',
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(
      (received[0] as GameEvent & { skipMethod: string }).skipMethod,
    ).toBe('play-again');
  });
});

describe('lifecycle:speak event', () => {
  it('emits and receives lifecycle:speak with lifecycleEvent', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('lifecycle:speak', (e) => received.push(e));

    const event: GameEvent = {
      type: 'lifecycle:speak',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      lifecycleEvent: 'round.start',
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('lifecycle:speak');
  });
});
