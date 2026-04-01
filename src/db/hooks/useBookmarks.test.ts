import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import { useBookmarks } from './useBookmarks';
import { useRxDB } from './useRxDB';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';

let db: BaseSkillDatabase | undefined;

function useBookmarksUnderTest() {
  const { isReady } = useRxDB();
  const { bookmarkedIds, toggle } = useBookmarks();
  return { isReady, bookmarkedIds, toggle };
}

const makeWrapper = (testDb: BaseSkillDatabase) => {
  const TestProviders = ({ children }: { children: ReactNode }) => {
    const openDatabase = useCallback(
      () => Promise.resolve(testDb),
      [testDb],
    );
    return createElement(
      DbProvider,
      { openDatabase },
      createElement(I18nextProvider, { i18n }, children),
    );
  };
  return TestProviders;
};

afterEach(async () => {
  if (db) await destroyTestDatabase(db);
  db = undefined;
});

describe('useBookmarks', () => {
  it('starts with an empty set of bookmarked ids', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarksUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.bookmarkedIds.size).toBe(0);
  });

  it('adds a bookmark when toggle is called on an unbookmarked game', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarksUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.toggle('math-addition');
    });

    await waitFor(() => {
      expect(result.current.bookmarkedIds.has('math-addition')).toBe(
        true,
      );
    });
  });

  it('removes the bookmark when toggle is called on an already-bookmarked game', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useBookmarksUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.toggle('math-addition');
    });
    await waitFor(() => {
      expect(result.current.bookmarkedIds.has('math-addition')).toBe(
        true,
      );
    });

    await act(async () => {
      await result.current.toggle('math-addition');
    });
    await waitFor(() => {
      expect(result.current.bookmarkedIds.has('math-addition')).toBe(
        false,
      );
    });
  });
});
