import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { BookmarkDoc } from '@/db/schemas/bookmarks';

const ANONYMOUS_PROFILE_ID = 'anonymous';

type UseBookmarksResult = {
  bookmarkedIds: Set<string>;
  toggle: (gameId: string) => Promise<void>;
};

export function useBookmarks(): UseBookmarksResult {
  const { db } = useRxDB();

  const query$ = useMemo(
    () =>
      db
        ? db.bookmarks.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
          }).$
        : EMPTY,
    [db],
  );

  const docs = useRxQuery<BookmarkDoc[]>(query$, []);

  const bookmarkedIds = useMemo(
    () => new Set(docs.map((d) => d.gameId)),
    [docs],
  );

  const toggle = async (gameId: string): Promise<void> => {
    if (!db) return;
    const existing = await db.bookmarks
      .findOne({
        selector: { profileId: ANONYMOUS_PROFILE_ID, gameId },
      })
      .exec();
    if (existing) {
      await existing.remove();
    } else {
      const doc: BookmarkDoc = {
        id: nanoid(21),
        profileId: ANONYMOUS_PROFILE_ID,
        gameId,
        createdAt: new Date().toISOString(),
      };
      await db.bookmarks.insert(doc);
    }
  };

  return { bookmarkedIds, toggle };
}
