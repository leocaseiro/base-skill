import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRxDB } from './useRxDB';
import { useSavedConfigs } from './useSavedConfigs';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { lastSessionSavedConfigId } from '@/db/last-session-game-config';
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

function useSavedConfigsReady() {
  const { isReady } = useRxDB();
  const result = useSavedConfigs();
  return { isReady, ...result };
}

describe('useSavedConfigs', () => {
  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.savedConfigs).toEqual([]);
  });

  it('save() inserts a new saved config', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: { totalRounds: 3 },
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    expect(result.current.savedConfigs[0]!.name).toBe('Easy Mode');
    expect(result.current.savedConfigs[0]!.gameId).toBe('word-spell');
  });

  it('save() throws when name already exists for same gameId', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    await expect(
      act(async () => {
        await result.current.save({
          gameId: 'word-spell',
          name: 'Easy Mode',
          config: {},
        });
      }),
    ).rejects.toThrow('already exists');
  });

  it('save() allows same name for different gameId', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
      });
    });
    await act(async () => {
      await result.current.save({
        gameId: 'number-match',
        name: 'Easy Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(2),
    );
  });

  it('remove() deletes a saved config by id', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    const id = result.current.savedConfigs[0]!.id;
    await act(async () => {
      await result.current.remove(id);
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(0),
    );
  });

  it('rename() changes the name of a saved config', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    const id = result.current.savedConfigs[0]!.id;
    await act(async () => {
      await result.current.rename(id, 'Hard Mode');
    });
    await waitFor(() =>
      expect(result.current.savedConfigs[0]?.name).toBe('Hard Mode'),
    );
  });

  it('rename() throws when new name already exists for same gameId', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Easy Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Hard Mode',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(2),
    );
    const id = result.current.savedConfigs[0]!.id;
    await expect(
      act(async () => {
        await result.current.rename(id, 'Hard Mode');
      }),
    ).rejects.toThrow('already exists');
  });

  it('getByGameId() returns only configs for the given gameId', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'WS Config',
        config: {},
      });
      await result.current.save({
        gameId: 'number-match',
        name: 'NM Config',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(2),
    );
    const wsConfigs = result.current.getByGameId('word-spell');
    expect(wsConfigs).toHaveLength(1);
    expect(wsConfigs[0]?.gameId).toBe('word-spell');
  });

  it('gameIdsWithConfigs is a Set of gameIds that have at least one config', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'WS Config',
        config: {},
      });
    });
    await waitFor(() =>
      expect(result.current.gameIdsWithConfigs.has('word-spell')).toBe(
        true,
      ),
    );
    expect(result.current.gameIdsWithConfigs.has('number-match')).toBe(
      false,
    );
  });

  it('persistLastSessionConfig upserts a hidden doc and omits it from savedConfigs', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.persistLastSessionConfig('word-spell', {
        component: 'WordSpell',
        gameId: 'word-spell',
        mode: 'picture',
      });
    });
    expect(result.current.savedConfigs).toHaveLength(0);
    const raw = await db.saved_game_configs
      .findOne(lastSessionSavedConfigId('word-spell'))
      .exec();
    expect(raw?.config).toMatchObject({ mode: 'picture' });
    await act(async () => {
      await result.current.persistLastSessionConfig('word-spell', {
        component: 'WordSpell',
        gameId: 'word-spell',
        mode: 'scramble',
      });
    });
    const raw2 = await db.saved_game_configs
      .findOne(lastSessionSavedConfigId('word-spell'))
      .exec();
    expect(raw2?.config).toMatchObject({ mode: 'scramble' });
    expect(result.current.savedConfigs).toHaveLength(0);
  });

  it('gameIdsWithConfigs ignores last-session-only games', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.persistLastSessionConfig('sort-numbers', {
        component: 'SortNumbers',
        gameId: 'sort-numbers',
      });
    });
    expect(result.current.gameIdsWithConfigs.has('sort-numbers')).toBe(
      false,
    );
  });

  it('save() stores the provided color on the doc', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'Teal Mode',
        config: {},
        color: 'teal',
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    expect(result.current.savedConfigs[0]!.color).toBe('teal');
  });

  it('updateConfig() patches config and optionally renames', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
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
      expect(result.current.savedConfigs).toHaveLength(1),
    );
    const id = result.current.savedConfigs[0]!.id;
    await act(async () => {
      await result.current.updateConfig(
        id,
        { totalRounds: 8 },
        'Easy Mode v2',
      );
    });
    await waitFor(() =>
      expect(result.current.savedConfigs[0]?.name).toBe('Easy Mode v2'),
    );
    expect(result.current.savedConfigs[0]?.config).toEqual({
      totalRounds: 8,
    });
  });

  it('updateConfig() throws when new name already exists for same gameId', async () => {
    const { result } = renderHook(() => useSavedConfigsReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.save({
        gameId: 'word-spell',
        name: 'A',
        config: {},
        color: 'indigo',
      });
      await result.current.save({
        gameId: 'word-spell',
        name: 'B',
        config: {},
        color: 'teal',
      });
    });
    await waitFor(() =>
      expect(result.current.savedConfigs).toHaveLength(2),
    );
    const idA = result.current.savedConfigs[0]!.id;
    await expect(
      act(async () => {
        await result.current.updateConfig(idA, {}, 'B');
      }),
    ).rejects.toThrow('already exists');
  });
});
