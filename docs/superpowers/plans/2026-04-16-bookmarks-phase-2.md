# Bookmarks (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-item bookmark (favourite) toggle that works on both default catalog games and user-created custom games, surfaced as a `Star` button on `GameCard` (cover corner) and `InstructionsOverlay` (next to the title-row cog), backed by a new RxDB `bookmarks` collection keyed by composite id.

**Architecture:** A new `bookmarks` collection stores a single row per `(profileId, targetType, targetId)` triple, where `targetType ∈ {'game','customGame'}`. The composite primary key (`${profileId}:${targetType}:${targetId}`) lets us upsert without a lookup, look up `isBookmarked` against an in-memory `Set` (no per-render queries), and cascade-clean a bookmark when its custom game is deleted by computing the same key. UI changes are additive: existing `GameCard` / `InstructionsOverlay` props stay untouched; bookmark wiring threads through the home route and the three game-route body components. No flag or rollout — the collection appears empty and behaves as "nothing bookmarked" until the user clicks a Star.

**Tech Stack:** React + TypeScript, TanStack Router, RxDB (Dexie in browser, memory in tests), Vitest + Testing Library, Playwright (E2E + VR), `lucide-react` (`Star` icon — filled vs. outline via the `fill` prop), i18next, Tailwind CSS.

**Scope note:** Search / filter by bookmark, ordering, folders, and multi-device sync semantics are spec-deferred and not implemented here. Phase 1 (rename + delete) is already merged on `master` (`41cd26b9 feat: custom games and bookmarks — Phase 1 (rename + delete) (#113)`).

---

## Pre-flight

Before starting:

- [ ] **Verify worktree.** Confirm `pwd` ends with `worktrees/feat-bookmarks-phase-2`. If not, cd into it. All work in this plan happens on the branch `feat/bookmarks-phase-2`; never edit or commit on `master`.
- [ ] **Sync.** Run `git fetch origin master && git log --oneline -1 origin/master` to confirm the base is `41cd26b9` (Phase 1 merge) or later.
- [ ] **Install.** Run `yarn install` if `node_modules` is missing.
- [ ] **Baseline green.** Run `yarn typecheck` and `yarn test` once to confirm master is passing before changes start. Abort and debug if anything fails.

---

## Task 1: Add `bookmarks` collection + schema

Create the new RxDB collection and a small composite-key helper. Pure scaffolding — nothing reads or writes to it yet.

**Files:**

- Create: `src/db/schemas/bookmarks.ts`
- Create: `src/db/schemas/bookmarks.test.ts`
- Create: `src/db/bookmark-id.ts`
- Create: `src/db/bookmark-id.test.ts`
- Modify: `src/db/schemas/index.ts` (re-export + `MAX_SCHEMA_VERSION` entry)
- Modify: `src/db/types.ts` (add to `BaseSkillCollections`)
- Modify: `src/db/create-database.ts` (register collection in `COLLECTIONS`)
- Modify: `src/db/create-database.test.ts` (assert collection is registered)

- [ ] **Step 1: Write the failing composite-id helper test.**

Create `src/db/bookmark-id.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bookmarkId, parseBookmarkId } from './bookmark-id';

describe('bookmarkId', () => {
  it('builds a composite id from profile + targetType + targetId', () => {
    expect(bookmarkId('anonymous', 'game', 'word-spell')).toBe(
      'anonymous:game:word-spell',
    );
    expect(bookmarkId('anonymous', 'customGame', 'cg_abc123')).toBe(
      'anonymous:customGame:cg_abc123',
    );
  });
});

describe('parseBookmarkId', () => {
  it('inverts bookmarkId for game targets', () => {
    expect(parseBookmarkId('anonymous:game:word-spell')).toEqual({
      profileId: 'anonymous',
      targetType: 'game',
      targetId: 'word-spell',
    });
  });

  it('inverts bookmarkId for customGame targets with colons in the id', () => {
    expect(parseBookmarkId('anonymous:customGame:cg:abc:123')).toEqual({
      profileId: 'anonymous',
      targetType: 'customGame',
      targetId: 'cg:abc:123',
    });
  });

  it('returns null for malformed ids', () => {
    expect(parseBookmarkId('not-a-bookmark')).toBeNull();
    expect(parseBookmarkId('anonymous:invalidType:x')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/db/bookmark-id.test.ts`
Expected: FAIL (`Cannot find module './bookmark-id'`).

- [ ] **Step 3: Implement the helper.**

Create `src/db/bookmark-id.ts`:

```ts
export type BookmarkTargetType = 'game' | 'customGame';

export type BookmarkTarget = {
  profileId: string;
  targetType: BookmarkTargetType;
  targetId: string;
};

export const bookmarkId = (
  profileId: string,
  targetType: BookmarkTargetType,
  targetId: string,
): string => `${profileId}:${targetType}:${targetId}`;

const TARGET_TYPES: ReadonlySet<BookmarkTargetType> = new Set([
  'game',
  'customGame',
]);

export const parseBookmarkId = (id: string): BookmarkTarget | null => {
  const firstColon = id.indexOf(':');
  if (firstColon === -1) return null;
  const profileId = id.slice(0, firstColon);
  const rest = id.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  if (secondColon === -1) return null;
  const targetType = rest.slice(0, secondColon);
  const targetId = rest.slice(secondColon + 1);
  if (!TARGET_TYPES.has(targetType as BookmarkTargetType)) return null;
  if (targetId === '') return null;
  return {
    profileId,
    targetType: targetType as BookmarkTargetType,
    targetId,
  };
};
```

