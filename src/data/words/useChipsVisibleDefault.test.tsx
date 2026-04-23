import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useChipsVisibleDefault } from './useChipsVisibleDefault';

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

describe('useChipsVisibleDefault', () => {
  it('returns true when not landscape-short', () => {
    const { result } = renderHook(() => useChipsVisibleDefault());
    expect(result.current).toBe(true);
  });

  it('returns false when matchMedia matches landscape-short', () => {
    mql = makeMQL(true);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    );
    const { result } = renderHook(() => useChipsVisibleDefault());
    expect(result.current).toBe(false);
  });

  it('updates on orientation change', () => {
    const { result } = renderHook(() => useChipsVisibleDefault());
    expect(result.current).toBe(true);
    act(() => {
      mql.matches = true;
      for (const cb of mql._listeners) cb({ matches: true });
    });
    expect(result.current).toBe(false);
  });
});
