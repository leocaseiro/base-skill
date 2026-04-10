# MatchNumber Game Improvements Design

## Overview

Five improvements to the MatchNumber game targeting young readers and fixing
existing mode bugs.

## 1. Domino Tile Overhaul (Uniform Size + Vertical Orientation + Simpler Splits)

### Problem

- Dice tiles (1–6) are square 80×80, domino tiles (7–12) are wide rectangles
  128×72 — inconsistent sizing
- Dominoes render horizontally (left/right halves) — unnatural for a domino
- Splits are not optimised for young readers (e.g. 10 = 6+4 instead of 5+5)
- Pips are too close to the divider line

### Solution

Unify all `dots`-style tiles into a single vertical domino shape.

**New `DOMINO_SPLIT` map (top/bottom, smaller value on top):**

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

A bottom value of `0` means blank half (no pips).

**Component changes:**

- Replace separate `DiceFace`/`DominoTile` exports with a single `DominoTile`
  component that always renders vertically
- `DiceFace` becomes internal-only (renders one half of the domino)
- All tiles: `w-[72px] h-[136px]` (tall rectangle)
- Horizontal divider line, shorter than tile width (`w-11`), `opacity-30`
- Generous padding (`py-3`) between pip grids and divider
- Remove `allDice` branching logic in `NumberMatch.tsx` and
  `NumeralTileBank.tsx` — when `tileStyle === 'dots'`, every tile/slot/hole
  uses the same domino dimensions

## 2. Mode Bug Fix + New Modes

### Problem

- `group-to-numeral`: tiles render as dominoes instead of plain numerals
- `numeral-to-word` / `word-to-numeral`: tiles show plain numbers, no word
  conversion exists
- `tileStyle` options `objects` and `fingers` are stubs (fall through to numeral
  text) — keep them as stubs for future work

### Solution

**Rendering gate:** Introduce a derived boolean `tilesShowGroup` that is `true`
only when `mode === 'numeral-to-group'`. Domino rendering only applies when
`tilesShowGroup && tileStyle === 'dots'`.

This boolean gates rendering in three places:

1. `NumeralTile` component
2. `Slot` render callback in `NumberMatch.tsx`
3. Bank hole hover preview

`NumeralTileBank` receives a new prop `tilesShowGroup: boolean`.

**Slot dimensions:**

- `tilesShowGroup && tileStyle === 'dots'` → portrait `w-[72px] h-[136px]`
- All other modes → square `size-20`

**8 game modes:**

| Mode                      | Question  | Answer    | Conversion   |
| ------------------------- | --------- | --------- | ------------ |
| `numeral-to-group`        | 7         | Domino    | —            |
| `group-to-numeral`        | Dots      | 7         | —            |
| `cardinal-number-to-text` | 7         | "seven"   | `toCardinal` |
| `cardinal-text-to-number` | "seven"   | 7         | `toCardinal` |
| `ordinal-number-to-text`  | "7th"     | "seventh" | `toOrdinal`  |
| `ordinal-text-to-number`  | "seventh" | "7th"     | `toOrdinal`  |
| `cardinal-to-ordinal`     | "seven"   | "seventh" | both         |
| `ordinal-to-cardinal`     | "seventh" | "seven"   | both         |

**Dependency:** `n2words` (only) — tree-shakeable per-locale imports, i18n, zero
deps. Provides `toCardinal` and `toOrdinal` per locale. No additional ordinal
suffix packages needed — the numeric ordinal format ("7th" / "7º") is trivial
inline logic.

**Utility module:** `src/games/number-match/number-words.ts`

- `toCardinalText(n, locale)` → `"seven"` / `"sete"` — wraps
  `n2words/<locale>.toCardinal`
- `toOrdinalText(n, locale)` → `"seventh"` / `"sétimo"` — wraps
  `n2words/<locale>.toOrdinal`
- `toOrdinalNumber(n, locale)` → `"7th"` / `"7º"` — inline suffix logic
  (English: 1st/2nd/3rd/Nth; Portuguese: always `º`)
- Locale map: `'en'` → `n2words/en-AU`, `'pt-BR'` → `n2words/pt-PT`

**Data flow:** Rounds are always generated with numeric values. At render time,
the utility converts to display strings based on the mode. Matching logic always
compares the underlying numeric `value`, never text strings.

**Locale:** Sourced from the existing `useParams({ from: '/$locale' })` router
param (`'en'` | `'pt-BR'`). The utility maps app locales to `n2words` locale
imports.

**Word tile UI:**

- Square tiles with `min-width: 80px`, height 80px
- Font size scales down for longer words
- Long words break at hyphens across two lines
- Slots and bank holes match using `min-width`

### Types update

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

## 3. Countable Dots on DotGroupQuestion

### Problem

Young kids need to count dots but have no way to track which dots they have
already counted.

### Solution

Each dot in `DotGroupQuestion` becomes individually tappable:

- Tap an unnumbered dot → assigns the next increment (1, 2, 3...)
- The number appears centered on the dot
- Each tap triggers TTS speaking the cardinal word ("one", "two", "three"...)
- Already-tapped dots do nothing on re-tap (no toggle)
- Counts auto-reset when `count` changes (next round)
- Order does not matter — kids can tap dots in any sequence
- TTS for the whole question area stays on the existing `AudioButton`

**State:** Local `useState` inside `DotGroupQuestion` — array of
`(number | null)` per dot, tracking assigned count values. A `nextCount` ref
tracks the next number to assign.

**Rendering:** Each dot changes from a plain `<span>` to a `<button>`. When
tapped, the dot shows a white number centered on the primary-colored circle.

## 4. Hover Preview Fix

### Problem

When dragging a tile over a slot or bank hole, the preview shows plain text
label (e.g. "7") instead of the domino face.

### Solution

The hover preview renders the same visual as the tile:

- Domino face when `tilesShowGroup && tileStyle === 'dots'`
- Plain text otherwise

Affected locations:

1. **Slot preview** — the `Slot` render callback uses `previewLabel` to render
   a domino or text
2. **Bank hole preview** — the empty hole in `NumeralTileBank` renders domino or
   text during hover

Both reuse the existing `DominoTile` / `DiceFace` components.

## Files Affected

- `src/games/number-match/types.ts` — mode type expansion, config field options
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — rendering logic,
  slot sizing, mode gating
- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` — domino
  overhaul, tile rendering, hover preview, `tilesShowGroup` prop
- `src/games/number-match/number-words.ts` — number↔text conversion utility
  wrapping `n2words`
- `src/games/number-match/number-words.test.ts` — unit tests for the utility
- `src/games/number-match/build-numeral-round.ts` — label generation for
  word/ordinal modes
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — countable
  dots, per-dot tap, TTS
- `src/games/number-match/NumberMatch/NumberMatch.stories.tsx` — new stories
  for all modes
- `src/games/number-match/NumeralTileBank/NumeralTileBank.stories.tsx` — updated
  stories
- `package.json` — add `n2words` dependency

## Out of Scope

- `objects` and `fingers` tile styles — kept as stubs
- Drag preview ghost image (the floating tile during drag) — separate concern
