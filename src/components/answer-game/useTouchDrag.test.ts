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

  it('does not call onTapFallback when it is undefined (slot tile case)', () => {
    const onDrop = vi.fn();
    const onDragCancel = vi.fn();

    const { result } = renderHook(() =>
      useTouchDrag({
        tileId: 'tile-1',
        label: 'A',
        onDrop,
        onDragCancel,
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
