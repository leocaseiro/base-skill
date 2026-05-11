import { afterEach, describe, expect, it, vi } from 'vitest';
import { executeSideEffects } from './side-effects';
import { getGameEventBus } from '@/lib/game-event-bus';

const baseEnvelope = {
  gameId: 'number-match',
  sessionId: 'test-session',
  profileId: 'test-profile',
  roundIndex: 0,
};

describe('executeSideEffects', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      fn?.();
    }
  });

  it('emits a lifecycle:speak event for { type: "speak" }', () => {
    const bus = getGameEventBus();
    const received: Array<{ type: string }> = [];
    cleanups.push(
      bus.subscribe('lifecycle:speak', (e) => received.push(e)),
    );

    executeSideEffects(
      [{ type: 'speak', lifecycleEvent: 'round.correct' }],
      { ...baseEnvelope },
    );

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('lifecycle:speak');
  });

  it('emits the inner event for { type: "emit" }', () => {
    const bus = getGameEventBus();
    const received: Array<{ type: string }> = [];
    cleanups.push(
      bus.subscribe('celebration:start', (e) => received.push(e)),
    );

    executeSideEffects(
      [
        {
          type: 'emit',
          event: {
            ...baseEnvelope,
            type: 'celebration:start',
            timestamp: 0,
            miniGame: 'DinoEggHatch',
            phaseId: 'roundComplete',
            levelIndex: 0,
          },
        },
      ],
      { ...baseEnvelope },
    );

    expect(received).toHaveLength(1);
  });

  it('schedules and clears a delay via setTimeout', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const handle = executeSideEffects(
      [{ type: 'delay', ms: 1000 }],
      { ...baseEnvelope },
      cb,
    );

    vi.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(cb).toHaveBeenCalledTimes(1);

    handle.cancel();
    vi.useRealTimers();
  });

  it('returns a handle that cancels pending delays', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const handle = executeSideEffects(
      [{ type: 'delay', ms: 500 }],
      { ...baseEnvelope },
      cb,
    );

    handle.cancel();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
