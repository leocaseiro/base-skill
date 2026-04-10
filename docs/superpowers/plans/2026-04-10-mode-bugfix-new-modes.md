# Mode Bug Fix + New Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `group-to-numeral` rendering bug, introduce the
`tilesShowGroup` gate, expand the mode type to 8 variants, add word/ordinal
tile rendering, and update slot/bank sizing to match.

**Tech Stack:** TypeScript, React, Tailwind CSS

**Spec:**
[docs/superpowers/specs/2026-04-10-match-number-improvements-design.md](../specs/2026-04-10-match-number-improvements-design.md)
(Section 2 — Mode Bug Fix + New Modes, excluding the number-words utility)

**Dependency:** The `number-words.ts` utility must be implemented first (see
[2026-04-10-number-words-utility.md](./2026-04-10-number-words-utility.md)).

---

## File Map

### New files

_(none)_

### Modified files

- `src/games/number-match/types.ts` — expand `NumberMatchMode` to 8 variants,
  update `NumberMatchConfig` field
- `src/games/number-match/build-numeral-round.ts` — generate display labels
  for word/ordinal modes using the number-words utility
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — add `tilesShowGroup`
  gate, update slot dimensions, update rendering logic for word tiles
- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` — accept
  `tilesShowGroup` prop, gate domino rendering, update NumeralTile to render
  word tiles
- `src/games/number-match/NumberMatch/NumberMatch.stories.tsx` — add stories
  for all 8 modes
- `src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx` —
  update stories for new tile types

---

## Steps

- [ ] **Step 1 — Expand `NumberMatchMode` type**
  - File: `types.ts`
  - Replace the current mode union with all 8 variants:

    ```typescript
    type NumberMatchMode =
      | 'numeral-to-group'
      | 'group-to-numeral'
      | 'cardinal-number-to-text'
      | 'cardinal-text-to-number'
      | 'ordinal-number-to-text'
      | 'ordinal-text-to-number'
      | 'cardinal-to-ordinal'
      | 'ordinal-to-cardinal';
    ```

  - Remove old `'numeral-to-word'` and `'word-to-numeral'` variants

- [ ] **Step 2 — Add `tilesShowGroup` gate in `NumberMatch.tsx`**
  - File: `NumberMatch.tsx`
  - Derive `tilesShowGroup`:
    `const tilesShowGroup = config.mode === 'numeral-to-group';`
  - Pass `tilesShowGroup` as a prop to `NumeralTileBank`
  - Domino rendering only applies when
    `tilesShowGroup && config.tileStyle === 'dots'`

- [ ] **Step 3 — Update slot dimensions**
  - File: `NumberMatch.tsx`
  - Slot sizing logic:
    - `tilesShowGroup && tileStyle === 'dots'` -> portrait
      `w-[72px] h-[136px] rounded-2xl`
    - All other modes -> square `size-20 rounded-2xl`

- [ ] **Step 4 — Update slot render callback**
  - File: `NumberMatch.tsx`
  - When `tilesShowGroup && tileStyle === 'dots'` -> render
    `<DominoTile value={n} />`
  - When mode is a word/ordinal mode -> render text label from tile
  - Otherwise -> render plain numeral text

- [ ] **Step 5 — Update question rendering for new modes**
  - File: `NumberMatch.tsx`
  - `group-to-numeral` -> `<DotGroupQuestion>`
  - `numeral-to-group` -> `<TextQuestion>` (shows numeral)
  - Cardinal/ordinal modes -> `<TextQuestion>` showing the appropriate
    question text:
    - `cardinal-number-to-text`: show numeral (e.g. "7")
    - `cardinal-text-to-number`: show cardinal word (e.g. "seven")
    - `ordinal-number-to-text`: show ordinal number (e.g. "7th")
    - `ordinal-text-to-number`: show ordinal word (e.g. "seventh")
    - `cardinal-to-ordinal`: show cardinal word (e.g. "seven")
    - `ordinal-to-cardinal`: show ordinal word (e.g. "seventh")
  - Use `toCardinalText`, `toOrdinalText`, `toOrdinalNumber` from
    `number-words.ts` for conversions
  - Locale from `useParams({ from: '/$locale' })`

- [ ] **Step 6 — Accept `tilesShowGroup` prop in `NumeralTileBank`**
  - File: `NumeralTileBank.tsx`
  - Add `tilesShowGroup: boolean` to props
  - Gate domino rendering: only render `DominoTile` when
    `tilesShowGroup && tileStyle === 'dots'`
  - When `!tilesShowGroup`: render plain text tile (numeral or word)
  - Tile sizing: portrait for dots+group, square otherwise

- [ ] **Step 7 — Add word tile UI in `NumeralTile`**
  - File: `NumeralTileBank.tsx`
  - Word tiles: square with `min-w-[80px] h-[80px]`
  - Font size scales down for longer words (e.g. `text-sm` for > 6 chars)
  - Long words with hyphens break across two lines (`hyphens-auto`)
  - Slots and bank holes use matching `min-w-[80px]`

- [ ] **Step 8 — Update `build-numeral-round.ts` for word labels**
  - File: `build-numeral-round.ts`
  - Accept `mode` and `locale` parameters
  - Generate tile labels based on mode:
    - `numeral-to-group` / `group-to-numeral`: numeric labels (current)
    - `cardinal-number-to-text`: answer tiles show cardinal words
    - `cardinal-text-to-number`: answer tiles show numerals
    - `ordinal-number-to-text`: answer tiles show ordinal words
    - `ordinal-text-to-number`: answer tiles show numerals with ordinal suffix
    - `cardinal-to-ordinal`: answer tiles show ordinal words
    - `ordinal-to-cardinal`: answer tiles show cardinal words
  - Matching always compares underlying numeric `value`, not text

- [ ] **Step 9 — Update stories**
  - File: `NumberMatch.stories.tsx`
  - Add stories for all 8 modes: `NumeralToGroup`, `GroupToNumeral`,
    `CardinalNumberToText`, `CardinalTextToNumber`, `OrdinalNumberToText`,
    `OrdinalTextToNumber`, `CardinalToOrdinal`, `OrdinalToCardinal`
  - File: `NumeralTileBank.stories.tsx`
  - Add story for word-style tiles

- [ ] **Step 10 — Verify**
  - `yarn typecheck` passes
  - `yarn lint` passes
  - `yarn test` passes
  - All 8 mode stories render correctly in Storybook
