# Group H: Bookmarks Sorted to Top — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bookmarked games always appear at the top of the catalog, before non-bookmarked games, while preserving the existing filter and pagination behaviour.

**Architecture:** Add a `sortByBookmarks` function to `catalog-utils.ts` that stably sorts an array of `GameCatalogEntry` items — bookmarked IDs first, original order preserved within each group. The home route calls it inside the existing `filtered` `useMemo` after `filterCatalog`. No schema changes, no new hooks.

**Tech Stack:** TypeScript, Vitest

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/games/catalog-utils.ts` | Modify | Add `sortByBookmarks(entries, bookmarkedIds)` |
| `src/games/catalog-utils.test.ts` | Modify | Add tests for `sortByBookmarks` |
| `src/routes/$locale/_app/index.tsx` | Modify | Call `sortByBookmarks` in `filtered` useMemo |

---

## Task 1: Add sortByBookmarks to catalog-utils

**Files:**
- Modify: `src/games/catalog-utils.ts`
- Modify: `src/games/catalog-utils.test.ts`

- [ ] **Step 1: Write failing tests**

  Open `src/games/catalog-utils.test.ts` and add:

  ```ts
  import { sortByBookmarks } from './catalog-utils';

  describe('sortByBookmarks', () => {
    const entries = [
      { id: 'alpha', titleKey: 'alpha', levels: ['K' as const], subject: 'math' as const },
      { id: 'beta',  titleKey: 'beta',  levels: ['K' as const], subject: 'math' as const },
      { id: 'gamma', titleKey: 'gamma', levels: ['K' as const], subject: 'math' as const },
    ];

    it('moves bookmarked entries to the front', () => {
      const result = sortByBookmarks(entries, new Set(['gamma']));
      expect(result[0].id).toBe('gamma');
      expect(result[1].id).toBe('alpha');
      expect(result[2].id).toBe('beta');
    });

    it('preserves original order among non-bookmarked entries', () => {
      const result = sortByBookmarks(entries, new Set(['beta']));
      expect(result[0].id).toBe('beta');
      expect(result[1].id).toBe('alpha');
      expect(result[2].id).toBe('gamma');
    });

    it('preserves original order among multiple bookmarked entries', () => {
      const result = sortByBookmarks(entries, new Set(['gamma', 'alpha']));
      expect(result[0].id).toBe('alpha');
      expect(result[1].id).toBe('gamma');
      expect(result[2].id).toBe('beta');
    });

    it('returns original order when no bookmarks', () => {
      const result = sortByBookmarks(entries, new Set());
      expect(result.map((e) => e.id)).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('does not mutate the input array', () => {
      const copy = [...entries];
      sortByBookmarks(entries, new Set(['beta']));
      expect(entries).toEqual(copy);
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/games/catalog-utils.test.ts 2>&1 | tail -10
  ```

  Expected: FAIL — `sortByBookmarks is not exported`.

- [ ] **Step 2: Add `sortByBookmarks` to `catalog-utils.ts`**

  Open `src/games/catalog-utils.ts` and append:

  ```ts
  export function sortByBookmarks<T extends { id: string }>(
    entries: T[],
    bookmarkedIds: Set<string>,
  ): T[] {
    if (bookmarkedIds.size === 0) return entries;
    return [...entries].sort((a, b) => {
      const aBookmarked = bookmarkedIds.has(a.id) ? 0 : 1;
      const bBookmarked = bookmarkedIds.has(b.id) ? 0 : 1;
      return aBookmarked - bBookmarked;
    });
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/games/catalog-utils.test.ts 2>&1 | tail -10
  ```

  Expected: all `sortByBookmarks` tests PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/catalog-utils.ts src/games/catalog-utils.test.ts
  git commit -m "feat(catalog): add sortByBookmarks utility"
  ```

---

## Task 2: Use sortByBookmarks in home route

**Files:**
- Modify: `src/routes/$locale/_app/index.tsx`

- [ ] **Step 1: Import and call sortByBookmarks**

  In `src/routes/$locale/_app/index.tsx`, add `sortByBookmarks` to the import:

  ```ts
  import { filterCatalog, paginateCatalog, sortByBookmarks } from '@/games/catalog-utils';
  ```

  Then update the `filtered` useMemo to sort after filtering:

  ```ts
  const filtered = useMemo(
    () => {
      const result = filterCatalog(GAME_CATALOG, {
        search,
        level: level as GameLevel | '',
        subject: subject as GameSubject | '',
      });
      return sortByBookmarks(result, bookmarkedIds);
    },
    [search, level, subject, bookmarkedIds],
  );
  ```

  Note: `bookmarkedIds` is a `Set<string>` already returned by `useBookmarks()` — just add it to the dependency array.

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5
  yarn test src/routes/ 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add "src/routes/\$locale/_app/index.tsx"
  git commit -m "feat(catalog): bookmarked games sorted to top of catalog"
  ```

---

## Task 3: Final verification

- [ ] **Step 1: Run full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -10
  ```

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en`:
  1. Note the current order of games in the grid
  2. Bookmark "Number Match" (long-press or bookmark icon)
  3. Page re-renders — "Number Match" now appears first
  4. Apply a filter — bookmarked games still appear first within filtered results
  5. Remove the bookmark — order returns to default
