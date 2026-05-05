---
title: 'feat: Confusable characters data layer + SpotAll game'
type: feat
status: active
date: 2026-04-30
origin: docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md
---

## Overview

Add a reusable confusable-character data layer (static JSON with query utilities) and a new game called SpotAll where children identify correct characters from a grid of visually confusable tiles. SpotAll uses a "tap all correct" mechanic distinct from the existing drag-to-slot AnswerGame system.

---

## Problem Frame

Young children frequently confuse visually similar characters — writing `b` as `d`, mixing up `3` and `E`, reversing `p`/`q`, or transposing sequences like `15`/`51`. Existing BaseSkill games (WordSpell, NumberMatch, SortNumbers) don't target visual discrimination directly. This plan delivers a standalone data layer for confusable characters and the first game (SpotAll) that exercises this skill. (see origin: `docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md`)

---

## Requirements Trace

- R1. Confusable-sets data structure storing groups of confusable characters/sequences
- R2. Pairwise relationship metadata (mirror-horizontal, mirror-vertical, rotation-180, visual-similarity, transposition)
- R3. Sets with any number of members including multi-character sequences
- R4. Query by character with optional relationship-type filter
- R5. Curated initial dataset for early learners
- R5b. Separate "reversible characters" list for characters commonly written backwards (same character, CSS-flipped — e.g. backwards 6, backwards 2)
- R6. SpotAll presents a prompt + grid of character tiles
- R7. Grid has correct tiles + distractor tiles from two sources: confusable characters (different chars) and/or reversed target character (same char, CSS-flipped)
- R8. Correct tiles vary in visual style (font, size, color) to force shape recognition
- R9. Child taps/selects all correct tiles; game validates on submission
- R10. Distractor tiles rendered via CSS transforms or as visually similar characters
- R11. Preset game configurations (set + difficulty bundles)
- R12. Presets reusable by future games

---

## Scope Boundaries

