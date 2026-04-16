import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBookmarks } from './useBookmarks';
import { useRxDB } from './useRxDB';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
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

const useBookmarksReady = () => {
  const { isReady } = useRxDB();
  const result = useBookmarks();
  return { isReady, ...result };
};

describe('useBookmarks', () => {
  it('returns an empty list initially', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.bookmarks).toEqual([]);
    expect(
      result.current.isBookmarked({
        targetType: 'game',
        targetId: 'word-spell',
      }),
    ).toBe(false);
  });

  it('add() inserts a bookmark and isBookmarked reflects it', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.add({
        targetType: 'game',
        targetId: 'word-spell',
      });
    });
    await waitFor(() =>
      expect(result.current.bookmarks).toHaveLength(1),
    );
    expect(
      result.current.isBookmarked({
        targetType: 'game',
        targetId: 'word-spell',
      }),
    ).toBe(true);
    expect(
      result.current.isBookmarked({
        targetType: 'game',
        targetId: 'number-match',
      }),
    ).toBe(false);
  });

  it('add() is idempotent — calling twice leaves a single row', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.add({
        targetType: 'game',
        targetId: 'word-spell',
      });
      await result.current.add({
        targetType: 'game',
        targetId: 'word-spell',
      });
    });
    await waitFor(() =>
      expect(result.current.bookmarks).toHaveLength(1),
    );
  });

  it('remove() deletes the bookmark', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.add({
        targetType: 'game',
        targetId: 'word-spell',
      });
    });
    await waitFor(() =>
      expect(result.current.bookmarks).toHaveLength(1),
    );
    await act(async () => {
      await result.current.remove({
        targetType: 'game',
        targetId: 'word-spell',
      });
    });
    await waitFor(() =>
      expect(result.current.bookmarks).toHaveLength(0),
    );
    expect(
      result.current.isBookmarked({
        targetType: 'game',
        targetId: 'word-spell',
      }),
    ).toBe(false);
  });

  it('remove() on a non-existent bookmark is a no-op', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.remove({
        targetType: 'game',
        targetId: 'never-bookmarked',
      });
    });
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it('toggle() adds when missing and removes when present', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    const target = {
      targetType: 'customGame' as const,
      targetId: 'cg_xyz',
    };
    await act(async () => {
      await result.current.toggle(target);
    });
    await waitFor(() =>
      expect(result.current.isBookmarked(target)).toBe(true),
    );
    await act(async () => {
      await result.current.toggle(target);
    });
    await waitFor(() =>
      expect(result.current.isBookmarked(target)).toBe(false),
    );
  });

  it('isBookmarked distinguishes game vs customGame for the same id', async () => {
    const { result } = renderHook(() => useBookmarksReady(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.add({
        targetType: 'game',
        targetId: 'shared-id',
      });
    });
    await waitFor(() =>
      expect(result.current.bookmarks).toHaveLength(1),
    );
    expect(
      result.current.isBookmarked({
        targetType: 'game',
        targetId: 'shared-id',
      }),
    ).toBe(true);
    expect(
      result.current.isBookmarked({
        targetType: 'customGame',
        targetId: 'shared-id',
      }),
    ).toBe(false);
  });
});
