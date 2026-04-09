# Hover Preview Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix hover previews in slots and bank holes so they render a domino
face (when in dots+group mode) or the correct text label instead of always
showing plain text.

**Tech Stack:** TypeScript, React, Tailwind CSS

**Spec:**
[docs/superpowers/specs/2026-04-10-match-number-improvements-design.md](../specs/2026-04-10-match-number-improvements-design.md)
(Section 4 — Hover Preview Fix)

**Dependency:** Requires the Domino Tile Overhaul
([2026-04-10-domino-tile-overhaul.md](./2026-04-10-domino-tile-overhaul.md))
and Mode Bug Fix + New Modes
([2026-04-10-mode-bugfix-new-modes.md](./2026-04-10-mode-bugfix-new-modes.md))
to be implemented first, since this plan builds on `tilesShowGroup` and the
new `DominoTile` component.

---

## File Map

### New files

_(none)_

### Modified files

- `src/games/number-match/NumberMatch/NumberMatch.tsx` — update slot render
  callback to render domino or text for `previewLabel`
- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` — update bank
  hole hover preview to render domino or text

---

## Steps

- [ ] **Step 1 — Update slot preview rendering in `NumberMatch.tsx`**
  - File: `NumberMatch.tsx`
  - In the `Slot` render callback, handle the `previewLabel` case:
    - When `isPreview && previewLabel !== null`:
      - If `tilesShowGroup && tileStyle === 'dots'`: parse `previewLabel` as
        number, render `<DominoTile value={n} />` at `opacity-50`
      - Otherwise: render `<span>{previewLabel}</span>` at `opacity-50`
  - This requires the `Slot` render callback to receive `previewLabel` and
    `isPreview` in its render props (check `SlotRenderProps` — these are
    already available: `label`, `previewLabel`, `isPreview`)

- [ ] **Step 2 — Update bank hole hover preview in `NumeralTileBank.tsx`**
  - File: `NumeralTileBank.tsx`
  - When a bank hole is the hover target (`isHoverTarget`), the empty hole
    currently renders `tile.label` as plain text
  - Update to check `tilesShowGroup && tileStyle === 'dots'`:
    - If true: render `<DominoTile value={n} />` at `opacity-50` inside the
      hole
    - If false: render `<span>{tile.label}</span>` at `opacity-50` (current
      behavior)

- [ ] **Step 3 — Verify preview sizing**
  - Slot preview: domino preview should fit within the portrait slot
    (`w-[72px] h-[136px]`)
  - Bank hole preview: domino preview should fit within the bank hole
    dimensions
  - Word tile previews: text should fit within `min-w-[80px] h-[80px]` holes
  - Both previews use `opacity-50` for the semi-transparent effect

- [ ] **Step 4 — Test in Storybook**
  - Verify in `NumberMatch` stories:
    - `NumeralToGroup` mode: dragging a domino tile over a slot shows a
      semi-transparent domino preview
    - `GroupToNumeral` mode: dragging a numeral tile shows plain text preview
    - Word modes: dragging a word tile shows the word text as preview
  - Verify in `NumeralTileBank` stories:
    - Returning a tile to bank shows correct preview in the hole

- [ ] **Step 5 — Verify**
  - `yarn typecheck` passes
  - `yarn lint` passes
  - `yarn test` passes
