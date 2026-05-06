import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useTouchDrag } from './useTouchDrag';
import type { PointerEvent } from 'react';

let target: HTMLButtonElement;

beforeEach(() => {
  document.elementsFromPoint = vi.fn().mockReturnValue([]);
  target = document.createElement('button');
  target.textContent = 'A';
  target.style.width = '60px';
  target.style.height = '60px';
  document.body.append(target);
  target.setPointerCapture = vi.fn();
  target.releasePointerCapture = vi.fn();
  target.getBoundingClientRect = () => ({
    width: 60,
    height: 60,
    top: 0,
    left: 0,
    right: 60,
    bottom: 60,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const ev = (
  overrides: Partial<PointerEvent<HTMLElement>> = {},
): PointerEvent<HTMLElement> =>
  ({
    pointerType: 'touch',
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    currentTarget: target,
    ...overrides,
  }) as unknown as PointerEvent<HTMLElement>;

describe('useTouchDrag — tap forgiveness', () => {
  it('calls onTapFallback when drag displacement is below threshold and no zone detected', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerUp(ev({ clientX: 112, clientY: 100 }));
    });

    expect(onTapFallback).toHaveBeenCalledOnce();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does NOT call onTapFallback when drag displacement exceeds threshold', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 125, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerUp(ev({ clientX: 130, clientY: 100 }));
    });

    expect(onTapFallback).not.toHaveBeenCalled();
  });

  it('drops on zone even when below tap forgiveness threshold', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const zoneEl = document.createElement('div');
    zoneEl.dataset['zoneIndex'] = '0';
    (
      document.elementsFromPoint as ReturnType<typeof vi.fn>
    ).mockReturnValue([zoneEl]);

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerUp(ev({ clientX: 112, clientY: 100 }));
    });

    expect(onDrop).toHaveBeenCalledWith('tile-1', 0);
    expect(onTapFallback).not.toHaveBeenCalled();
  });

  it('cancels drag normally when tap forgiveness is not configured (slot tile case)', () => {
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerUp(ev({ clientX: 112, clientY: 100 }));
    });

    expect(onDragCancel).toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('handles threshold boundary correctly (exactly at threshold does NOT fire)', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 109, clientY: 100 }));
    });
    // Exactly 20px from start
    act(() => {
      result.current.onPointerUp(ev({ clientX: 120, clientY: 100 }));
    });

    expect(onTapFallback).not.toHaveBeenCalled();
  });
});

describe('useTouchDrag — tap forgiveness on pointercancel', () => {
  it('calls onTapFallback when pointercancel fires with small displacement', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerCancel(
        ev({ clientX: 112, clientY: 100 }),
      );
    });

    expect(onTapFallback).toHaveBeenCalledOnce();
    expect(onDragCancel).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('calls onDragCancel when pointercancel displacement exceeds threshold', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 130, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerCancel(
        ev({ clientX: 135, clientY: 100 }),
      );
    });

    expect(onTapFallback).not.toHaveBeenCalled();
    expect(onDragCancel).toHaveBeenCalled();
  });

  it('calls onDragCancel (not onTapFallback) when tap forgiveness is not configured', () => {
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
      }),
    );

    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    act(() => {
      result.current.onPointerCancel(
        ev({ clientX: 112, clientY: 100 }),
      );
    });

    expect(onDragCancel).toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });
});

describe('useTouchDrag — tap forgiveness time threshold', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTapFallback when duration is short even if distance exceeds threshold (thumb-drift case)', () => {
    // Reproduces android-quick-drag.log: 50ms, 96px displacement.
    // Distance fails (96 > 20) but duration passes (50 < 150).
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
        tapForgivenessTimeMs: 150,
      }),
    );

    vi.setSystemTime(new Date(0));
    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    vi.advanceTimersByTime(15);
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    vi.advanceTimersByTime(35); // total ~50ms, like the captured failing tap
    act(() => {
      result.current.onPointerUp(ev({ clientX: 192, clientY: 196 })); // 96px from start
    });

    expect(onTapFallback).toHaveBeenCalledOnce();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does NOT call onTapFallback when duration AND distance both exceed thresholds', () => {
    // Reproduces android-quick-but-not-short: 288ms, 448px. Both checks fail.
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
        onTapFallback,
        tapForgivenessThreshold: 20,
        tapForgivenessTimeMs: 150,
      }),
    );

    vi.setSystemTime(new Date(0));
    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    vi.advanceTimersByTime(20);
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    vi.advanceTimersByTime(270); // total ~290ms — past 150ms time threshold
    act(() => {
      result.current.onPointerUp(ev({ clientX: 410, clientY: 400 })); // ~424px from start
    });

    expect(onTapFallback).not.toHaveBeenCalled();
    expect(onDragCancel).toHaveBeenCalled();
  });

  it('falls back to distance-only check when tapForgivenessTimeMs is undefined', () => {
    // Backwards compatibility: existing behaviour (distance < 20) still works
    // when caller does not opt into the time threshold.
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
      }),
    );

    vi.setSystemTime(new Date(0));
    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    vi.advanceTimersByTime(20);
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    vi.advanceTimersByTime(30); // 50ms total — short, but no time threshold opted in
    act(() => {
      result.current.onPointerUp(ev({ clientX: 200, clientY: 100 })); // 100px — fails distance
    });

    // No time threshold → only distance check → 100 > 20 → no tap fallback
    expect(onTapFallback).not.toHaveBeenCalled();
  });

  it('time threshold also applies to onPointerCancel path', () => {
    const onTapFallback = vi.fn();
    const onDrop = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onTapFallback,
        tapForgivenessThreshold: 20,
        tapForgivenessTimeMs: 150,
      }),
    );

    vi.setSystemTime(new Date(0));
    act(() => {
      result.current.onPointerDown(ev({ clientX: 100, clientY: 100 }));
    });
    vi.advanceTimersByTime(15);
    act(() => {
      result.current.onPointerMove(ev({ clientX: 110, clientY: 100 }));
    });
    vi.advanceTimersByTime(40);
    act(() => {
      result.current.onPointerCancel(
        ev({ clientX: 192, clientY: 196 }), // 96px — fails distance, but 55ms total
      );
    });

    expect(onTapFallback).toHaveBeenCalledOnce();
  });
});
