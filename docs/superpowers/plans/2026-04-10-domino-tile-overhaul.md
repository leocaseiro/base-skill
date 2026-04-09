# Domino Tile Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all `dots`-style tiles into a single vertical domino shape,
replace the current `DiceFace`/`DominoTile` split with a single `DominoTile`
component, update the `DOMINO_SPLIT` map for young-reader-friendly splits,
and remove `allDice` branching logic.

**Tech Stack:** TypeScript, React, Tailwind CSS

**Spec:**
[docs/superpowers/specs/2026-04-10-match-number-improvements-design.md](../specs/2026-04-10-match-number-improvements-design.md)
(Section 1 — Domino Tile Overhaul)

---

## File Map

### New files

_(none)_

### Modified files

- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` — rewrite
  `DominoTile` as a vertical layout, make `DiceFace` internal-only, update
  `DOMINO_SPLIT` map, unify tile sizing, remove `getIsDomino` branching
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — remove `allDice`
  branching, unify slot sizing for dots mode, update slot render callback to
  always use `DominoTile`

---

## Steps

- [ ] **Step 1 — Update `DOMINO_SPLIT` map**
  - File: `NumeralTileBank.tsx`
  - Replace the existing `DOMINO_SPLIT` with the new young-reader-friendly map
    (top/bottom, smaller value on top):

    | Value | Top | Bottom |
    | ----- | --- | ------ |
    | 1     | 1   | 0      |
    | 2     | 2   | 0      |
    | 3     | 3   | 0      |
    | 4     | 4   | 0      |
    | 5     | 5   | 0      |
    | 6     | 6   | 0      |
    | 7     | 2   | 5      |
    | 8     | 4   | 4      |
    | 9     | 4   | 5      |
    | 10    | 5   | 5      |
    | 11    | 5   | 6      |
    | 12    | 6   | 6      |

  - Keys 1-6 now have a bottom value of `0` (blank half)

- [ ] **Step 2 — Rewrite `DominoTile` to vertical orientation**
  - File: `NumeralTileBank.tsx`
  - Change layout from horizontal (`flex items-center`) to vertical
    (`flex flex-col items-center`)
  - Render top `DiceFace`, then a horizontal divider line, then bottom
    `DiceFace`
  - Divider: `<span className="h-px w-11 shrink-0 bg-current opacity-30" />`
  - Padding: `py-3` between pip grids and divider
  - Bottom value of `0` renders a blank half (empty `DiceFace` or empty space)
  - All tiles: `w-[72px] h-[136px]` (tall rectangle)

- [ ] **Step 3 — Make `DiceFace` internal, stop exporting it**
  - File: `NumeralTileBank.tsx`
  - Remove `DiceFace` from named exports
  - `DiceFace` stays as a private helper inside the file (renders one half of
    a domino)
  - Handle value `0` in `DiceFace` — render an empty 3x3 grid (no pips)

- [ ] **Step 4 — Remove `getIsDomino` helper and `allDice` branching in
      `NumeralTileBank`**
  - File: `NumeralTileBank.tsx`
  - Delete the `getIsDomino` function
  - When `tileStyle === 'dots'`, always use the same domino dimensions
    (`w-[72px] h-[136px]`) for tiles and holes regardless of value
  - Remove conditional sizing (`isDomino ? 'h-[72px] w-32' : 'size-20'`)
  - All tiles in dots mode render via `DominoTile`

- [ ] **Step 5 — Remove `allDice` branching in `NumberMatch.tsx`**
  - File: `NumberMatch.tsx`
  - Remove the `allDice` computed boolean and its slot class logic
  - When dots mode is active, all slots use portrait dimensions:
    `w-[72px] h-[136px] rounded-2xl`
  - Update slot render callback to always use `<DominoTile value={n} />`
    instead of branching on `n <= 6` vs `n > 6`

- [ ] **Step 6 — Update imports**
  - File: `NumberMatch.tsx`
  - Remove `DiceFace` import (no longer exported)
  - Keep `DominoTile` import

- [ ] **Step 7 — Verify**
  - `yarn typecheck` passes
  - `yarn lint` passes
  - `yarn test` passes (existing tests in
    `NumeralTileBank.test.tsx` and `NumberMatch.test.tsx`)
  - Storybook stories render correctly with uniform vertical tiles
