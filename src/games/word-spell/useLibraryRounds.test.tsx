import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLibraryRounds } from './useLibraryRounds';
import type { WordSpellConfig } from './types';
import type { SeenWordsStore } from '@/data/words';
import {
  __resetChunkCacheForTests,
  createInMemorySeenWordsStore,
} from '@/data/words';

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

let store: SeenWordsStore;

beforeEach(() => {
  store = createInMemorySeenWordsStore();
});

afterEach(() => __resetChunkCacheForTests());

describe('useLibraryRounds', () => {
  it('returns explicit rounds synchronously when source is absent', () => {
    const rounds = [{ word: 'cat' }, { word: 'dog' }];
    const { result } = renderHook(() =>
      useLibraryRounds({ ...baseConfig, rounds }, undefined, store),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rounds).toBe(rounds);
  });

  it('returns empty rounds when neither rounds nor source is set', () => {
    const { result } = renderHook(() =>
      useLibraryRounds(baseConfig, undefined, store),
    );
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
    const { result } = renderHook(() =>
      useLibraryRounds(config, undefined, store),
    );
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
    const { result } = renderHook(() =>
      useLibraryRounds(config, undefined, store),
    );
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
    const { result } = renderHook(() =>
      useLibraryRounds(config, undefined, store),
    );
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.usedFallback).toEqual({
      from: 'uk',
      to: 'aus',
    });
  });

  it('samples a different set when roundsInOrder is false and seed changes', async () => {
    const libraryConfig: WordSpellConfig = {
      ...baseConfig,
      roundsInOrder: false,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };

    const { result, rerender } = renderHook(
      ({ seed }: { seed: string }) =>
        useLibraryRounds(libraryConfig, seed, store),
      { initialProps: { seed: 'seed-a' } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const firstWords = result.current.rounds.map((r) => r.word);
    expect(new Set(firstWords).size).toBe(3);

    rerender({ seed: 'seed-b' });

    await waitFor(() => {
      const nextWords = result.current.rounds.map((r) => r.word);
      expect(nextWords).not.toEqual(firstWords);
    });
  });

  it('records seen words in the store when roundsInOrder is false', async () => {
    const libraryConfig: WordSpellConfig = {
      ...baseConfig,
      roundsInOrder: false,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };

    const { result } = renderHook(() =>
      useLibraryRounds(libraryConfig, 'seed-x', store),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // The signature here matches the filter from the config.
    const seen = await store.get(
      'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired=|hasVisual=',
    );
    expect(seen.size).toBe(3);
  });

  it('does NOT touch the store when roundsInOrder is true', async () => {
    const libraryConfig: WordSpellConfig = {
      ...baseConfig,
      roundsInOrder: true,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };

    const { result } = renderHook(() =>
      useLibraryRounds(libraryConfig, 'seed-x', store),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const seen = await store.get(
      'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired=|hasVisual=',
    );
    expect(seen.size).toBe(0);
  });

  it('falls back to non-visual rounds when hasVisual filter returns zero hits', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      mode: 'picture',
      totalRounds: 3,
      source: {
        type: 'word-library',
        // Level 8 has no emoji-tagged words → zero visual hits → fallback triggers
        filter: { region: 'aus', level: 8, hasVisual: true },
      },
    };
    const { result } = renderHook(() =>
      useLibraryRounds(config, undefined, store),
    );
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // Fallback retried without hasVisual, so we get level 8 words without emoji
    expect(result.current.rounds.length).toBeGreaterThan(0);
    expect(
      result.current.rounds.some((r) => !r.emoji && !r.image),
    ).toBe(true);
  });

  it('returns visual rounds when hasVisual filter matches enough words', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      mode: 'picture',
      totalRounds: 2,
      source: {
        type: 'word-library',
        filter: { region: 'aus', hasVisual: true },
      },
    };
    const { result } = renderHook(() =>
      useLibraryRounds(config, undefined, store),
    );
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rounds).toHaveLength(2);
    for (const r of result.current.rounds) {
      expect(r.emoji ?? r.image).toBeDefined();
    }
  });

  it('returns the whole pool when it is smaller than limit (silent cap)', async () => {
    const libraryConfig: WordSpellConfig = {
      ...baseConfig,
      roundsInOrder: false,
      totalRounds: 500, // way more than any level has
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };
    const { result } = renderHook(() =>
      useLibraryRounds(libraryConfig, 'seed', store),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // No assertion on the exact count — just that we don't error and
    // we got at least a few words.
    expect(result.current.rounds.length).toBeGreaterThan(0);
  });
});
