---
title: Game Tile Auto Font Sizing
date: 2026-04-11
status: approved
---

## Problem

Two related UI defects affect the game answer area and tile bank:

1. **Long numeric labels clip inside fixed-size tiles.** SortNumbers uses a
   56 px tile with `text-2xl` (24 px). NumberMatch uses an 80 px tile with
   `text-3xl` (30 px). Labels longer than 3 digits (e.g. `1000`, `10000`)
   visibly overflow both slots and bank tiles.
2. **Rows wrap to a second line on desktop when slot count is high.** The
   game container is capped at `max-w-2xl` (672 px). Ten 56 px tiles with
   12 px gaps need ≈ 668 px of inner width, which exceeds the cap once
   horizontal padding is subtracted, forcing the row to wrap.

Both issues hurt readability and make the answer area feel broken at common
round configurations.

## Goals

- Every numeric label fits inside its tile without clipping, on both the
  answer row and the tile bank.
- Rows with up to 10 slots render on a single line on desktop.
- Tile sizes never shrink below a touch-friendly floor so young users can
  tap reliably.
- The solution is shared across games that follow the Slot/TileBank
  pattern — today SortNumbers and NumberMatch, with WordSpell unaffected.

## Non-Goals

- No redesign of the Slot or SlotRow drag-and-drop behaviour.
- No changes to NumberMatch word-mode tiles (the existing length-based
  tier already handles those labels).
- No changes to WordSpell letter tiles (letters are always 1 character).
- No responsive breakpoint work beyond what flex-wrap already provides as
  the mobile fallback.

## Approach

Per-tile font-size, driven purely by each tile's own label length. No
container queries, no JS measurement, no row-level coordination. Tiles stay
at their base size; only the font shrinks to fit.

### Why per-tile (not uniform per row)

A uniform per-row font-size looks tidy but makes short labels feel smaller
than they could be whenever a long label is in the mix. Per-tile sizing
maximises each tile individually. The trade-off (mildly uneven visual
rhythm) was accepted during design review.

### Why no container queries

Container queries were considered. Because we commit to keeping tiles at a
fixed base size (touch target floor) and sizing font by the tile's own
label length, neither the tile nor the row needs to know the container's
width. Widening the outer container from `max-w-2xl` to `max-w-4xl` is
enough to fit 10 tiles on a single line at desktop widths; `flex-wrap`
remains as the natural mobile fallback.

## Font-Size Tiers

Two tier tables, one per tile base size. Tiers are discrete Tailwind
classes so the behaviour is easy to reason about and snapshot-test.

### 56 px tile (SortNumbers slots and bank, WordSpell unaffected)

| Label chars | Font size | Tailwind class |
| ----------- | --------- | -------------- |
| 1–3         | 24 px     | `text-2xl`     |
| 4           | 20 px     | `text-xl`      |
| 5           | 16 px     | `text-base`    |
| 6           | 14 px     | `text-sm`      |
| 7+          | 12 px     | `text-xs`      |

### 80 px tile (NumberMatch numeric slots and bank)

| Label chars | Font size | Tailwind class |
| ----------- | --------- | -------------- |
| 1–3         | 30 px     | `text-3xl`     |
| 4           | 24 px     | `text-2xl`     |
| 5           | 20 px     | `text-xl`      |
| 6           | 16 px     | `text-base`    |
| 7+          | 14 px     | `text-sm`      |

The 12 px / 14 px floors keep numerals legible for young readers. The tier
thresholds were chosen against `tabular-nums` glyph width (roughly
`0.55em` per digit) so every tier comfortably fits its char count inside
the tile's content box with normal padding.

## Architecture

### New shared utility

`src/components/answer-game/tile-font.ts`

```ts
export type TileFontBase = 56 | 80;

export const getNumericTileFontClass = (
  labelLength: number,
  base: TileFontBase,
): string => {
  // Pure function. Returns a Tailwind text-* class from the tier table
  // for the given base tile size. See tile-font.test.ts for the full
  // table.
};
```