- Existing game integration (WordSpell, NumberMatch distractor injection) is deferred — the data layer supports it but no wiring in v1
- "Find the imposter" mode is already covered by NumberMatch
- "Sort into buckets" mode is out of scope (overlaps with issue #228)
- Automatic difficulty progression deferred to a later pass
- SVG/image-based rendering deferred — v1 uses CSS transforms on text

### Deferred to Follow-Up Work

- WordSpell/NumberMatch integration with confusable distractors: separate PR once data layer is proven
- Additional game modes for SpotAll (imposter, sorting): separate issue

---

## Context & Research

### Relevant Code and Patterns

- `src/games/registry.ts` — `GAME_CATALOG` array with `{id, titleKey, descriptionKey, levels, subject, defaultCover}`
- `src/games/config-fields-registry.tsx` — maps gameId to config field definitions
- `src/routes/$locale/_app/game/$gameId.tsx` — `GameBody` switch dispatches to game-specific body components
- `src/components/answer-game/types.ts` — `TileItem {id, label, value}`, `AnswerZone`, `AnswerGameConfig`
- `src/games/number-match/build-numeral-round.ts` — `pickDistractorNumerals()` pattern for generating wrong answers
- `src/data/words/core/level1.json` — static JSON data pattern (simple objects, imported at build time)
- `src/components/answer-game/answer-game-reducer.ts` — slot-based state machine (NOT suitable for tap-to-select)
- `src/lib/game-engine/` — `GameEngineProvider` for outer lifecycle, scoring, session recording (reusable)
- `src/components/game/GameShell` — wraps games with engine provider

### Key Insight: AnswerGame Is Not Suitable for SpotAll

The existing `AnswerGameProvider` + `answerGameReducer` is purpose-built for drag-to-slot interactions: tiles have `value` matched against `AnswerZone.expectedValue`, input methods are `drag | type | both`, and state tracks `activeSlotIndex`, `dragActiveTileId`, etc.

SpotAll's "tap all correct from a grid" mechanic is fundamentally different:

- No slots/zones — tiles are selected in-place
- Multi-select (many correct tiles, not one-per-zone)
- No drag — tap/click toggle
- Completion = all correct found (not all slots filled)

SpotAll will create its own lightweight reducer while reusing `GameShell`/`GameEngineProvider` for the outer game lifecycle.

---

## Key Technical Decisions

- **SpotAll has its own state management:** A `spotAllReducer` handles tile selection, validation, and round completion. Does NOT use `AnswerGameProvider`. Rationale: the tap-multi-select pattern doesn't map to the drag-to-slot paradigm.
- **SpotAll reuses GameShell/GameEngineProvider:** For rounds, scoring, session recording, and the outer game chrome (HUD, instructions overlay, game-over). Rationale: avoid duplicating lifecycle management.
- **Confusable data is static JSON:** Similar to word lists in `src/data/words/`. Loaded at build time, no runtime fetching. Rationale: dataset is small (10-20 families), stable, and doesn't need dynamic updates.
- **Two distractor data sources:** Confusable sets (different characters) and reversible characters (same character flipped). Kept separate because "6 confused with itself mirrored" is a fundamentally different concept from "6 confused with 9". The round builder draws from both.
- **CSS transforms for mirror/rotation:** `scaleX(-1)` for horizontal mirror, `scaleY(-1)` for vertical mirror, `rotate(180deg)` for rotation. Applied at the character level inside a tile. Rationale: simple, no extra assets needed, works with any font.
- **Visual variation on correct tiles:** Randomly assigned inline styles (font-family, font-size, color) per correct tile at round-build time. Rationale: prevents pixel-matching without changing the character shape.
- **Validation on submit:** Child selects tiles freely, then taps a "Check" button. Rationale: allows self-correction before committing, reduces frustration from accidental taps, and is the simplest model for v1.

---

## Open Questions

### Resolved During Planning

- **Should SpotAll use AnswerGameProvider?** No — the interaction model is fundamentally different (tap-multi-select vs drag-to-slot). Own reducer needed.
- **Where does confusable data live?** `src/data/confusables/` — follows the `src/data/words/` pattern of static JSON with TypeScript query utilities.
- **Feedback model (R9)?** Validate on submit (child taps "Check" button). Simplest, least frustrating, allows self-correction.
- **CSS transforms at what level (R10)?** Character level (`<span>` inside tile). The tile frame stays upright; only the character content is transformed. This keeps the tile visually consistent in the grid.

### Deferred to Implementation

- Exact visual variation parameters (which fonts, size range, color palette) — best determined by seeing them rendered
- Whether `GameEngineProvider` needs any adapter for the tap-select model or if it works unchanged
- Exact number of initial confusable families in v1 dataset — author as many as practical

---

## High-Level Technical Design

> _This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce._

```
DATA LAYER
┌─────────────────────────────────────────────────────┐
│ src/data/confusables/                               │
│   confusable-sets.json      ← groups of different   │
│                                confusable chars      │
│   reversible-characters.json← chars commonly written│
│                                backwards (self-flip) │
│   types.ts                  ← ConfusableSet,        │
│                                ReversibleCharacter   │
│   query.ts                  ← getConfusablesFor(),  │
│                                getReversalTransform()│
└─────────────────────────────────────────────────────┘
         │
         ▼ (imported by)
ROUND BUILDER
┌─────────────────────────────────────────────────────┐
│ src/games/spot-all/                                 │
│   build-spot-all-round.ts                           │
│     → picks target character                        │
│     → queries confusable sets (different chars)     │
│     → queries reversible list (same char flipped)   │
│     → assigns visual variation to correct tiles     │
│     → assigns CSS transforms to distractor tiles    │
│     → returns SpotAllRound {tiles[], target}        │
└─────────────────────────────────────────────────────┘
         │
         ▼ (fed into)
GAME STATE
┌─────────────────────────────────────────────────────┐
│ spot-all-reducer.ts                                 │
│   State: tiles[], selectedIds[], phase, roundIndex  │
│   Actions: SELECT_TILE, DESELECT_TILE, SUBMIT,      │
│            ADVANCE_ROUND, COMPLETE_GAME             │
│   On SUBMIT: compare selectedIds vs correctIds     │
│     → all correct + no extras = round-complete     │
│     → else = show feedback, allow retry            │
└─────────────────────────────────────────────────────┘
         │
         ▼ (renders)
COMPONENTS
┌─────────────────────────────────────────────────────┐
│ SpotAll.tsx ← main game, wraps in GameShell         │
│ SpotAllGrid.tsx ← renders tile grid                 │
│ SpotAllTile.tsx ← single tile with transforms/style │
│ SpotAllPrompt.tsx ← "Select all the d tiles"        │
└─────────────────────────────────────────────────────┘
```

---

## Output Structure

```
src/data/confusables/
├── confusable-sets.json
├── reversible-characters.json
├── types.ts
├── query.ts
└── query.test.ts

src/games/spot-all/
├── types.ts
├── build-spot-all-round.ts
├── build-spot-all-round.test.ts
├── spot-all-reducer.ts
├── spot-all-reducer.test.ts
├── resolve-simple-config.ts
├── SpotAll/
│   └── SpotAll.tsx
├── SpotAllGrid/
│   └── SpotAllGrid.tsx
├── SpotAllTile/
│   └── SpotAllTile.tsx
├── SpotAllPrompt/
│   └── SpotAllPrompt.tsx
└── SpotAllConfigForm/
    └── SpotAllConfigForm.tsx
```

---

## Implementation Units

- [ ] U1. **Confusable sets data types and initial dataset**

**Goal:** Create the confusable-sets data structure and reversible-characters list with TypeScript types and initial curated JSON datasets.

**Requirements:** R1, R2, R3, R5, R5b

**Dependencies:** None

**Files:**

- Create: `src/data/confusables/types.ts`
- Create: `src/data/confusables/confusable-sets.json`
- Create: `src/data/confusables/reversible-characters.json`

**Approach:**

- Define `ConfusableSet` type: `{id, name, members: string[], relationships: {pair: [string, string], type: RelationshipType}[]}`
- Define `RelationshipType` union: `'mirror-horizontal' | 'mirror-vertical' | 'rotation-180' | 'visual-similarity' | 'transposition'`
- Define `ReversibleCharacter` type: `{char: string, transform: 'mirror-horizontal' | 'mirror-vertical' | 'rotation-180'}` — characters commonly written backwards by children
- Author confusable-sets dataset covering: `{b,d,p,q}`, `{I,l,1}`, `{6,9}`, `{3,E}`, `{m,w}`, `{n,u}`, `{S,5}`, `{O,0}`, `{15,51}`, `{oa,ao}`
- Author reversible-characters dataset: `6`, `2`, `3`, `5`, `7`, `J`, `S`, `Z` (all `mirror-horizontal`)
- Export typed constants from the JSON files

**Patterns to follow:**

- `src/data/words/core/level1.json` — static JSON data authored by hand
- TypeScript `as const satisfies` for type-safe JSON imports

**Test scenarios:**

- Test expectation: none — pure data/type definitions with no runtime logic

**Verification:**

- Types compile without error
- JSON validates against the TypeScript types
- Confusable-sets dataset covers at least 8 families spanning all 5 relationship types
- Reversible-characters dataset covers at least 6 commonly reversed characters

---

- [ ] U2. **Confusable query utility**

**Goal:** Create a query module that games can use to look up confusable characters and reversible characters by input.

**Requirements:** R4, R5b

**Dependencies:** U1

**Files:**

- Create: `src/data/confusables/query.ts`
- Create: `src/data/confusables/query.test.ts`

**Approach:**

- `getConfusablesFor(member: string, options?: {type?: RelationshipType}): string[]` — returns all characters confusable with `member`, optionally filtered
- `getConfusableSet(setId: string): ConfusableSet | undefined` — direct set lookup
- `getAllSets(): ConfusableSet[]` — full dataset access
- `getReversalTransform(char: string): ReversibleCharacter | undefined` — returns the transform for a commonly reversed character, or undefined if not reversible
- `isReversible(char: string): boolean` — quick check if a character is commonly written backwards
- Build an index on first call (member → sets containing it) for fast lookup

**Patterns to follow:**

- `src/games/number-match/build-numeral-round.ts` `pickDistractorNumerals` — simple utility with clear input/output

**Test scenarios:**

- Happy path: `getConfusablesFor('b')` returns `['d', 'p', 'q']`
- Happy path: `getConfusablesFor('b', {type: 'mirror-horizontal'})` returns `['d']` only
- Happy path: `getConfusablesFor('15')` returns `['51']` (multi-char sequence)
- Edge case: `getConfusablesFor('z')` returns `[]` (character not in any set)
- Edge case: `getConfusablesFor('')` returns `[]` (empty input)
- Happy path: `getConfusableSet('bdpq')` returns the full set with all members and relationships
- Edge case: `getConfusableSet('nonexistent')` returns `undefined`
- Happy path: `getReversalTransform('6')` returns `{char: '6', transform: 'mirror-horizontal'}`
- Happy path: `isReversible('6')` returns `true`
- Edge case: `isReversible('a')` returns `false` (not in reversible list)

**Verification:**

- All test scenarios pass
- Query results are consistent with the JSON dataset

---

- [ ] U3. **SpotAll game types and registration**

**Goal:** Define the SpotAll config type and register the game in the catalog and route.

**Requirements:** R6, R11

**Dependencies:** U1

**Files:**

- Create: `src/games/spot-all/types.ts`
- Modify: `src/games/registry.ts`
- Modify: `src/games/config-fields-registry.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

**Approach:**

- `SpotAllConfig` type extending game-specific fields: target confusable sets, relationship type filter, grid size, correct tile count, distractor count, visual variation toggle
- Add `spot-all` entry to `GAME_CATALOG` with `subject: 'letters'`, appropriate levels, emoji cover
- Add stub config fields registration
- Add `SpotAllGameBody` component (placeholder) and `if (gameId === 'spot-all')` branch in `GameBody`

**Patterns to follow:**

- `src/games/number-match/types.ts` — game config type structure
- `GAME_CATALOG` entries in `src/games/registry.ts` — field shape
- `GameBody` switch in route file — conditional rendering pattern

**Test scenarios:**

- Happy path: `GAME_CATALOG.find(g => g.id === 'spot-all')` exists with correct fields
- Happy path: navigating to `/en/game/spot-all` renders the SpotAll game body (not "Game not found")

**Verification:**

- TypeScript compiles cleanly with the new types
- Game appears in catalog and route renders without error

---

- [ ] U4. **SpotAll round builder**

**Goal:** Create a round builder that generates a tile grid with correct tiles (visually varied) and distractor tiles (from confusable data and/or self-reversals).

**Requirements:** R6, R7, R8, R10

**Dependencies:** U1, U2

**Files:**

- Create: `src/games/spot-all/build-spot-all-round.ts`
- Create: `src/games/spot-all/build-spot-all-round.test.ts`

**Approach:**

- `buildSpotAllRound(config)` returns `SpotAllRound {target: string, tiles: SpotAllTile[], correctCount: number}`
- Each `SpotAllTile` has: `id`, `label`, `isCorrect`, `visualVariation?` (for correct tiles: font, size, color), `transform?` (for distractor tiles: CSS transform string), `distractorSource: 'confusable' | 'self-reversal' | null`
- Distractor generation draws from TWO sources:
  1. **Confusable sets** — different characters that look similar (query `getConfusablesFor`)
  2. **Reversible characters** — the target character itself, CSS-flipped (query `getReversalTransform`)
- If target is in reversible-characters list, include self-mirrored version(s) as distractors
- Assign random visual variations to correct tiles (from a palette)
- Assign appropriate CSS transform based on source for distractor tiles
- Shuffle all tiles into final grid order

**Patterns to follow:**

- `src/games/number-match/build-numeral-round.ts` — round building with distractor injection and Fisher-Yates shuffle

**Test scenarios:**

- Happy path: round for target 'b' with 3 correct + 3 distractors returns 6 tiles, 3 marked correct
- Happy path: distractor tiles for 'b' are drawn from `{d, p, q}` (confusable set members)
- Happy path: round for target '6' includes a self-mirrored '6' distractor (same label, with `transform: 'scaleX(-1)'`)
- Happy path: round for target '6' can include BOTH a '9' (confusable) AND a mirrored '6' (self-reversal) as distractors
- Happy path: correct tiles each have different `visualVariation` values
- Happy path: mirror-type distractors have `transform: 'scaleX(-1)'` or equivalent
- Happy path: transposition distractors show the transposed sequence as label (e.g. 'ao' for target 'oa')
- Edge case: target with no confusables AND not in reversible list falls back to random characters
- Edge case: requesting more distractors than available sources caps at available count

**Verification:**

- All test scenarios pass
- Round always returns the correct number of tiles with proper correct/distractor split

---

- [ ] U5. **SpotAll game state reducer**

**Goal:** Implement the tap-to-select state machine for SpotAll gameplay.

**Requirements:** R9

**Dependencies:** U4

**Files:**

- Create: `src/games/spot-all/spot-all-reducer.ts`
- Create: `src/games/spot-all/spot-all-reducer.test.ts`

**Approach:**

- State: `{tiles: SpotAllTile[], selectedIds: Set<string>, phase, roundIndex, feedback: 'none' | 'correct' | 'incorrect'}`
- Actions: `INIT_ROUND`, `TOGGLE_TILE` (select/deselect), `SUBMIT` (validate), `ADVANCE_ROUND`, `COMPLETE_GAME`
- On `SUBMIT`: compare selectedIds against correct tile IDs
  - All correct + no extras → mark round complete
  - Missing or extras → show feedback, allow retry
- On `ADVANCE_ROUND`: load next round tiles, reset selections

**Patterns to follow:**

- `src/components/answer-game/answer-game-reducer.ts` — reducer structure, phase transitions, `resolveCompletionPhase` pattern

**Test scenarios:**

- Happy path: selecting all correct tiles and submitting transitions to round-complete
- Happy path: selecting a mix of correct and incorrect tiles and submitting shows incorrect feedback
- Happy path: toggling a tile twice deselects it
- Happy path: ADVANCE_ROUND resets selectedIds and loads new tiles
- Edge case: submitting with no selections shows incorrect feedback
- Edge case: selecting more tiles than correct count still validates correctly (extras count as wrong)
- Integration: completing the last round triggers COMPLETE_GAME phase

**Verification:**

- All test scenarios pass
- Reducer is pure (no side effects)

---

- [ ] U6. **SpotAll game component and tile rendering**

**Goal:** Build the main SpotAll component with tile grid, prompt, and visual variation/transform rendering.

**Requirements:** R6, R8, R9, R10

**Dependencies:** U3, U4, U5

**Files:**

- Create: `src/games/spot-all/SpotAll/SpotAll.tsx`
- Create: `src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx`
- Create: `src/games/spot-all/SpotAllTile/SpotAllTile.tsx`
- Create: `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`

**Approach:**

- `SpotAll` wraps content in `GameShell` with `GameEngineProvider`, manages rounds via the spot-all reducer
- `SpotAllPrompt` displays "Select all the **X** tiles" with the target character highlighted
- `SpotAllGrid` renders a responsive grid of `SpotAllTile` components
- `SpotAllTile` renders the character with:
  - `visualVariation` applied as inline styles (font-family, font-size, color) for correct tiles
  - `transform` applied as CSS transform for distractor tiles (scaleX(-1), rotate, etc.)
  - Selected state (outline/highlight), correct feedback (green), incorrect feedback (red)
- A "Check" button triggers SUBMIT action
- Wire into the `SpotAllGameBody` placeholder from U3

**Patterns to follow:**

- `src/games/number-match/NumberMatch/NumberMatch.tsx` — game component structure with rounds
- `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` — tile rendering with button elements
- Tailwind classes for grid layout, transitions, and state-driven styling

**Test scenarios:**

- Happy path: renders prompt with target character
- Happy path: renders correct number of tiles in grid
- Happy path: tapping a tile toggles its selected state visually
- Happy path: submitting correct selection shows success feedback
- Happy path: distractor tiles display with CSS transform applied
- Happy path: correct tiles display with varied visual styles
- Integration: completing all rounds shows game-over state via GameShell

**Verification:**

- Component renders without error
- Interactive flow works end-to-end (tap → select → submit → feedback → advance)

---

- [ ] U7. **SpotAll config form and presets**

**Goal:** Create the config form UI and preset configurations for SpotAll.

**Requirements:** R11, R12

**Dependencies:** U3, U6

**Files:**

- Create: `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx`
- Create: `src/games/spot-all/resolve-simple-config.ts`
- Modify: `src/games/config-fields-registry.tsx`

**Approach:**

- Simple config: difficulty selector (easy/medium/hard) that maps to preset bundles
- Advanced config: select confusable sets, relationship types, grid size, correct/distractor counts
- Presets: "Mirror Letters Easy" (b/d only, 4 correct + 2 distractor), "All Confusables Hard" (multiple sets, mixed types, larger grid)
- Wire into `config-fields-registry.tsx` (replace stub from U3)

**Patterns to follow:**

- `src/games/number-match/resolve-simple-config.ts` — simple-to-full config mapping
- Existing config form components in `src/games/*/`

**Test scenarios:**

- Happy path: "easy" preset generates config with single confusable set, small grid
- Happy path: "hard" preset generates config with multiple sets, mixed relationship types
- Happy path: advanced form allows selecting specific confusable sets
- Edge case: config with no sets selected falls back to default preset

**Verification:**

- Config form renders and produces valid SpotAllConfig
- Presets generate playable game configurations

---

## System-Wide Impact

- **Interaction graph:** SpotAll operates independently. It reads from `src/data/confusables/` (static import) and plugs into `GameShell`/`GameEngineProvider` at the same level as NumberMatch. No callbacks or middleware affected.
- **Error propagation:** If confusable data is missing/malformed, round builder should fail gracefully with a fallback (random characters as distractors). No cascading failures.
- **State lifecycle risks:** SpotAll's reducer is self-contained. Session persistence via `GameEngineProvider` should work without adapter if the engine stores opaque round data.
- **API surface parity:** New game ID `spot-all` must be added to route, catalog, and config registry — three integration points.
- **Integration coverage:** The round builder → reducer → component pipeline should be tested as a flow, not just unit-by-unit.
- **Unchanged invariants:** Existing games (WordSpell, NumberMatch, SortNumbers) are not modified. The confusable data layer is additive only.

---

## Risks & Dependencies

| Risk                                                                              | Mitigation                                                                                                                              |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CSS transforms may render poorly with some fonts (flipped characters look broken) | Test with the app's actual font stack early in U6; fall back to showing the confusable character literally if transforms are unreadable |
| GameEngineProvider may expect AnswerGame-shaped state for session recording       | U6 implementation will verify; worst case, SpotAll handles its own session persistence                                                  |
| Multi-character sequences (e.g. "oa") displayed in a single tile may look cramped | Grid tile sizing should accommodate 2-3 character labels; test in Storybook                                                             |

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md](docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md)
- Related code: `src/games/registry.ts`, `src/games/number-match/build-numeral-round.ts`
- Related issues: #234 (Game: identify the correct one), #228 (connect answers — deferred)
