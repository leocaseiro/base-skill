import { renderHook, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { usePhonemeSprite } from './usePhonemeSprite';
import type { PhonemeSprite } from '#/data/words/phoneme-audio';
import { __resetPhonemeAudioForTests } from '#/data/words/phoneme-audio';

const SPRITE: PhonemeSprite = {
  t: { start: 0, duration: 400 },
  n: { start: 400, duration: 600, loopable: true },
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(SPRITE),
      } as Response),
    ),
  );
  __resetPhonemeAudioForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePhonemeSprite', () => {
  it('returns null while loading and the manifest once resolved', async () => {
    const { result } = renderHook(() => usePhonemeSprite());
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.n?.loopable).toBe(true);
  });

  it('re-uses the cached manifest across two hook instances', async () => {
    const fetchSpy = vi.mocked(globalThis.fetch);
    const first = renderHook(() => usePhonemeSprite());
    await waitFor(() => expect(first.result.current).not.toBeNull());
    const second = renderHook(() => usePhonemeSprite());
    await waitFor(() => expect(second.result.current).not.toBeNull());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
