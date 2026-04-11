import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLibraryRounds } from './useLibraryRounds';
import type { WordSpellConfig } from './types';
import { __resetChunkCacheForTests } from '@/data/words';

const baseConfig: WordSpellConfig = {
  gameId: 'test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: true,
  ttsEnabled: false,
  mode: 'picture',
  tileUnit: 'letter',
};

afterEach(() => __resetChunkCacheForTests());

describe('useLibraryRounds', () => {
  it('returns explicit rounds synchronously when source is absent', () => {
    const rounds = [{ word: 'cat' }, { word: 'dog' }];
    const { result } = renderHook(() =>
      useLibraryRounds({ ...baseConfig, rounds }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rounds).toBe(rounds);
  });

  it('returns empty rounds when neither rounds nor source is set', () => {
    const { result } = renderHook(() => useLibraryRounds(baseConfig));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rounds).toEqual([]);
  });

  it('resolves library rounds from a filter when source is set', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rounds).toHaveLength(3);
    for (const r of result.current.rounds) {
      expect(r.word).toBeDefined();
    }
  });

  it('respects explicit source.limit over totalRounds', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 10,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
        limit: 2,
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rounds).toHaveLength(2);
  });

  it('surfaces usedFallback when the filter falls back to AUS', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'uk', level: 1 },
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.usedFallback).toEqual({
      from: 'uk',
      to: 'aus',
    });
  });
});
