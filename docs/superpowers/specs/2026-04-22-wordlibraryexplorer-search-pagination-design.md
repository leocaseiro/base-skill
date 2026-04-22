# WordLibraryExplorer — Search and Pagination

**Date:** 2026-04-22
**Status:** Draft (brainstorming output)
**Scope:** `src/data/words/WordLibraryExplorer.tsx` and its tests

## Problem

`WordLibraryExplorer` is the Storybook playground for the word library
(`/story/data-wordlibraryexplorer--default`). Today it:

- Hard-caps the results list at the first `SHOW_LIMIT = 100` hits. Anything past
  the 100th word is invisible, even when the current filter set has thousands
  of matches.
- Provides no way to look up a specific word by typing it. Users must narrow
  results via levels, syllables, or grapheme/phoneme filters, which is awkward
  for the simple "does the library contain `cat`?" use case.

This spec adds a word-search field and numbered pagination so every filtered
hit is reachable.

## Goals

- Let users find a word by typing its opening letters.
- Let users browse past the first 100 results without changing filters.
- Keep the core `WordFilter` API and `filterWords` signature unchanged.

## Non-goals

- Fuzzy / typo-tolerant search.
- Highlighting matched substrings in the result cards.
- URL-syncing search state or page number.
- Server-side pagination (the dataset is fully client-side).
- New stories — the existing `Default` story exercises the feature.

## Design

### Search

- Add a text input at the top of the Filters card, labeled **"Word search"**,
  placeholder `Starts with…`.
- Local state `wordPrefix: string` on `WordLibraryExplorer`. Empty string means
  "no filter".
- Applied as a **client-side post-filter** after `filterWords` resolves,
  combined with the existing `graphemePairs` post-filter. This matches the
  pattern already used in the same file for `graphemePairs`, which the
  component comment calls out as "`WordFilter` API does not support (g,p)
  tuples yet, so we apply it after filterWords resolves."
- Match rule: `hit.word.toLowerCase().startsWith(wordPrefix.trim().toLowerCase())`.
- Reason for prefix (not substring): the user explicitly chose dictionary-style
  prefix matching during brainstorming.

### Pagination

- Remove the `SHOW_LIMIT = 100` hard cap.
- Add two new pieces of state:
  - `page: number`, 1-indexed, default `1`.
  - `pageSize: number`, one of `25 | 50 | 100`, default `50`.
- Derive `totalPages = Math.max(1, Math.ceil(postFiltered.length / pageSize))`.
- `visible = postFiltered.slice((page - 1) * pageSize, page * pageSize)`.
- Reset `page` to `1` whenever any of the following change: `filter`,
  `graphemePairs`, `wordPrefix`, `pageSize`. A single `useEffect` with those
  dependencies is sufficient.
- Clamp `page` to `[1, totalPages]` when `postFiltered` shrinks below the
  current page's first index.

### Pagination UI

Rendered above the results grid, replacing the current "Showing X of Y"
single-line counter.

- Left block: `Showing START–END of TOTAL (filtered from N)` where `START =
(page - 1) * pageSize + 1` (or `0` when `TOTAL === 0`) and `END = min(page *
pageSize, TOTAL)`.
- Right block, inline on md+ screens, wrapped below on small screens:
  - **Prev** button (disabled on `page === 1`).
  - Numbered page buttons. When `totalPages <= 7`, show all. Otherwise show:
    first page, `…` (if gap), a window of two pages on either side of the
    current page, `…` (if gap), last page. Current page is visually
    highlighted (e.g. `bg-primary text-primary-foreground`).
  - **Next** button (disabled on `page === totalPages`).
  - `Select` for page size, options `25`, `50`, `100`.

### Files touched

- `src/data/words/WordLibraryExplorer.tsx`:
  - New `WordSearchField` component rendered at the top of the Filters card.
  - New `Pagination` component rendered above the results grid.
  - New state: `wordPrefix`, `page`, `pageSize`.
  - Extend the `postFiltered` memo to apply the prefix filter before the
    grapheme-pairs filter.
  - Replace the `slice(0, SHOW_LIMIT)` with the page-based slice.
  - Remove `SHOW_LIMIT` constant.
- `src/data/words/WordLibraryExplorer.test.ts`:
  - Extract a pure helper `matchesWordPrefix(hit, prefix)` (or inline test on
    the same rule) and cover:
    - empty / whitespace prefix → all hits pass.
    - case-insensitive prefix match.
    - non-matching prefix → no hits pass.
  - Extract a pure helper `paginate(items, page, pageSize)` and cover:
    - first page slice, middle page slice, last (partial) page slice.
    - page past end returns empty slice.
    - `pageSize` larger than total returns the whole list.

No changes to `WordFilter`, `filterWords`, `types.ts`, or any other consumer.

## Error handling and edge cases

- `postFiltered` is empty → `Showing 0–0 of 0`, pagination controls hidden (or
  disabled), grid shows nothing.
- `wordPrefix` is only whitespace → treated as empty.
- `page` is out of range after a filter change → clamped to `totalPages` by
  the reset effect.
- Large result sets: prefix check on `word.toLowerCase()` once per hit per
  render is cheap for the current library size; no memoization indexing
  needed.

## Testing

Unit tests (`WordLibraryExplorer.test.ts`, Vitest):

- Prefix match is case-insensitive, trims whitespace, and empty = pass-through.
- Pagination helper returns correct slices for first/middle/last/out-of-range
  pages.

No new Storybook stories, VR snapshots, or e2e tests. The existing `Default`
story continues to render the component and manual verification in Storybook
exercises the new controls.

## Rollout

Single PR on branch `bold-meitner-9c8ee4` (already created). No migration,
no feature flag, no data changes.

## Open questions

None.
