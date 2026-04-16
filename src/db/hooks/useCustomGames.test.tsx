import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCustomGames } from './useCustomGames';
import { useRxDB } from './useRxDB';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { lastSessionConfigId } from '@/db/last-session-game-config';
import { DbProvider } from '@/providers/DbProvider';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

const makeWrapper = (testDb: BaseSkillDatabase) => {
  const TestProviders = ({ children }: { children: ReactNode }) => {
    const openDatabase = useCallback(() => Promise.resolve(testDb), []);
    return (
      <DbProvider openDatabase={openDatabase}>{children}</DbProvider>
    );
  };
  return TestProviders;
};

function useCustomGamesReady() {
  const { isReady } = useRxDB();
  const result = useCustomGames();
  return { isReady, ...result };
}

describe('useCustomGames', () => {
  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.customGames).toEqual([]);
  });

  it('save() inserts a new custom game', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: { totalRounds: 3 },
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    expect(result.current.customGames[0]!.name).toBe('Easy Mode');
    expect(result.current.customGames[0]!.gameId).toBe('word-spell');
  });

  it('save() throws when name already exists for same gameId', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
        color: 'indigo',
      });
    });
    await expect(
      act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
          color: 'indigo',
        });
      }),
    ).rejects.toThrow('already exists');
  });

  it('remove() deletes a custom game by id', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    const id = result.current.customGames[0]!.id;
    await act(async () => {
      await result.current.remove(id);
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(0),
    );
  });

  it('update() patches config and optionally renames', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: { totalRounds: 5 },
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(result.current.customGames).toHaveLength(1),
    );
    const id = result.current.customGames[0]!.id;
    await act(async () => {
      await result.current.update(
        id,
        { totalRounds: 8 },
        'Easy Mode v2',
      );
    });
    await waitFor(() =>
      expect(result.current.customGames[0]?.name).toBe('Easy Mode v2'),
    );
    expect(result.current.customGames[0]?.config).toEqual({
      totalRounds: 8,
    });
  });

  it('gameIdsWithCustomGames is a Set of gameIds that have at least one custom game', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'WS Config',
        config: {},
        color: 'indigo',
      });
    });
    await waitFor(() =>
      expect(
        result.current.gameIdsWithCustomGames.has('word-spell'),
      ).toBe(true),
    );
    expect(
      result.current.gameIdsWithCustomGames.has('number-match'),
    ).toBe(false);
  });

  it('persistLastSessionConfig upserts a hidden doc in saved_game_configs and omits it from customGames', async () => {
    const { result } = renderHook(() => useCustomGamesReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.persistLastSessionConfig('word-spell', {
        mode: 'picture',
      });
    });
    expect(result.current.customGames).toHaveLength(0);
    const raw = await db.saved_game_configs
      .findOne(lastSessionConfigId('word-spell'))
      .exec();
    expect(raw?.config).toMatchObject({ mode: 'picture' });
  });
});
