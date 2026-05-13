import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface MediaQueryListStub {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listeners: Set<(e: { matches: boolean }) => void>;
}

const makeMQL = (matches: boolean): MediaQueryListStub => {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  return {
    matches,
    _listeners: listeners,
    addEventListener: vi.fn((_: string, cb: () => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: () => void) => {
      listeners.delete(cb);
    }),
  };
};

let mql: MediaQueryListStub;

beforeEach(() => {
  mql = makeMQL(false);
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePrefersReducedMotion', () => {
  it('returns false when the user has not requested reduced motion', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the user prefers reduced motion', () => {
    mql = makeMQL(true);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    );
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      for (const cb of mql._listeners) cb({ matches: true });
    });

    expect(result.current).toBe(true);
  });
});