- Pure function, no React, no DOM.
- Exported alongside a `tile-font.test.ts` that table-tests every tier
  plus edge cases (0, 1, 3, 4, 5, 6, 7, 10 chars) for both base sizes.

### SlotRow and Slot

No changes. `SlotRow` keeps `flex-wrap` so narrow viewports wrap gracefully
once the row exceeds available width. `Slot` continues to receive a
render-prop child from each game, so font sizing stays per call-site.

### Game container widening

Both `SortNumbers.tsx` and `NumberMatch.tsx` change their outer wrapper
from `max-w-2xl` to `max-w-4xl` (672 px → 896 px). This is enough room for
10 × 56 px tiles plus gaps on a single line, and still comfortable for the
question and tile-bank blocks that live inside.

### Per-game call sites

Each game that renders numeric labels imports the utility and uses it at
exactly two places per game — the Slot render-prop child (answer row) and
the tile render inside its TileBank. Hover-preview spans use the same
class so the preview matches the final render.

## File-by-File Changes

1. **New** `src/components/answer-game/tile-font.ts` — utility.
2. **New** `src/components/answer-game/tile-font.test.ts` — unit tests.
3. `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
   - Outer container: `max-w-2xl` → `max-w-4xl`.
   - Slot children: replace `text-2xl` with
     `getNumericTileFontClass(label.length, 56)`.
4. `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`
   - Tile button: replace `text-2xl` with
     `getNumericTileFontClass(tile.label.length, 56)`.
   - Hover-preview span: same replacement.
5. `src/games/number-match/NumberMatch/NumberMatch.tsx`
   - Outer container: `max-w-2xl` → `max-w-4xl`.
   - Numeric slot children: replace `text-3xl` with
     `getNumericTileFontClass(label.length, 80)`.
   - Numeric preview span: same replacement.
6. `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`
   - Numeric tile branch: replace `text-3xl` with
     `getNumericTileFontClass(tile.label.length, 80)`.
   - Numeric hover-preview span: same replacement.

Not touched: `SlotRow.tsx`, `Slot.tsx`, all WordSpell files, NumberMatch
word-mode branches (existing length-based tier stays), NumberMatch
dots/domino branches.

## Testing Strategy

### Unit

`tile-font.test.ts` covers:

- Every tier threshold for base 56 (chars 1, 2, 3, 4, 5, 6, 7, 10).
- Every tier threshold for base 80 (chars 1, 2, 3, 4, 5, 6, 7, 10).
- Edge case: `labelLength === 0` returns the 1–3 char class (safe default).

### Storybook

Add long-label stories to `SortNumbers.stories.tsx` and
`NumberMatch.stories.tsx` so the interaction test suite exercises the new
font tiers:

- SortNumbers: round with sequence `1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000` (ten slots, mixed 4- and 5-digit labels).
- NumberMatch: round with numeral mode and `value = 10002` plus
  5-digit distractors.

### Visual regression

VR baselines on the updated stories must be refreshed via
`yarn test:vr:update` after implementation. Record the baseline update in
the commit that introduces it.

### Manual

Start Storybook, eyeball the new long-label stories, and walk through
both games in the dev server with a long-label config before pushing.
Document the manual check in the PR description.

## Risks and Mitigations

- **Max-width change affects question/choices layout.** The outer wrapper
  widens from 672 → 896 px. Question text and tile bank blocks will have
  more horizontal room. Mitigation: visual regression tests on existing
  stories will flag any unacceptable layout shift; adjust per-block
  `max-w-*` constraints inside the wrapper if needed.
- **Mobile wrap still happens.** On viewports narrower than roughly
  380 px, 10-tile rows will wrap to two lines via `flex-wrap`. This is
  the accepted last-resort fallback, chosen over shrinking tiles below
  the touch-target floor.
- **Tier thresholds may need tuning.** The tier table is a best estimate
  from `tabular-nums` glyph widths; an unexpected font metric could push
  a label over its tile. Mitigation: the utility is a single pure
  function, so adjustments are one-line changes backed by unit tests.

## Rollout

Single PR targeting `master`. No feature flag, no staged rollout — the
change is purely presentational and covered by unit, Storybook, and VR
tests.
