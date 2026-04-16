import { useCallback, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type {
  BookmarkDoc,
  BookmarkTargetType,
} from '@/db/schemas/bookmarks';
import { bookmarkId } from '@/db/bookmark-id';
import { ANONYMOUS_PROFILE_ID } from '@/db/last-session-game-config';

export type BookmarkTargetInput = {
  targetType: BookmarkTargetType;
  targetId: string;
};

export type UseBookmarksResult = {
  bookmarks: BookmarkDoc[];
  isBookmarked: (target: BookmarkTargetInput) => boolean;
  toggle: (target: BookmarkTargetInput) => Promise<void>;
  add: (target: BookmarkTargetInput) => Promise<void>;
  remove: (target: BookmarkTargetInput) => Promise<void>;
};

export const useBookmarks = (): UseBookmarksResult => {
  const { db } = useRxDB();

  const bookmarksQuery$ = useMemo(
    () =>
      db
        ? db.bookmarks.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
            sort: [{ createdAt: 'asc' }],
          }).$
        : EMPTY,
    [db],
  );

  const bookmarks = useRxQuery<BookmarkDoc[]>(bookmarksQuery$, []);

  const idSet = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks],
  );

  const isBookmarked = useCallback(
    ({ targetType, targetId }: BookmarkTargetInput): boolean =>
      idSet.has(bookmarkId(ANONYMOUS_PROFILE_ID, targetType, targetId)),
    [idSet],
  );

  const add = useCallback(
    async ({ targetType, targetId }: BookmarkTargetInput) => {
      if (!db) return;
      const id = bookmarkId(ANONYMOUS_PROFILE_ID, targetType, targetId);
      await db.bookmarks.upsert({
        id,
        profileId: ANONYMOUS_PROFILE_ID,
        targetType,
        targetId,
        createdAt: new Date().toISOString(),
      });
    },
    [db],
  );

  const remove = useCallback(
    async ({ targetType, targetId }: BookmarkTargetInput) => {
      if (!db) return;
      const id = bookmarkId(ANONYMOUS_PROFILE_ID, targetType, targetId);
      const doc = await db.bookmarks.findOne(id).exec();
      if (doc) await doc.remove();
    },
    [db],
  );

  const toggle = useCallback(
    async (target: BookmarkTargetInput) => {
      await (isBookmarked(target) ? remove(target) : add(target));
    },
    [isBookmarked, add, remove],
  );

  return { bookmarks, isBookmarked, toggle, add, remove };
};