- [ ] **Step 4: Run the test — expect green.**

Run: `yarn vitest run src/db/bookmark-id.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing schema test.**

Create `src/db/schemas/bookmarks.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { bookmarkId } from '@/db/bookmark-id';
import type { BaseSkillDatabase } from '@/db/types';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('bookmarks schema v1', () => {
  it('inserts a bookmark for a default game', async () => {
    const id = bookmarkId('anonymous', 'game', 'word-spell');
    const doc = await db.bookmarks.insert({
      id,
      profileId: 'anonymous',
      targetType: 'game',
      targetId: 'word-spell',
      createdAt: new Date().toISOString(),
    });
    expect(doc.id).toBe(id);
    expect(doc.targetType).toBe('game');
  });

  it('inserts a bookmark for a custom game', async () => {
    const id = bookmarkId('anonymous', 'customGame', 'cg_xyz');
    const doc = await db.bookmarks.insert({
      id,
      profileId: 'anonymous',
      targetType: 'customGame',
      targetId: 'cg_xyz',
      createdAt: new Date().toISOString(),
    });
    expect(doc.targetType).toBe('customGame');
  });

  it('rejects an invalid targetType', async () => {
    await expect(
      db.bookmarks.insert({
        id: 'anonymous:other:x',
        profileId: 'anonymous',
        targetType: 'other' as 'game',
        targetId: 'x',
        createdAt: new Date().toISOString(),
      }),
    ).rejects.toThrow();
  });

  it('rejects a doc missing required fields', async () => {
    await expect(
      db.bookmarks.insert({
        id: 'bad',
        profileId: 'anonymous',
        // targetType, targetId, createdAt missing
      } as unknown as Parameters<typeof db.bookmarks.insert>[0]),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 6: Run the test — expect failure.**

Run: `yarn vitest run src/db/schemas/bookmarks.test.ts`
Expected: FAIL (`db.bookmarks` is undefined).

- [ ] **Step 7: Create the schema file.**

Write `src/db/schemas/bookmarks.ts`:

```ts
import type { RxJsonSchema } from 'rxdb';

export type BookmarkTargetType = 'game' | 'customGame';

export type BookmarkDoc = {
  /** Composite key — `${profileId}:${targetType}:${targetId}` (see `bookmark-id.ts`) */
  id: string;
  profileId: string;
  targetType: BookmarkTargetType;
  targetId: string;
  createdAt: string;
};

export const bookmarksSchema: RxJsonSchema<BookmarkDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 256 },
    profileId: { type: 'string', maxLength: 36 },
    targetType: {
      type: 'string',
      enum: ['game', 'customGame'],
      maxLength: 16,
    },
    targetId: { type: 'string', maxLength: 64 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'targetType', 'targetId', 'createdAt'],
  additionalProperties: false,
};
```

Version is `1` for symmetry with the other collections (we never had a v0).

- [ ] **Step 8: Re-export from the schema barrel.**

In `src/db/schemas/index.ts`, add the import and re-exports alphabetically (right below `app-meta`, above `custom_games`):

```ts
import { bookmarksSchema } from './bookmarks';
// ...
export { bookmarksSchema } from './bookmarks';
export type { BookmarkDoc, BookmarkTargetType } from './bookmarks';
```

Add `bookmarksSchema.version` to the `MAX_SCHEMA_VERSION` reducer so its version participates in the singleton's schema-version tracking:

```ts
export const MAX_SCHEMA_VERSION = Math.max(
  appMetaSchema.version,
  bookmarksSchema.version,
  customGamesSchema.version,
  // … existing entries unchanged …
);
```

- [ ] **Step 9: Add the collection to `BaseSkillCollections`.**

In `src/db/types.ts`:

```ts
import type { BookmarkDoc } from './schemas/bookmarks';
// ...
export type BaseSkillCollections = {
  app_meta: RxCollection<AppMetaDoc>;
  bookmarks: RxCollection<BookmarkDoc>;
  custom_games: RxCollection<CustomGameDoc>;
  // … rest unchanged …
};
```

Place `bookmarks` alphabetically between `app_meta` and `custom_games` to match the schema barrel ordering.

- [ ] **Step 10: Register the collection in `create-database.ts`.**

In `src/db/create-database.ts`, import `bookmarksSchema` from the barrel and add the entry to `COLLECTIONS` between `app_meta` and `custom_games`:

```ts
const COLLECTIONS = {
  app_meta: {
    /* … unchanged … */
  },
  bookmarks: { schema: bookmarksSchema },
  custom_games: { schema: customGamesSchema },
  // … rest unchanged …
} as const;
```

- [ ] **Step 11: Extend `create-database.test.ts`.**

In `src/db/create-database.test.ts`, add `'bookmarks'` to the `names` array in the `adds all collections` test (alphabetical):

```ts
const names = [
  'app_meta',
  'bookmarks',
  'custom_games',
  // … existing unchanged …
] as const;
```

- [ ] **Step 12: Typecheck + run all DB tests.**

```bash
yarn typecheck
yarn vitest run src/db
```

Expected: all PASS.

- [ ] **Step 13: Commit.**

```bash
git add -A
git commit -m "feat(db): add bookmarks collection + composite-key helper

Schema v1 with enum-validated targetType ('game'|'customGame') and a
composite-id helper for cheap upsert/lookup. No consumers yet — wired
up in the next commits."
```

---

## Task 2: Add `useBookmarks` hook

Create the hook that the UI will call. The hook builds an in-memory `Set` of composite ids so `isBookmarked(target)` is O(1) without per-render queries.

**Files:**

- Create: `src/db/hooks/useBookmarks.ts`
- Create: `src/db/hooks/useBookmarks.test.tsx`

- [ ] **Step 1: Write the failing hook test.**

Create `src/db/hooks/useBookmarks.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRxDB } from './useRxDB';
import { useBookmarks } from './useBookmarks';
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
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/db/hooks/useBookmarks.test.tsx`
Expected: FAIL (`Cannot find module './useBookmarks'`).

- [ ] **Step 3: Implement the hook.**

Create `src/db/hooks/useBookmarks.ts`:

```ts
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
      if (isBookmarked(target)) {
        await remove(target);
      } else {
        await add(target);
      }
    },
    [isBookmarked, add, remove],
  );

  return { bookmarks, isBookmarked, toggle, add, remove };
};
```

- [ ] **Step 4: Run the test — expect green.**

```bash
yarn vitest run src/db/hooks/useBookmarks.test.tsx
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "feat(db): add useBookmarks hook

Reactive RxDB query + in-memory Set so isBookmarked is O(1) per call.
toggle/add/remove all keyed off the composite-id helper for idempotent
upsert and clean removal."
```

---

## Task 3: Cascade-clean bookmark when its custom game is deleted

When a custom game is removed, its bookmark row (if any) becomes orphaned. Extend `useCustomGames.remove` to delete the matching bookmark in the same transaction-ish call so the UI never shows a Star for a target that no longer exists.

**Files:**

- Modify: `src/db/hooks/useCustomGames.ts` (extend `remove`)
- Modify: `src/db/hooks/useCustomGames.test.tsx` (add cascade test)

- [ ] **Step 1: Add the failing cascade test.**

In `src/db/hooks/useCustomGames.test.tsx`, add this test inside the existing `describe('useCustomGames', …)` block (place it near the other `remove()` test):

```tsx
it('remove() also deletes the matching bookmark row (cascade)', async () => {
  const { result } = renderHook(() => useCustomGamesReady(), {
    wrapper: makeWrapper(db),
  });
  await waitFor(() => expect(result.current.isReady).toBe(true));

  let id = '';
  await act(async () => {
    id = await result.current.save({
      gameId: 'word-spell',
      name: 'To Delete',
      config: {},
      color: 'indigo',
    });
  });
  await waitFor(() =>
    expect(result.current.customGames).toHaveLength(1),
  );

  // Manually seed a bookmark row for this custom game.
  await db.bookmarks.insert({
    id: `anonymous:customGame:${id}`,
    profileId: 'anonymous',
    targetType: 'customGame',
    targetId: id,
    createdAt: new Date().toISOString(),
  });
  expect(await db.bookmarks.find().exec()).toHaveLength(1);

  await act(async () => {
    await result.current.remove(id);
  });
  await waitFor(() =>
    expect(result.current.customGames).toHaveLength(0),
  );
  expect(await db.bookmarks.find().exec()).toHaveLength(0);
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/db/hooks/useCustomGames.test.tsx`
Expected: FAIL on the new test only — the bookmark row survives the delete.

- [ ] **Step 3: Update `useCustomGames.remove` to cascade.**

In `src/db/hooks/useCustomGames.ts`, add the import:

```ts
import { bookmarkId } from '@/db/bookmark-id';
```

Then replace the existing `remove` function with:

```ts
const remove = async (id: string): Promise<void> => {
  if (!db) return;
  const doc = await db.custom_games.findOne(id).exec();
  if (doc) await doc.remove();
  const bookmark = await db.bookmarks
    .findOne(bookmarkId(ANONYMOUS_PROFILE_ID, 'customGame', id))
    .exec();
  if (bookmark) await bookmark.remove();
};
```

The two removes are sequential rather than `Promise.all` so a partial failure on the bookmark side doesn't leave the source row deleted but the cascade unattempted (we still attempt it; if it throws, the caller surfaces the error). RxDB calls have no concept of cross-collection transactions, so this is the best we can do.

- [ ] **Step 4: Run the test — expect green.**

```bash
yarn vitest run src/db/hooks/useCustomGames.test.tsx
```

Expected: all tests PASS (including the new cascade test plus the pre-existing ones).

- [ ] **Step 5: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "feat(db): cascade-clean bookmark when its custom game is deleted

useCustomGames.remove now also removes the matching bookmark row keyed
off the composite id so the UI never shows a Star for a deleted target."
```

---

## Task 4: Add `Star` toggle to `GameCard`

Add an optional `Star` button overlay in the cover top-right corner. The icon is filled when `isBookmarked` is true, outlined otherwise. The button stops click propagation so the Play action on the cover button below it doesn't fire.

**Files:**

- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/GameCard.test.tsx`
- Modify: `src/components/GameCard.stories.tsx`

- [ ] **Step 1: Add the failing tests.**

Append the following tests to the existing `describe('GameCard', …)` block in `src/components/GameCard.test.tsx`:

```tsx
it('does not render the Star button when onToggleBookmark is omitted', () => {
  render(
    <GameCard
      variant="default"
      gameId="sort-numbers"
      title="Count in Order"
      chips={[]}
      onPlay={vi.fn()}
      onOpenCog={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole('button', { name: /bookmark/i }),
  ).toBeNull();
});

it('renders an outline Star (aria-pressed=false) when isBookmarked is false', () => {
  render(
    <GameCard
      variant="default"
      gameId="sort-numbers"
      title="Count in Order"
      chips={[]}
      onPlay={vi.fn()}
      onOpenCog={vi.fn()}
      isBookmarked={false}
      onToggleBookmark={vi.fn()}
    />,
  );
  const star = screen.getByRole('button', { name: /bookmark/i });
  expect(star).toHaveAttribute('aria-pressed', 'false');
});

it('renders a filled Star (aria-pressed=true) when isBookmarked is true', () => {
  render(
    <GameCard
      variant="default"
      gameId="sort-numbers"
      title="Count in Order"
      chips={[]}
      onPlay={vi.fn()}
      onOpenCog={vi.fn()}
      isBookmarked
      onToggleBookmark={vi.fn()}
    />,
  );
  const star = screen.getByRole('button', { name: /bookmark/i });
  expect(star).toHaveAttribute('aria-pressed', 'true');
});

it('clicking the Star fires onToggleBookmark and does NOT fire onPlay', async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn();
  const onToggleBookmark = vi.fn();
  render(
    <GameCard
      variant="default"
      gameId="sort-numbers"
      title="Count in Order"
      chips={[]}
      onPlay={onPlay}
      onOpenCog={vi.fn()}
      isBookmarked={false}
      onToggleBookmark={onToggleBookmark}
    />,
  );
  await user.click(screen.getByRole('button', { name: /bookmark/i }));
  expect(onToggleBookmark).toHaveBeenCalledTimes(1);
  expect(onPlay).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/components/GameCard.test.tsx`
Expected: FAIL — the Star button doesn't exist yet.

- [ ] **Step 3: Update `GameCard.tsx`.**

Replace the full contents of `src/components/GameCard.tsx` with:

```tsx
import {
  CircleDashed,
  CircleDot,
  SettingsIcon,
  Star,
} from 'lucide-react';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';

type Common = {
  gameId: string;
  title: string;
  chips: string[];
  cover?: Cover;
  onPlay: () => void;
  onOpenCog: () => void;
  /** Bookmark state — when both `isBookmarked` and `onToggleBookmark` are provided, a Star toggle renders in the cover top-right. */
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
};

type DefaultVariant = Common & { variant: 'default' };
type CustomGameVariant = Common & {
  variant: 'customGame';
  customGameName: string;
  customGameColor: GameColorKey;
};

type GameCardProps = DefaultVariant | CustomGameVariant;

export const GameCard = (props: GameCardProps): JSX.Element => {
  const {
    gameId,
    title,
    chips,
    onPlay,
    onOpenCog,
    isBookmarked,
    onToggleBookmark,
  } = props;
  const cover =
    props.cover === undefined
      ? resolveDefaultCover(gameId)
      : props.cover;

  const isCustom = props.variant === 'customGame';
  const headingText = isCustom ? props.customGameName : title;
  const subtitleText = isCustom ? title : undefined;

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm"
      data-card-type={isCustom ? 'customGame' : 'default'}
    >
      <button
        type="button"
        aria-label={`Play ${headingText}`}
        onClick={onPlay}
        className="flex flex-col text-left active:scale-[0.98]"
      >
        <div className="relative p-2">
          <GameCover cover={cover} size="card" />
        </div>

        <div className="flex flex-col gap-1 px-3 pb-3">
          <h2 className="flex items-center gap-1.5 text-sm font-bold leading-tight text-foreground">
            {isCustom ? (
              <CircleDot
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            ) : (
              <CircleDashed
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            )}
            {headingText}
          </h2>
          {subtitleText && (
            <p className="text-xs italic text-muted-foreground">
              {subtitleText}
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </button>

      {onToggleBookmark && (
        <button
          type="button"
          aria-label={isBookmarked ? `Remove bookmark` : `Add bookmark`}
          aria-pressed={isBookmarked ?? false}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
          className="absolute right-2 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-foreground shadow"
        >
          <Star
            size={16}
            aria-hidden="true"
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </button>
      )}

      <button
        type="button"
        aria-label="Settings"
        onClick={onOpenCog}
        className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow"
      >
        <SettingsIcon size={14} />
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Author the bookmark stories in `GameCard.stories.tsx`.**

Storybook is the visual contract for the bookmark UI — every state we render in production should have a story. Append four new exports after the existing ones (one per `variant × isBookmarked` combination):

```tsx
export const NotBookmarked: Story = {
  args: {
    variant: 'default',
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const Bookmarked: Story = {
  args: {
    variant: 'default',
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};

export const NotBookmarkedCustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const BookmarkedCustomGame: Story = {
  args: {
    variant: 'customGame',
    customGameName: 'Skip by 2',
    customGameColor: 'amber',
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};
```

Also add `onToggleBookmark: { action: 'bookmarkToggled' }` to the existing `meta.argTypes` block so toggle clicks surface in the Storybook actions panel:

```ts
argTypes: {
  onPlay: { action: 'played' },
  onOpenCog: { action: 'cogOpened' },
  onToggleBookmark: { action: 'bookmarkToggled' },
},
```

These stories double as visual regression fixtures (`yarn test:storybook` smoke-renders each one) and as the source baselines for any future VR snapshots that target the GameCard in isolation.

- [ ] **Step 5: Run the tests — expect green.**

Run: `yarn vitest run src/components/GameCard.test.tsx`
Expected: PASS (all original + new tests).

- [ ] **Step 6: Typecheck.**

Run: `yarn typecheck`
Expected: PASS — props are optional so existing consumers compile unchanged.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(game-card): add Star bookmark toggle in cover corner

New optional isBookmarked + onToggleBookmark props. Click stops propagation
so the cover Play action does not also fire. aria-pressed reflects state
for screen readers."
```

---

## Task 5: Add `Star` toggle to `InstructionsOverlay`

Add a Star button next to the title-row cog. Same `isBookmarked` / `onToggleBookmark` API as `GameCard`. The button sits to the **left** of the cog (cog stays the rightmost action).

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`

- [ ] **Step 1: Add the failing tests.**

Append to the existing `describe('InstructionsOverlay', …)` block in `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`:

```tsx
it('does not render a Star button when onToggleBookmark is omitted', () => {
  renderOverlay({});
  expect(
    screen.queryByRole('button', { name: /bookmark/i }),
  ).toBeNull();
});

it('renders aria-pressed=false when isBookmarked is false', () => {
  renderOverlay({
    isBookmarked: false,
    onToggleBookmark: vi.fn(),
  });
  const star = screen.getByRole('button', { name: /bookmark/i });
  expect(star).toHaveAttribute('aria-pressed', 'false');
});

it('renders aria-pressed=true when isBookmarked is true', () => {
  renderOverlay({
    isBookmarked: true,
    onToggleBookmark: vi.fn(),
  });
  const star = screen.getByRole('button', { name: /bookmark/i });
  expect(star).toHaveAttribute('aria-pressed', 'true');
});

it('clicking the Star fires onToggleBookmark', async () => {
  const user = userEvent.setup();
  const onToggleBookmark = vi.fn();
  renderOverlay({
    isBookmarked: false,
    onToggleBookmark,
  });
  await user.click(screen.getByRole('button', { name: /bookmark/i }));
  expect(onToggleBookmark).toHaveBeenCalledTimes(1);
});
```

If the existing test file does not already have a `renderOverlay` helper, scroll to the top of the file and add this above the first `describe`:

```tsx
const renderOverlay = (
  overrides: Partial<
    React.ComponentProps<typeof InstructionsOverlay>
  > = {},
) =>
  render(
    <InstructionsOverlay
      text="Spell the word."
      onStart={() => {}}
      ttsEnabled={false}
      gameTitle="Word Spell"
      gameId="word-spell"
      config={{}}
      onConfigChange={() => {}}
      onSaveCustomGame={vi.fn().mockResolvedValue('id')}
      {...overrides}
    />,
  );
```

If `renderOverlay` already exists, just reuse it; do not redefine.

- [ ] **Step 2: Run the test — expect failure.**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: the four new tests FAIL — Star button doesn't exist yet.

- [ ] **Step 3: Add the props + Star button to `InstructionsOverlay.tsx`.**

In `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, update the top imports to add `Star`:

```ts
import { Settings as SettingsIcon, Star } from 'lucide-react';
```

In `InstructionsOverlayProps`, add the two optional props (place them right after `existingCustomGameNames`):

```ts
isBookmarked?: boolean;
onToggleBookmark?: () => void;
```

In the destructured props, add them:

```ts
isBookmarked,
onToggleBookmark,
```

Replace the existing title-row JSX block (the `{/* 2. Title row + cog … */}` `<div>`) with the new layout that includes a Star button to the left of the cog:

```tsx
{
  /* 2. Title row + bookmark + cog — matches GameCard heading/subtitle order */
}
<div className="flex items-center justify-between gap-2">
  <div>
    <h2
      className="text-xl font-extrabold"
      style={
        customGameName ? { color: settingsColors.text } : undefined
      }
    >
      {customGameName ?? gameTitle}
    </h2>
    {customGameName && (
      <p className="text-xs italic text-foreground/80">{gameTitle}</p>
    )}
  </div>
  <div className="flex items-center gap-2">
    {onToggleBookmark && (
      <button
        type="button"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        aria-pressed={isBookmarked ?? false}
        onClick={onToggleBookmark}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
      >
        <Star
          size={18}
          aria-hidden="true"
          fill={isBookmarked ? 'currentColor' : 'none'}
        />
      </button>
    )}
    <button
      type="button"
      aria-label={t('instructions.configure', {
        defaultValue: 'Configure',
      })}
      onClick={() => setModalOpen(true)}
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
    >
      <SettingsIcon size={18} />
    </button>
  </div>
</div>;
```

- [ ] **Step 4: Author the bookmark stories in `InstructionsOverlay.stories.tsx`.**

Cover both bookmark states for both the default game and the custom-game header variant. Append four new exports after the existing ones:

```tsx
export const NotBookmarked: Story = {
  args: {
    ...baseArgs,
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const Bookmarked: Story = {
  args: {
    ...baseArgs,
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};

export const NotBookmarkedCustomGame: Story = {
  args: {
    ...baseArgs,
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal',
    isBookmarked: false,
    onToggleBookmark: () => {},
  },
};

export const BookmarkedCustomGame: Story = {
  args: {
    ...baseArgs,
    customGameId: 'abc123',
    customGameName: 'Easy Mode',
    customGameColor: 'teal',
    isBookmarked: true,
    onToggleBookmark: () => {},
  },
};
```

Also extend the existing `meta.argTypes` to surface the new action:

```ts
argTypes: {
  onStart: { action: 'started' },
  onSaveCustomGame: { action: 'customGameSaved' },
  onUpdateCustomGame: { action: 'customGameUpdated' },
  onToggleBookmark: { action: 'bookmarkToggled' },
},
```

These stories give Storybook autodocs a rendered preview of every bookmark state and let `yarn test:storybook` catch regressions where the Star button fails to render or throws on toggle.

- [ ] **Step 5: Run the test — expect green.**

```bash
yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Typecheck.**

Run: `yarn typecheck`
Expected: PASS — both new props are optional.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(instructions-overlay): add Star bookmark toggle next to cog

Star button rendered when onToggleBookmark is provided. Sits left of
the cog so the cog remains the rightmost action."
```

---

## Task 6: Wire bookmark toggle on the home route

For each card on the home grid, compute `isBookmarked({ targetType, targetId })` and pass `onToggleBookmark={() => toggle(...)}`. Default cards target `{ type: 'game', id: gameId }`; custom cards target `{ type: 'customGame', id: customGame.id }`.

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`

- [ ] **Step 1: Add the hook + wire props.**

In `src/routes/$locale/_app/index.tsx`, add the import:

```ts
import { useBookmarks } from '@/db/hooks/useBookmarks';
```

Inside `HomeScreen`, after the existing `useCustomGames()` line, call `useBookmarks`:

```ts
const { isBookmarked, toggle } = useBookmarks();
```

In the `defaults` map, add the two bookmark props to the `<GameCard>`:

```tsx
<GameCard
  key={`default-${entry.id}`}
  variant="default"
  gameId={entry.id}
  title={t(entry.titleKey)}
  chips={configToChips(entry.id, lastSessionConfigs[entry.id] ?? {})}
  onPlay={() => handlePlayDefault(entry.id)}
  onOpenCog={() => void openDefaultCog(entry.id)}
  isBookmarked={isBookmarked({
    targetType: 'game',
    targetId: entry.id,
  })}
  onToggleBookmark={() =>
    void toggle({ targetType: 'game', targetId: entry.id })
  }
/>
```

In the `customCards` flatMap, add the same two props:

```tsx
<GameCard
  key={`custom-${doc.id}`}
  variant="customGame"
  gameId={doc.gameId}
  title={t(entry.titleKey)}
  customGameName={doc.name}
  customGameColor={doc.color as GameColorKey}
  cover={doc.cover}
  chips={configToChips(doc.gameId, doc.config)}
  onPlay={() => handlePlayCustomGame(doc.gameId, doc.id)}
  onOpenCog={() => openCustomGameCog(doc.gameId, doc)}
  isBookmarked={isBookmarked({
    targetType: 'customGame',
    targetId: doc.id,
  })}
  onToggleBookmark={() =>
    void toggle({ targetType: 'customGame', targetId: doc.id })
  }
/>
```

- [ ] **Step 2: Typecheck.**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add -A
git commit -m "feat(home-route): wire bookmark Star on default + custom cards"
```

---

## Task 7: Wire bookmark toggle on the game route

Each of the three game-route body components (`WordSpellGameBody`, `NumberMatchGameBody`, `SortNumbersGameBody`) renders an `<InstructionsOverlay>`. Each needs the same `useBookmarks` wiring: compute the right `targetType`/`targetId` based on whether the route was opened with a `configId`, then pass `isBookmarked` + `onToggleBookmark` through to the overlay.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Import `useBookmarks` once at the top of the file.**

```ts
import { useBookmarks } from '@/db/hooks/useBookmarks';
```

- [ ] **Step 2: Wire the hook + overlay props in each body component.**

For each of the three body components — `WordSpellGameBody`, `NumberMatchGameBody`, and `SortNumbersGameBody` — add this immediately after the existing `useCustomGames()` call inside the body:

```ts
const { isBookmarked, toggle } = useBookmarks();
const bookmarkTarget = customGameId
  ? ({ targetType: 'customGame', targetId: customGameId } as const)
  : ({ targetType: 'game', targetId: gameId } as const);
```

Then in the `<InstructionsOverlay …>` JSX (the `if (showInstructions)` branch in each body), add these two props alongside the existing ones:

```tsx
isBookmarked={isBookmarked(bookmarkTarget)}
onToggleBookmark={() => void toggle(bookmarkTarget)}
```

Apply this identical change to all three body components. They follow the same shape so the diff is mechanical; do not refactor the bodies into a shared component as part of this task — that's out of scope.

- [ ] **Step 3: Typecheck + targeted unit tests.**

```bash
yarn typecheck
yarn vitest run 'src/routes/**/*.test.*'
```

Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "feat(game-route): wire bookmark Star on InstructionsOverlay

Each game body computes its bookmark target ('game' for default routes,
'customGame' for routes opened with configId) and threads isBookmarked
+ toggle through to the overlay."
```

---

## Task 8: i18n keys for bookmark labels

The Star button currently uses hard-coded English aria-labels (`Add bookmark` / `Remove bookmark`). Replace those with `t('bookmark.add')` / `t('bookmark.remove')` so screen-reader users in pt-BR get translated copy.

**Files:**

- Modify: `src/lib/i18n/locales/en/common.json`
- Modify: `src/lib/i18n/locales/pt-BR/common.json`
- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`

- [ ] **Step 1: Add the keys to English `common.json`.**

In `src/lib/i18n/locales/en/common.json`, add a new top-level `bookmark` block (place it alphabetically — between `appName` and `customGame`, or after `customGame`, whichever keeps the file consistent with its current ordering):

```json
"bookmark": {
  "add": "Add bookmark",
  "remove": "Remove bookmark"
}
```

- [ ] **Step 2: Add the same keys to pt-BR `common.json`.**

In `src/lib/i18n/locales/pt-BR/common.json`, add:

```json
"bookmark": {
  "add": "Adicionar marcador",
  "remove": "Remover marcador"
}
```

- [ ] **Step 3: Use `t(…)` in `GameCard.tsx`.**

In `src/components/GameCard.tsx`, add the import:

```ts
import { useTranslation } from 'react-i18next';
```

Inside `GameCard`, near the other top-of-component lines, add:

```ts
const { t } = useTranslation('common');
```

Replace the Star button's `aria-label` attribute:

```tsx
aria-label={
  isBookmarked
    ? t('bookmark.remove', { defaultValue: 'Remove bookmark' })
    : t('bookmark.add', { defaultValue: 'Add bookmark' })
}
```

- [ ] **Step 4: Use `t(…)` in `InstructionsOverlay.tsx`.**

`InstructionsOverlay` already calls `useTranslation('games')`. Since the bookmark keys live in `common.json`, switch to the multi-namespace form at the top of the component:

```ts
const { t } = useTranslation(['games', 'common']);
```

Then update the Star button's `aria-label`:

```tsx
aria-label={
  isBookmarked
    ? t('common:bookmark.remove', { defaultValue: 'Remove bookmark' })
    : t('common:bookmark.add', { defaultValue: 'Add bookmark' })
}
```

(Other `t('instructions.…')` calls in the same component continue to resolve from `games.json` because the call sites use unprefixed keys; the array form keeps `games` as the default namespace.)

- [ ] **Step 5: Format + verify.**

```bash
npx prettier --write "src/lib/i18n/locales/**/*.json"
yarn typecheck
yarn vitest run src/components/GameCard.test.tsx src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: all PASS. The aria-label tests should still match because `getByRole('button', { name: /bookmark/i })` matches both `Add bookmark` and `Remove bookmark`.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "i18n(bookmark): add localized aria-labels for the Star toggle

Adds common.bookmark.add/remove in en and pt-BR; GameCard and
InstructionsOverlay both consume them so screen readers in pt-BR
get translated copy."
```

---

## Task 9: Update VR baselines for the new Star button

Adding the Star toggle changes the home grid (every card now has a top-right Star) and the game-route InstructionsOverlay (new button next to the cog). VR baselines need regenerating.

**Files:**

- Update: `e2e/__snapshots__/visual.spec.ts/home-chromium.png`
- Update: `e2e/__snapshots__/visual.spec.ts/home-dark-chromium.png`
- Update: any other snapshot under `e2e/__snapshots__/visual.spec.ts/` that captures the `InstructionsOverlay` (run `yarn test:vr` first to surface the affected list).

- [ ] **Step 1: Confirm Docker is running.**

Run: `docker info | head -1`
Expected: prints the Docker server info line. If Docker isn't running, start Docker Desktop (or ask the user to). VR baselines MUST be regenerated in Docker so they match CI's Linux/Chromium rendering.

- [ ] **Step 2: Run VR to surface diffs.**

```bash
yarn test:vr
```

Expected: failures on home-page snapshots (and any instructions-overlay snapshot). Note the affected file names from the output.

- [ ] **Step 3: Review the diff images.**

Open each `*-diff.png` under `test-results/` and confirm the only change is the new Star button in the expected position (cover top-right on cards, left of the cog in the overlay header). If anything else changed unintentionally, revisit Tasks 4–7.

- [ ] **Step 4: Regenerate the baselines.**

```bash
yarn test:vr:update
```

Expected: only the home-page (and instructions-overlay, if covered) baselines update.

- [ ] **Step 5: Re-run VR to confirm green.**

```bash
yarn test:vr
```

Expected: all snapshots match.

- [ ] **Step 6: Commit the baselines.**

```bash
git add -A
git commit -m "test(vr): regenerate baselines for new Star bookmark button"
```

---

## Task 10: E2E — bookmark a default game, persist, then remove

Add a Playwright flow that proves the end-to-end behaviour: bookmark a card, navigate away and back, confirm it's still bookmarked, then click again to remove.

**Files:**

- Create: `e2e/bookmark-toggle.spec.ts`

- [ ] **Step 1: Write the E2E test.**

Create `e2e/bookmark-toggle.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('bookmark a default game, persist across navigation, then unbookmark', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // First default card's Add bookmark button.
  const addBookmark = page
    .getByRole('button', { name: /add bookmark/i })
    .first();
  await addBookmark.click();

  // Now the same button should report the "remove" label and be pressed.
  const removeBookmark = page
    .getByRole('button', { name: /remove bookmark/i })
    .first();
  await expect(removeBookmark).toHaveAttribute('aria-pressed', 'true');

  // Navigate away (open the same card's settings cog) and back home.
  await page
    .getByRole('button', { name: /^settings$/i })
    .first()
    .click();
  // Close the modal by pressing Escape so we stay on the home route.
  await page.keyboard.press('Escape');

  // Bookmark state survives — the same button is still labelled "Remove" + pressed.
  await expect(
    page.getByRole('button', { name: /remove bookmark/i }).first(),
  ).toHaveAttribute('aria-pressed', 'true');

  // Click again to unbookmark.
  await page
    .getByRole('button', { name: /remove bookmark/i })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: /add bookmark/i }).first(),
  ).toHaveAttribute('aria-pressed', 'false');
});
```

- [ ] **Step 2: Run the E2E test.**

```bash
yarn test:e2e --grep "bookmark a default game"
```

Expected: PASS. If the test flakes on IndexedDB state across runs, add this `beforeEach` cleanup before `seedMathRandom`:

```ts
await page.context().clearCookies();
await page.evaluate(() => indexedDB.deleteDatabase('baseskill-data'));
```

- [ ] **Step 3: Commit.**

```bash
git add -A
git commit -m "test(e2e): cover bookmark add + persistence + remove flow"
```

---

## Task 11: Final verification — lint, typecheck, test, build

Run the full pre-push gate locally and fix anything that surfaces.

- [ ] **Step 1: Run the pre-push check set.**

```bash
yarn typecheck
yarn lint
yarn lint:md
yarn test
yarn build
```

Expected: all PASS. The smart-pipelines `Triggered checks:` output at pre-push time should list `prettier, eslint, stylelint, markdownlint, actionlint, shellcheck, knip, typecheck, unit, build`.

- [ ] **Step 2: Run the Storybook test runner against the new bookmark stories.**

The test runner smoke-renders every story (autodocs + explicit exports) and fails on render errors or a11y violations. The new `Bookmarked`, `NotBookmarked`, `BookmarkedCustomGame`, and `NotBookmarkedCustomGame` stories on both `GameCard` and `InstructionsOverlay` must render cleanly.

In one terminal:

```bash
yarn storybook
```

Wait for the line `Storybook started on => http://localhost:6006/`.

In a second terminal:

```bash
yarn test:storybook --url http://localhost:6006
```

Expected: PASS for every story including the eight new bookmark exports. If a story throws, fix the component or props in Task 4 / Task 5 — do not "fix" the story by removing the failing case.

Stop the Storybook dev server (`Ctrl+C` in the first terminal) once the runner exits green.

- [ ] **Step 3: Confirm the new symbols exist and are wired.**

Quick sanity grep — every line should resolve to a real file/symbol:

```text
Grep pattern="useBookmarks|bookmarkId|BookmarkDoc|bookmarksSchema" path="src" output_mode="files_with_matches"
```

Expected: at minimum `src/db/bookmark-id.ts`, `src/db/schemas/bookmarks.ts`, `src/db/hooks/useBookmarks.ts`, `src/components/GameCard.tsx`, `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`, `src/routes/$locale/_app/index.tsx`, `src/routes/$locale/_app/game/$gameId.tsx`, plus the schema barrel and types files.

- [ ] **Step 4: Push and open the PR.**

```bash
git push -u origin feat/bookmarks-phase-2
gh pr create --base master --title "feat: bookmarks — Phase 2 (Star toggle on default + custom games)" \
  --body "$(cat <<'EOF'
## Summary

- Adds a per-item bookmark toggle (`Star` icon) on `GameCard` (cover corner) and `InstructionsOverlay` (next to the title cog).
- New RxDB `bookmarks` collection keyed by composite id (`${profileId}:${targetType}:${targetId}`); `targetType ∈ { 'game', 'customGame' }`.
- `useBookmarks` hook exposes `{ bookmarks, isBookmarked, toggle, add, remove }`; `isBookmarked` is O(1) against an in-memory `Set`.
- `useCustomGames.remove` cascade-cleans the matching bookmark row so deleting a custom game can't leave an orphan.

Spec: `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md` (Phase 2 section).
Plan: `docs/superpowers/plans/2026-04-16-bookmarks-phase-2.md`.

## Test plan

- [x] `yarn typecheck`
- [x] `yarn lint`
- [x] `yarn lint:md`
- [x] `yarn test` (unit, including new schema + hook + cascade tests)
- [x] `yarn test:storybook` (smoke-renders the eight new bookmark stories on `GameCard` + `InstructionsOverlay`)
- [x] `yarn test:vr` (Docker baselines refreshed for new Star buttons)
- [x] `yarn test:e2e --grep "bookmark a default game"`
- [x] `yarn build`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR opens against `master`. CI runs the full smart-pipeline. Share the PR URL with the user.

---

## Self-review notes (author → future executor)

**Spec coverage check** — every section of the Phase 2 portion of
`docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md` maps to a task:

- Data model (`BookmarkDoc`, composite id, `targetType` enum) → Task 1.
- `useBookmarks` API (`bookmarks`, `isBookmarked`, `toggle`, `add`, `remove`) → Task 2.
- "No deletion cascade" semantics — un-bookmarking doesn't touch sources → Tasks 2 (toggle/add/remove only touch `bookmarks`). Cascade-clean of orphaned bookmarks when the source custom game is deleted → Task 3 (defensive cleanup; the spec is silent on this edge case so I added it explicitly).
- UI surfaces: `GameCard` Star toggle on default + custom → Task 4 (component, including Storybook stories `Bookmarked`, `NotBookmarked`, `BookmarkedCustomGame`, `NotBookmarkedCustomGame`) + Task 6 (wiring).
- UI surfaces: `InstructionsOverlay` Star next to cog → Task 5 (component, including Storybook stories for both bookmark states across default and custom-game headers) + Task 7 (wiring across all three game bodies).
- Storybook coverage for every new visual state is verified via `yarn test:storybook` in Task 11 Step 2 (matches the CI step `test:storybook --url http://localhost:6006`).
- i18n for accessible labels → Task 8.
- Out-of-scope (search/filter, ordering, folders, multi-device sync) → not implemented.

**Placeholder scan** — no "TODO", "TBD", or "similar to Task N". Every code step shows the full code.

**Type consistency** — identifiers used in later tasks match earlier ones:
`BookmarkDoc` (Task 1), `BookmarkTargetType` (Task 1), `bookmarkId` (Task 1), `useBookmarks`
(Task 2), `BookmarkTargetInput` (Task 2), `isBookmarked` / `toggle` / `add` / `remove`
(Task 2), `isBookmarked` / `onToggleBookmark` props (Tasks 4, 5), `bookmark.add` /
`bookmark.remove` i18n keys (Task 8).
