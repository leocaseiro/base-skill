# Doubled-Consonant Digraph Re-encoding

**Issue:** [#232](https://github.com/leocaseiro/base-skill/issues/232)
**Follow-up:** [#243](https://github.com/leocaseiro/base-skill/issues/243)
**Date:** 2026-04-29

## Problem

Words containing doubled consonants (e.g. `kiss`, `fluffy`, `happy`) are
encoded as a single consonant plus a silent letter (`{g:"s",p:"s"},{g:"s",p:""}`)
instead of a proper digraph (`{g:"ss",p:"s"}`). The corresponding
`GRAPHEMES_BY_LEVEL` entries use placeholder "silent doubled" units that don't
reflect how these sounds are actually taught.

## Scope

- Re-encode 15 words across L2, L4, L6, L7
- Update `GRAPHEMES_BY_LEVEL` to replace placeholder silent entries with digraph
  entries
- Add one genuinely missing word (`chip`) to L6

Out of scope (tracked in #243): missing proper names, L3 review words, full IPA
audit, level assignment review.

## Changes

### GRAPHEMES_BY_LEVEL updates (`src/data/words/levels.ts`)

| Level | Remove                                        | Add                   |
| ----- | --------------------------------------------- | --------------------- |
| L2    | `{ g: 's', p: '', name: 'silent doubled s' }` | `{ g: 'ss', p: 's' }` |
| L4    | `{ g: 'f', p: '', name: 'silent doubled f' }` | `{ g: 'ff', p: 'f' }` |
| L4    | `{ g: 'l', p: '', name: 'silent doubled l' }` | `{ g: 'll', p: 'l' }` |
| L6    | `{ g: 'n', p: '', name: 'silent doubled n' }` | `{ g: 'nn', p: 'n' }` |
| L7    | `{ g: 'd', p: '', name: 'silent doubled d' }` | `{ g: 'dd', p: 'd' }` |
| L7    | `{ g: 'p', p: '', name: 'silent doubled p' }` | `{ g: 'pp', p: 'p' }` |

### Word re-encoding (curriculum JSON files)

Each word changes from `letter + silent letter` to a single digraph entry.

**L2 — `level2.json` (1 word):**

- `kiss`: `[k, i, s, s̲]` → `[k, i, ss]`

**L4 — `level4.json` (4 words):**

- `chess`: `[ch, e, s, s̲]` → `[ch, e, ss]`
- `chill`: `[ch, i, l, l̲]` → `[ch, i, ll]`
- `quoll`: `[qu, o, l, l̲]` → `[qu, o, ll]`
- `whiff`: `[wh, i, f, f̲]` → `[wh, i, ff]`

**L6 — `level6.json` (1 word):**

- `annoy`: `[a, n, n̲, oy]` → `[a, nn, oy]`

**L7 — `level7.json` (9 words):**

- `bunny`: `[b, u, n, n̲, y]` → `[b, u, nn, y]`
- `daddy`: `[d, a, d, d̲, y]` → `[d, a, dd, y]`
- `fluffy`: `[f, l, u, f, f̲, y]` → `[f, l, u, ff, y]`
- `happy`: `[h, a, p, p̲, y]` → `[h, a, pp, y]`
- `jelly`: `[j, e, l, l̲, y]` → `[j, e, ll, y]`
- `puppy`: `[p, u, p, p̲, y]` → `[p, u, pp, y]`
- `recess`: `[r, e, c, e, s, s̲]` → `[r, e, c, e, ss]`
- `silly`: `[s, i, l, l̲, y]` → `[s, i, ll, y]`
- `sunny`: `[s, u, n, n̲, y]` → `[s, u, nn, y]`

### ~~Missing word addition~~

~~Add `chip` to `level6.json`~~ — `chip` already exists in `level4.json` with
correct encoding. The reference list includes it at both L4 and L6; the
curriculum only needs it once. No action needed.

### Unchanged

- All 13 silent magic-e entries (`dance`, `nerve`, `turtle`, etc.) — correct
  as-is
- Split-digraph words at L7 — verified correct
- All other word encodings, test infrastructure, utility functions

## Validation

- `levels-vs-data-invariant.test.ts` — all pairs used in data must be declared
  in cumulative GRAPHEMES_BY_LEVEL
- `curriculum-invariant.test.ts` — cumulative selection yields ≥4 words per
  level, every level unlocks new playable words
- `yarn typecheck` — no type errors
