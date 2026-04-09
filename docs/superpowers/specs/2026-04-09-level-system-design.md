# Level System Design

## Overview

Replace the fixed rounds-based progression with a **level system** built into
AnswerGame. Each game can opt into level mode, where levels are generated
on-the-fly rather than pre-computed. The player progresses through levels until
they quit or reach an optional max. SortNumbers is the first game to adopt this;
other games (NumberMatch, WordSpell) can opt in later.

## Goals

- Players can keep going as long as they want (unlimited levels)
- Teachers can optionally cap the number of levels
- Each game defines its own "next level" logic
- Level-complete and game-over are distinct phases with distinct sounds/UI
- No changes to games that don't opt in

## AnswerGameConfig Changes

Add an optional `levelMode` field:

```ts
levelMode?: {
  /** Max levels. Omit or set to 0 for unlimited. */
  maxLevels?: number;
  /**
   * Called when the player completes a level to generate the next one.
   * Receives the 0-based index of the just-completed level.
   * Returns new tiles + zones, or null to end the game early.
   */
  generateNextLevel: (completedLevel: number) => {
    tiles: TileItem[];
    zones: AnswerZone[];
  } | null;
};
```

When `levelMode` is absent, AnswerGame behaves exactly as today. When present:

- `totalRounds` is set to `1` (each level is a single round)
- The first level is provided via `initialTiles` / `initialZones`
- Subsequent levels come from `generateNextLevel`

## AnswerGameState Changes

New fields:

```ts
levelIndex: number; // starts at 0, increments on ADVANCE_LEVEL
isLevelMode: boolean; // derived from config.levelMode presence
```

## AnswerGamePhase Changes

Add a new phase:

```ts
export type AnswerGamePhase =
  | 'playing'
  | 'round-complete'
  | 'level-complete' // new
  | 'game-over';
```

## AnswerGameAction Changes

Add a new action:

```ts
| { type: 'ADVANCE_LEVEL'; tiles: TileItem[]; zones: AnswerZone[] }
```

## Reducer Logic

When `isLevelMode` is true:

1. Completing the round transitions to `'level-complete'` instead of
   `'game-over'`
2. If `maxLevels` is set and `levelIndex + 1 >= maxLevels`, go straight to
   `'game-over'` instead
3. `ADVANCE_LEVEL` increments `levelIndex`, resets round state with the new
   tiles/zones, and sets phase back to `'playing'`
4. `COMPLETE_GAME` (dispatched when the player taps "I'm Done") transitions to
   `'game-over'` as usual

When `isLevelMode` is false, the reducer behaves identically to today.

### retryCount across levels

`retryCount` accumulates across all levels within a session. It is **not** reset
on `ADVANCE_LEVEL`. The final star rating on the game-over screen reflects
overall performance across the entire session.

### AnswerGameDraftState

`levelIndex` is added to `AnswerGameDraftState` so that level progress can be
restored if the session is resumed.

## Sound Effects

### File changes

- Rename `public/sounds/game-complete.mp3` to `public/sounds/level-complete.mp3`
- Copy `~/Music/Downloads/freesound-162458_311243-lq.mp3` to
  `public/sounds/game-complete.mp3`

### SoundKey changes

```ts
type SoundKey =
  | 'correct'
  | 'wrong'
  | 'round-complete'
  | 'level-complete' // new — the old game-complete sound
  | 'game-complete' // now the new freesound file
  | 'tile-place';
```

### useGameSounds changes

- Add `levelCompleteReady: boolean` to the return type
- `'level-complete'` phase → play `'level-complete'` sound, set
  `levelCompleteReady` to true
- `'game-over'` phase → play `'game-complete'` sound (unchanged behavior, new
  file), set `gameOverReady` to true

## UI Components

### LevelCompleteOverlay (new)

Shared component at
`src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx`.

- Shown when phase is `'level-complete'`
- Confetti burst animation (reuse `ScoreAnimation` pattern)
- Bouncing koala emoji
- "Level X Complete!" heading
- Two buttons:
  - **"Next Level"** — game calls `generateNextLevel(levelIndex)`, dispatches
    `ADVANCE_LEVEL` with the result
  - **"I'm Done"** — dispatches `COMPLETE_GAME`

### GameOverOverlay (unchanged)

- Already has fireworks confetti, bouncing koala, star rating, "Play Again" /
  "Home" buttons
- Now plays the new `game-complete` sound (the freesound file)
- Star rating is calculated from cumulative `retryCount` across all levels

## SortNumbers Integration

### resolveSimpleConfig

Uses `levelMode` with unlimited levels instead of generating multiple rounds:

```ts
levelMode: {
  generateNextLevel: (completedLevel) => {
    const nextStart = start + ((completedLevel + 1) * quantity * step);
    const sequence = Array.from(
      { length: quantity },
      (_, i) => nextStart + i * step,
    );
    return buildSortRound(sequence, direction, distractor);
  },
},
```

Example with `start=2, step=2, quantity=5`:

- Level 0: 2, 4, 6, 8, 10
- Level 1: 12, 14, 16, 18, 20
- Level 2: 22, 24, 26, 28, 30

### SortNumbers.tsx

- Wire up the `'level-complete'` phase to show `LevelCompleteOverlay`
- "Next Level" calls `generateNextLevel` from config and dispatches
  `ADVANCE_LEVEL`
- "I'm Done" dispatches `COMPLETE_GAME`
- `'game-over'` phase continues to show `GameOverOverlay`

### Config form

Simple config form stays the same (start, step, quantity, distractors). It now
produces an infinite level game by default.

## Future Extensibility

### Progressive difficulty

The `generateNextLevel` callback receives `completedLevel`, so games can
increase difficulty per level (e.g., increase quantity, add distractors, widen
range). This is a future addition — for now SortNumbers just continues the same
pattern.

### Other games

NumberMatch and WordSpell can adopt level mode by adding `levelMode` to their
configs and defining their own `generateNextLevel` logic. No changes are needed
until they opt in.

## Documentation & Storybook

### Storybook Stories

Each new or changed component gets Storybook coverage:

- **LevelCompleteOverlay** — stories showing:
  - Default state (e.g., "Level 3 Complete!")
  - With "Next Level" and "I'm Done" button interactions
- **GameOverOverlay** — update existing stories to reflect the new
  game-complete sound (no visual changes)
- **SortNumbers** — stories demonstrating:
  - Level mode in action (starting at Level 1, advancing to Level 2)
  - Unlimited levels configuration
  - Capped levels configuration (e.g., maxLevels: 3)
- **useGameSounds** — update existing stories/tests to cover
  `levelCompleteReady`

### Docs Page (catalog-utils.mdx or new MDX)

- Explain the level system concept and how games opt in
- Show a config example for SortNumbers with level mode
- Document the `levelMode` config shape and `generateNextLevel` contract
- Include examples of unlimited vs. capped levels
- Note which games currently support level mode

## Out of Scope

- Progressive difficulty configuration UI
- Level selection / replay specific levels
- Changes to NumberMatch or WordSpell
