import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useFilteredWords } from './useFilteredWords';
import { __resetChunkCacheForTests, GRAPHEMES_BY_LEVEL } from '@/data/words';

afterEach(() => {
  __resetChunkCacheForTests();
});

const L1_PAIRS = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

describe('useFilteredWords', () => {
  it('returns isLoading=true on first render and resolves to hits', async () => {
    const { result } = renderHook(() =>
      useFilteredWords({
        region: 'aus',
        graphemesAllowed: L1_PAIRS,
        phonemesRequired: ['s'],
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hits.length).toBeGreaterThan(0);
  });

  it('reruns when filter signature changes', async () => {
    const { result, rerender } = renderHook(
      ({ phonemesRequired }: { phonemesRequired: string[] }) =>
        useFilteredWords({
          region: 'aus',
          graphemesAllowed: L1_PAIRS,
          phonemesRequired,
        }),
      { initialProps: { phonemesRequired: ['s'] } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const firstCount = result.current.hits.length;
    expect(firstCount).toBeGreaterThan(0);

    rerender({ phonemesRequired: ['t'] });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hits.length).toBeGreaterThan(0);
    expect(result.current.hits.some((h) => h.word.includes('t'))).toBe(
      true,
    );
  });

  it('returns empty hits when filter excludes everything', async () => {
    const { result } = renderHook(() =>
      useFilteredWords({
        region: 'aus',
        graphemesAllowed: [{ g: 's', p: 's' }],
        phonemesRequired: ['xx_nonexistent'],
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hits).toEqual([]);
  });
});
