# Level System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable level progression system to AnswerGame, with
SortNumbers as the first adopter.

**Architecture:** Extend `AnswerGameConfig` with an optional `levelMode` field.
When present, the reducer uses a new `'level-complete'` phase between levels
instead of going straight to `'game-over'`. A new `LevelCompleteOverlay` handles
the "Next Level" / "I'm Done" UX. Each game provides a `generateNextLevel`
callback that produces the next level's tiles and zones.

**Tech Stack:** React, TypeScript, Vitest, Storybook, canvas-confetti

**Spec:**
[docs/superpowers/specs/2026-04-09-level-system-design.md](../specs/2026-04-09-level-system-design.md)

---

## File Map

### New files

- `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx` —
  overlay shown on level complete
- `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx` —
  Storybook stories
- `src/games/sort-numbers/sort-numbers-level-generator.ts` — `generateNextLevel`
  for SortNumbers
- `src/games/sort-numbers/sort-numbers-level-generator.test.ts` — tests for
  level generator
- `src/games/level-system.mdx` — docs page for the level system

### Modified files

- `src/components/answer-game/types.ts` — add `levelMode` to config,
  `'level-complete'` to phase, `ADVANCE_LEVEL` to actions, `levelIndex` to
  state + draft
- `src/components/answer-game/answer-game-reducer.ts` — add `levelIndex`,
  `isLevelMode` to initial state; handle `ADVANCE_LEVEL`; route level-complete
  phase
- `src/components/answer-game/answer-game-reducer.test.ts` — tests for level
  mode
- `src/components/answer-game/useGameSounds.ts` — add `levelCompleteReady`,
  handle `'level-complete'` phase
- `src/components/answer-game/useGameSounds.test.tsx` — tests for level-complete
  sound
- `src/lib/audio/AudioFeedback.ts` — add `'level-complete'` to `SoundKey`
- `src/lib/game-engine/useAnswerGameDraftSync.ts` — include `levelIndex` in
  draft
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — wire up level mode
- `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx` — add level mode
  stories
- `src/games/sort-numbers/resolve-simple-config.ts` — use `levelMode` instead of
  multiple rounds
- `src/games/sort-numbers/resolve-simple-config.test.ts` — update tests
- `public/sounds/game-complete.mp3` — replaced with new freesound file
- `public/sounds/level-complete.mp3` — renamed from old game-complete.mp3

---

## Task 1: Sound file changes

**Files:**

- Rename: `public/sounds/game-complete.mp3` → `public/sounds/level-complete.mp3`
- Copy: `~/Music/Downloads/freesound-162458_311243-lq.mp3` →
  `public/sounds/game-complete.mp3`

- [ ] **Step 1: Rename old game-complete to level-complete**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/level-system-spec
mv public/sounds/game-complete.mp3 public/sounds/level-complete.mp3
```

- [ ] **Step 2: Copy the new game-complete sound**

```bash
cp ~/Music/Downloads/freesound-162458_311243-lq.mp3 public/sounds/game-complete.mp3
```

- [ ] **Step 3: Verify both files exist**

```bash
ls -la public/sounds/level-complete.mp3 public/sounds/game-complete.mp3
```

Expected: both files exist with non-zero sizes.

- [ ] **Step 4: Commit**

```bash
git add public/sounds/level-complete.mp3 public/sounds/game-complete.mp3
git commit -m "feat(sounds): add level-complete sound, replace game-complete

Rename old game-complete.mp3 to level-complete.mp3 (used for level transitions).
Replace game-complete.mp3 with new freesound file for final game-over."
```

---

## Task 2: Types — add level mode to AnswerGame

**Files:**

- Modify: `src/components/answer-game/types.ts`
- Modify: `src/lib/audio/AudioFeedback.ts`

- [ ] **Step 1: Add `levelMode` to `AnswerGameConfig`**

In `src/components/answer-game/types.ts`, add after the `slotInteraction` field
in `AnswerGameConfig`:

```ts
/** Level progression — omit for classic rounds-only mode */
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

- [ ] **Step 2: Add `'level-complete'` to `AnswerGamePhase`**

In the same file, update `AnswerGamePhase`:

```ts
export type AnswerGamePhase =
  | 'playing'
  | 'round-complete'
  | 'level-complete'
  | 'game-over';
```

- [ ] **Step 3: Add `ADVANCE_LEVEL` to `AnswerGameAction`**

In the same file, add to the union:

```ts
| { type: 'ADVANCE_LEVEL'; tiles: TileItem[]; zones: AnswerZone[] }
```

- [ ] **Step 4: Add `levelIndex` and `isLevelMode` to `AnswerGameState`**

In the same file, add to `AnswerGameState`:

```ts
levelIndex: number;
isLevelMode: boolean;
```

- [ ] **Step 5: Add `levelIndex` to `AnswerGameDraftState`**

In the same file, add to `AnswerGameDraftState`:

```ts
levelIndex: number;
```

Also update the `phase` type in `AnswerGameDraftState` to include
`'level-complete'`:

```ts
phase: 'playing' | 'round-complete' | 'level-complete';
```

- [ ] **Step 6: Add `'level-complete'` to `SoundKey` in AudioFeedback.ts**

In `src/lib/audio/AudioFeedback.ts`, update:

```ts
type SoundKey =
  | 'correct'
  | 'wrong'
  | 'round-complete'
  | 'level-complete'
  | 'game-complete'
  | 'tile-place';
```

And add to `SOUND_PATHS`:

```ts
'level-complete': `${base}/sounds/level-complete.mp3`,
```

- [ ] **Step 7: Run typecheck**

```bash
yarn typecheck
```

Expected: type errors in `answer-game-reducer.ts` (missing `levelIndex` and
`isLevelMode` in `makeInitialState`) and possibly in
`useAnswerGameDraftSync.ts`. These are expected and will be fixed in the next
tasks.

- [ ] **Step 8: Commit**

```bash
git add src/components/answer-game/types.ts src/lib/audio/AudioFeedback.ts
git commit -m "feat(types): add level mode types to AnswerGame

Add levelMode to AnswerGameConfig, 'level-complete' phase, ADVANCE_LEVEL
action, levelIndex/isLevelMode to state, and level-complete SoundKey."
```

---

## Task 3: Reducer — implement level mode logic (TDD)

**Files:**

- Modify: `src/components/answer-game/answer-game-reducer.ts`
- Modify: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing tests for level mode**

Add the following tests to `answer-game-reducer.test.ts`, inside the existing
`describe('answerGameReducer', ...)` block, at the end:

```ts
describe('level mode', () => {
  const levelConfig: AnswerGameConfig = {
    gameId: 'test',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
    levelMode: {
      generateNextLevel: () => ({ tiles: [], zones: [] }),
    },
  };

  it('makeInitialState sets isLevelMode true when levelMode is present', () => {
    const state = makeInitialState(levelConfig);
    expect(state.isLevelMode).toBe(true);
    expect(state.levelIndex).toBe(0);
  });

  it('makeInitialState sets isLevelMode false when levelMode is absent', () => {
    const state = makeInitialState(config);
    expect(state.isLevelMode).toBe(false);
    expect(state.levelIndex).toBe(0);
  });

  it('completing all zones in level mode transitions to level-complete (not game-over)', () => {
    let state = answerGameReducer(makeInitialState(levelConfig), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't3',
      zoneIndex: 2,
    });
    expect(state.phase).toBe('level-complete');
  });

  it('completing all zones with maxLevels reached transitions to game-over', () => {
    const cappedConfig: AnswerGameConfig = {
      ...levelConfig,
      levelMode: {
        maxLevels: 1,
        generateNextLevel: () => ({ tiles: [], zones: [] }),
      },
    };
    let state = answerGameReducer(makeInitialState(cappedConfig), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't3',
      zoneIndex: 2,
    });
    expect(state.phase).toBe('game-over');
  });

  it('ADVANCE_LEVEL increments levelIndex and resets round state', () => {
    let state = makeInitialState(levelConfig);
    state = answerGameReducer(state, {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    // Simulate completing level
    state = { ...state, phase: 'level-complete' as const };

    const newTiles: TileItem[] = [{ id: 'n1', label: 'D', value: 'D' }];
    const newZones: AnswerZone[] = [
      {
        id: 'nz0',
        index: 0,
        expectedValue: 'D',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];
    state = answerGameReducer(state, {
      type: 'ADVANCE_LEVEL',
      tiles: newTiles,
      zones: newZones,
    });
    expect(state.levelIndex).toBe(1);
    expect(state.allTiles).toEqual(newTiles);
    expect(state.bankTileIds).toEqual(['n1']);
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(0);
  });

  it('ADVANCE_LEVEL does NOT reset retryCount', () => {
    let state = makeInitialState(levelConfig);
    state = answerGameReducer(state, {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    // Place wrong tile to increment retryCount
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 0,
    });
    expect(state.retryCount).toBe(1);
    state = { ...state, phase: 'level-complete' as const };

    const newTiles: TileItem[] = [{ id: 'n1', label: 'D', value: 'D' }];
    const newZones: AnswerZone[] = [
      {
        id: 'nz0',
        index: 0,
        expectedValue: 'D',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];
    state = answerGameReducer(state, {
      type: 'ADVANCE_LEVEL',
      tiles: newTiles,
      zones: newZones,
    });
    expect(state.retryCount).toBe(1);
  });

  it('SWAP_TILES completing all zones in level mode transitions to level-complete', () => {
    let state = answerGameReducer(makeInitialState(levelConfig), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    // Place t2 in zone 0 (wrong), t1 in zone 1 (wrong), t3 in zone 2 (correct)
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't3',
      zoneIndex: 2,
    });
    // All correct — should be level-complete
    expect(state.phase).toBe('level-complete');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test -- --run src/components/answer-game/answer-game-reducer.test.ts
```

Expected: multiple failures (missing `isLevelMode`, `levelIndex`,
`ADVANCE_LEVEL` handling).

- [ ] **Step 3: Update `makeInitialState` in the reducer**

In `src/components/answer-game/answer-game-reducer.ts`, update
`makeInitialState`:

```ts
export function makeInitialState(
  config: AnswerGameConfig,
): AnswerGameState {
  return {
    config,
    allTiles: [],
    bankTileIds: [],
    zones: [],
    activeSlotIndex: 0,
    dragActiveTileId: null,
    dragHoverZoneIndex: null,
    dragHoverBankTileId: null,
    phase: 'playing',
    roundIndex: 0,
    retryCount: 0,
    levelIndex: 0,
    isLevelMode: config.levelMode !== undefined,
  };
}
```

- [ ] **Step 4: Update phase transition logic for PLACE_TILE**

In the `PLACE_TILE` case, find the block that determines the phase when
`allFilledCorrectly` is true (around line 91-107). Replace the phase
determination logic:

Find this code block (the `correct` branch return statement):

```ts
const allFilledCorrectly = newZones.every(
  (z) => z.placedTileId !== null && !z.isWrong,
);
const isLastRound = state.roundIndex >= state.config.totalRounds - 1;
return {
  ...state,
  dragActiveTileId,
  zones: newZones,
  bankTileIds: newBankTileIds,
  activeSlotIndex:
    nextActiveSlot === -1 ? state.activeSlotIndex : nextActiveSlot,
  retryCount: state.retryCount,
  phase: allFilledCorrectly
    ? isLastRound
      ? 'game-over'
      : 'round-complete'
    : 'playing',
};
```

Replace the phase computation with a helper call. Add this helper function
**before** the `answerGameReducer` function:

```ts
function resolveCompletionPhase(
  state: AnswerGameState,
): AnswerGamePhase {
  const isLastRound = state.roundIndex >= state.config.totalRounds - 1;

  if (!isLastRound) return 'round-complete';

  if (!state.isLevelMode) return 'game-over';

  const maxLevels = state.config.levelMode?.maxLevels;
  if (maxLevels && state.levelIndex + 1 >= maxLevels)
    return 'game-over';

  return 'level-complete';
}
```

Then update the return in the `correct` branch of `PLACE_TILE`:

```ts
phase: allFilledCorrectly
  ? resolveCompletionPhase(state)
  : 'playing',
```

- [ ] **Step 5: Update SWAP_TILES phase logic**

In the `SWAP_TILES` case, find the same pattern:

```ts
const allFilledCorrectly = newZones.every(
  (z) => z.placedTileId !== null && !z.isWrong,
);
const isLastRound = state.roundIndex >= state.config.totalRounds - 1;

return {
  ...state,
  dragActiveTileId,
  zones: newZones,
  phase: allFilledCorrectly
    ? isLastRound
      ? 'game-over'
      : 'round-complete'
    : 'playing',
};
```

Replace with:

```ts
const allFilledCorrectly = newZones.every(
  (z) => z.placedTileId !== null && !z.isWrong,
);

return {
  ...state,
  dragActiveTileId,
  zones: newZones,
  phase: allFilledCorrectly ? resolveCompletionPhase(state) : 'playing',
};
```

- [ ] **Step 6: Add ADVANCE_LEVEL case to the reducer**

Add a new case after `ADVANCE_ROUND`:

```ts
case 'ADVANCE_LEVEL': {
  return {
    ...state,
    allTiles: action.tiles,
    bankTileIds: action.tiles.map((t: TileItem) => t.id),
    zones: action.zones,
    activeSlotIndex: 0,
    phase: 'playing',
    roundIndex: 0,
    levelIndex: state.levelIndex + 1,
  };
}
```

Note: `retryCount` is intentionally NOT reset — it accumulates across levels.

- [ ] **Step 7: Run tests to verify they pass**

```bash
yarn test -- --run src/components/answer-game/answer-game-reducer.test.ts
```

Expected: all tests pass (both existing and new).

- [ ] **Step 8: Run typecheck**

```bash
yarn typecheck
```

Expected: may still have errors in other files that reference `AnswerGameState`
without the new fields. That's expected — they'll be fixed in later tasks.

- [ ] **Step 9: Commit**

```bash
git add src/components/answer-game/answer-game-reducer.ts \
       src/components/answer-game/answer-game-reducer.test.ts
git commit -m "feat(reducer): add level mode support to AnswerGame reducer

Add levelIndex/isLevelMode to initial state. Extract resolveCompletionPhase
helper. Add ADVANCE_LEVEL action. Level mode routes to 'level-complete'
phase instead of 'game-over' when rounds end."
```

---

## Task 4: useGameSounds — handle level-complete phase (TDD)

**Files:**

- Modify: `src/components/answer-game/useGameSounds.ts`
- Modify: `src/components/answer-game/useGameSounds.test.tsx`

- [ ] **Step 1: Write failing test for level-complete sound**

Add to `useGameSounds.test.tsx` inside the existing `describe('useGameSounds')`
block:

```ts
it('plays "level-complete" when phase transitions to level-complete', () => {
  const levelConfig: AnswerGameConfig = {
    ...baseConfig,
    totalRounds: 1,
    levelMode: {
      generateNextLevel: () => ({ tiles: [], zones: [] }),
    },
  };
  const { result } = renderHook(
    () => {
      const dispatch = useAnswerGameDispatch();
      useGameSounds();
      return dispatch;
    },
    { wrapper: createWrapper(levelConfig) },
  );
  act(() => {
    result.current({ type: 'INIT_ROUND', tiles, zones });
  });
  vi.clearAllMocks();
  act(() => {
    result.current({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });
  expect(playSound).toHaveBeenCalledWith('level-complete');
});

it('levelCompleteReady becomes true on level-complete phase', async () => {
  const levelConfig: AnswerGameConfig = {
    ...baseConfig,
    totalRounds: 1,
    levelMode: {
      generateNextLevel: () => ({ tiles: [], zones: [] }),
    },
  };
  const { result } = renderHook(
    () => {
      const dispatch = useAnswerGameDispatch();
      const sounds = useGameSounds();
      return { dispatch, sounds };
    },
    { wrapper: createWrapper(levelConfig) },
  );
  act(() => {
    result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
  });
  await act(async () => {
    result.current.dispatch({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });
  expect(result.current.sounds.levelCompleteReady).toBe(true);
});

it('levelCompleteReady resets when phase leaves level-complete', async () => {
  const levelConfig: AnswerGameConfig = {
    ...baseConfig,
    totalRounds: 1,
    levelMode: {
      generateNextLevel: () => ({ tiles: [], zones: [] }),
    },
  };
  const extraTile: TileItem = { id: 't2', label: 'B', value: 'B' };
  const extraZone: AnswerZone = {
    id: 'z1',
    index: 0,
    expectedValue: 'B',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  };
  const { result } = renderHook(
    () => {
      const dispatch = useAnswerGameDispatch();
      const sounds = useGameSounds();
      return { dispatch, sounds };
    },
    { wrapper: createWrapper(levelConfig) },
  );
  act(() => {
    result.current.dispatch({ type: 'INIT_ROUND', tiles, zones });
  });
  await act(async () => {
    result.current.dispatch({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });
  expect(result.current.sounds.levelCompleteReady).toBe(true);

  await act(async () => {
    result.current.dispatch({
      type: 'ADVANCE_LEVEL',
      tiles: [extraTile],
      zones: [extraZone],
    });
  });
  expect(result.current.sounds.levelCompleteReady).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test -- --run src/components/answer-game/useGameSounds.test.tsx
```

Expected: failures due to missing `levelCompleteReady` property and no
`'level-complete'` sound handling.

- [ ] **Step 3: Update `useGameSounds` to handle level-complete**

Replace the entire `useGameSounds.ts` with:

```ts
import { useEffect, useRef, useState } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): {
  confettiReady: boolean;
  levelCompleteReady: boolean;
  gameOverReady: boolean;
} => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);
  const [confettiReady, setConfettiReady] = useState(false);
  const [levelCompleteReady, setLevelCompleteReady] = useState(false);
  const [gameOverReady, setGameOverReady] = useState(false);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === prev) return;

    let cancelled = false;

    if (phase === 'round-complete') {
      playSound('round-complete');
      void Promise.resolve().then(() => {
        if (!cancelled) setConfettiReady(true);
      });
    } else if (phase === 'level-complete') {
      playSound('level-complete');
      void Promise.resolve().then(() => {
        if (!cancelled) setLevelCompleteReady(true);
      });
    } else if (phase === 'game-over') {
      playSound('game-complete');
      void Promise.resolve().then(() => {
        if (!cancelled) setGameOverReady(true);
      });
    } else {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setConfettiReady(false);
          setLevelCompleteReady(false);
          setGameOverReady(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [phase]);

  return { confettiReady, levelCompleteReady, gameOverReady };
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test -- --run src/components/answer-game/useGameSounds.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/useGameSounds.ts \
       src/components/answer-game/useGameSounds.test.tsx
git commit -m "feat(sounds): add level-complete sound handling to useGameSounds

Play 'level-complete' sound on level-complete phase. Add levelCompleteReady
flag for UI components to react to."
```

---

## Task 5: Draft sync — include levelIndex

**Files:**

- Modify: `src/lib/game-engine/useAnswerGameDraftSync.ts`

- [ ] **Step 1: Add levelIndex to buildDraft**

In `useAnswerGameDraftSync.ts`, update the `buildDraft` function to include
`levelIndex`:

```ts
const buildDraft = (
  state: AnswerGameState,
): AnswerGameDraftState | null => {
  if (state.phase === 'game-over') return null;
  return {
    allTiles: state.allTiles,
    bankTileIds: state.bankTileIds,
    zones: state.zones,
    activeSlotIndex: state.activeSlotIndex,
    phase: state.phase,
    roundIndex: state.roundIndex,
    retryCount: state.retryCount,
    levelIndex: state.levelIndex,
  };
};
```

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: should pass for this file now that `levelIndex` is in
`AnswerGameDraftState`.

- [ ] **Step 3: Run existing draft sync tests**

```bash
yarn test -- --run src/lib/game-engine/useAnswerGameDraftSync.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/game-engine/useAnswerGameDraftSync.ts
git commit -m "feat(draft-sync): persist levelIndex in draft state

Include levelIndex in AnswerGameDraftSync so level progress survives
browser refreshes and offline play."
```

---

## Task 6: LevelCompleteOverlay component

**Files:**

- Create:
  `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx`
- Create:
  `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx`

- [ ] **Step 1: Create LevelCompleteOverlay component**

Create
`src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx`:

```tsx
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface LevelCompleteOverlayProps {
  level: number;
  onNextLevel: () => void;
  onDone: () => void;
}

export const LevelCompleteOverlay = ({
  level,
  onNextLevel,
  onDone,
}: LevelCompleteOverlayProps) => {
  useEffect(() => {
    void confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      ticks: 310,
    });

    return () => {
      confetti.reset();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label={`Level ${level} complete`}
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-background/95"
    >
      <span className="animate-bounce text-8xl" aria-hidden="true">
        🐨
      </span>

      <p className="text-4xl font-bold text-foreground">
        Level {level} Complete!
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onNextLevel}
          className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-md active:scale-95"
        >
          Next Level
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-muted px-8 py-4 text-lg font-bold active:scale-95"
        >
          I'm Done
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create Storybook stories**

Create
`src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx`:

```tsx
import { LevelCompleteOverlay } from './LevelCompleteOverlay';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LevelCompleteOverlay> = {
  component: LevelCompleteOverlay,
  tags: ['autodocs'],
  argTypes: {
    onNextLevel: { action: 'nextLevel' },
    onDone: { action: 'done' },
  },
};
export default meta;

type Story = StoryObj<typeof LevelCompleteOverlay>;

export const Level1: Story = { args: { level: 1 } };
export const Level3: Story = { args: { level: 3 } };
export const Level10: Story = { args: { level: 10 } };
```

- [ ] **Step 3: Run typecheck**

```bash
yarn typecheck
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/LevelCompleteOverlay/
git commit -m "feat(ui): add LevelCompleteOverlay component

Shows koala, confetti burst, 'Level N Complete!' heading with
'Next Level' and 'I'm Done' buttons."
```

---

## Task 7: SortNumbers level generator (TDD)

**Files:**

- Create: `src/games/sort-numbers/sort-numbers-level-generator.ts`
- Create: `src/games/sort-numbers/sort-numbers-level-generator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/games/sort-numbers/sort-numbers-level-generator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSortNumbersLevelGenerator } from './sort-numbers-level-generator';

describe('createSortNumbersLevelGenerator', () => {
  it('generates level 0 sequence correctly', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result!.zones.map((z) => z.expectedValue)).toEqual([
      '2',
      '4',
      '6',
      '8',
      '10',
    ]);
  });

  it('generates level 1 continuing from where level 0 ended', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(1);
    expect(result).not.toBeNull();
    expect(result!.zones.map((z) => z.expectedValue)).toEqual([
      '12',
      '14',
      '16',
      '18',
      '20',
    ]);
  });

  it('generates level 2 continuing the pattern', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 5,
      direction: 'ascending',
    });
    const result = generate(2);
    expect(result).not.toBeNull();
    expect(result!.zones.map((z) => z.expectedValue)).toEqual([
      '22',
      '24',
      '26',
      '28',
      '30',
    ]);
  });

  it('descending direction reverses expected zone order', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 3,
      direction: 'descending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result!.zones.map((z) => z.expectedValue)).toEqual([
      '6',
      '4',
      '2',
    ]);
  });

  it('generates correct number of tiles and zones', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 1,
      step: 3,
      quantity: 4,
      direction: 'ascending',
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    expect(result!.tiles).toHaveLength(4);
    expect(result!.zones).toHaveLength(4);
  });

  it('includes distractors when configured', () => {
    const generate = createSortNumbersLevelGenerator({
      start: 2,
      step: 2,
      quantity: 3,
      direction: 'ascending',
      distractor: {
        config: { source: 'gaps-only', count: 'all' },
        range: { min: 2, max: 6 },
      },
    });
    const result = generate(0);
    expect(result).not.toBeNull();
    // 3 correct tiles + gap distractors (3, 5)
    expect(result!.tiles.length).toBeGreaterThan(3);
    expect(result!.zones).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test -- --run src/games/sort-numbers/sort-numbers-level-generator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the level generator**

Create `src/games/sort-numbers/sort-numbers-level-generator.ts`:

```ts
import { buildSortRound } from './build-sort-round';
import type { DistractorConfig } from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

interface LevelGeneratorOptions {
  start: number;
  step: number;
  quantity: number;
  direction: 'ascending' | 'descending';
  distractor?: {
    config: DistractorConfig;
    range: { min: number; max: number };
  };
}

export const createSortNumbersLevelGenerator = (
  options: LevelGeneratorOptions,
): ((completedLevel: number) => {
  tiles: TileItem[];
  zones: AnswerZone[];
}) => {
  const { start, step, quantity, direction, distractor } = options;

  return (completedLevel: number) => {
    const levelStart = start + completedLevel * quantity * step;
    const sequence = Array.from(
      { length: quantity },
      (_, i) => levelStart + i * step,
    );

    const distractorArg = distractor
      ? {
          config: distractor.config,
          range: {
            min: levelStart,
            max: levelStart + (quantity - 1) * step,
          },
        }
      : undefined;

    return buildSortRound(sequence, direction, distractorArg);
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test -- --run src/games/sort-numbers/sort-numbers-level-generator.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/sort-numbers-level-generator.ts \
       src/games/sort-numbers/sort-numbers-level-generator.test.ts
git commit -m "feat(sort-numbers): add level generator for SortNumbers

Creates a generateNextLevel callback that continues the number sequence
from where the previous level ended."
```

---

## Task 8: Update resolveSimpleConfig to use level mode

**Files:**

- Modify: `src/games/sort-numbers/resolve-simple-config.ts`
- Modify: `src/games/sort-numbers/resolve-simple-config.test.ts`

- [ ] **Step 1: Write/update tests for level mode in resolveSimpleConfig**

Add to `resolve-simple-config.test.ts` (check the existing test file for the
exact describe structure and add to it):

```ts
it('resolveSimpleConfig produces a levelMode config', () => {
  const simple: SortNumbersSimpleConfig = {
    configMode: 'simple',
    direction: 'ascending',
    start: 2,
    step: 2,
    quantity: 5,
    distractors: false,
  };
  const config = resolveSimpleConfig(simple);
  expect(config.levelMode).toBeDefined();
  expect(config.totalRounds).toBe(1);
  expect(config.rounds).toHaveLength(1);
});

it('resolveSimpleConfig levelMode generateNextLevel produces correct sequence for level 1', () => {
  const simple: SortNumbersSimpleConfig = {
    configMode: 'simple',
    direction: 'ascending',
    start: 2,
    step: 2,
    quantity: 5,
    distractors: false,
  };
  const config = resolveSimpleConfig(simple);
  const nextLevel = config.levelMode!.generateNextLevel(1);
  expect(nextLevel).not.toBeNull();
  expect(nextLevel!.zones.map((z) => z.expectedValue)).toEqual([
    '12',
    '14',
    '16',
    '18',
    '20',
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test -- --run src/games/sort-numbers/resolve-simple-config.test.ts
```

Expected: `config.levelMode` is undefined.

- [ ] **Step 3: Update resolveSimpleConfig**

In `src/games/sort-numbers/resolve-simple-config.ts`, add the import:

```ts
import { createSortNumbersLevelGenerator } from './sort-numbers-level-generator';
```

Then update the `resolveSimpleConfig` function to include `levelMode`:

```ts
export const resolveSimpleConfig = (
  simple: SortNumbersSimpleConfig,
): SortNumbersConfig => {
  const { direction, start, step, quantity, distractors } = simple;
  const range = { min: start, max: start + (quantity - 1) * step };
  const skip: SkipConfig = { mode: 'by', step, start };

  const distractor = distractors
    ? {
        config: { source: 'gaps-only' as const, count: 'all' as const },
        range,
      }
    : undefined;

  return {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    configMode: 'simple',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 1,
    direction,
    range,
    quantity,
    skip,
    tileBankMode: distractors ? 'distractors' : 'exact',
    distractors: distractors
      ? { source: 'gaps-only', count: 'all' }
      : { source: 'random', count: 2 },
    rounds: generateSortRounds({
      range,
      quantity,
      skip,
      totalRounds: 1,
    }),
    levelMode: {
      generateNextLevel: createSortNumbersLevelGenerator({
        start,
        step,
        quantity,
        direction,
        distractor,
      }),
    },
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test -- --run src/games/sort-numbers/resolve-simple-config.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/resolve-simple-config.ts \
       src/games/sort-numbers/resolve-simple-config.test.ts
git commit -m "feat(sort-numbers): wire level mode into resolveSimpleConfig

Simple config now produces levelMode with unlimited levels. Each level
continues the sequence from where the previous one ended."
```

---

## Task 9: Wire SortNumbers.tsx to level mode

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Import LevelCompleteOverlay**

Add to the imports in `SortNumbers.tsx`:

```ts
import { LevelCompleteOverlay } from '@/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay';
```

- [ ] **Step 2: Update SortNumbersSession to handle level-complete phase**

In the `SortNumbersSession` component, destructure `levelIndex` from the context
alongside the existing fields:

```ts
const { phase, roundIndex, retryCount, zones, levelIndex } =
  useAnswerGameContext();
```

- [ ] **Step 3: Add level advancement handler**

Add a handler inside `SortNumbersSession` (after the existing `handlePlayAgain`
handler):

```ts
const handleNextLevel = () => {
  const generateNextLevel =
    sortNumbersConfig.levelMode?.generateNextLevel;
  if (!generateNextLevel) return;

  const nextLevel = generateNextLevel(levelIndex);
  if (nextLevel) {
    dispatch({
      type: 'ADVANCE_LEVEL',
      tiles: nextLevel.tiles,
      zones: nextLevel.zones,
    });
  } else {
    dispatch({ type: 'COMPLETE_GAME' });
  }
};

const handleDone = () => {
  dispatch({ type: 'COMPLETE_GAME' });
};
```

- [ ] **Step 4: Update the useEffect for round/level completion**

The existing `useEffect` that handles `'round-complete'` phase (advancing to the
next round) should be updated. In level mode, round-complete is not used (each
level is 1 round, so the reducer goes straight to `'level-complete'`). The
existing useEffect only triggers on `'round-complete'` — which still works for
non-level-mode configs. No change needed to the existing useEffect.

- [ ] **Step 5: Render LevelCompleteOverlay**

In the JSX return, add the `LevelCompleteOverlay` alongside the existing
`GameOverOverlay`. Find this block:

```tsx
{
  gameOverReady ? (
    <GameOverOverlay
      retryCount={retryCount}
      onPlayAgain={handlePlayAgain}
      onHome={handleHome}
    />
  ) : null;
}
```

And update `useGameSounds` destructuring to include `levelCompleteReady`:

```ts
const { confettiReady, levelCompleteReady, gameOverReady } =
  useGameSounds();
```

Add the `LevelCompleteOverlay` before the `GameOverOverlay`:

```tsx
{
  levelCompleteReady ? (
    <LevelCompleteOverlay
      level={levelIndex + 1}
      onNextLevel={handleNextLevel}
      onDone={handleDone}
    />
  ) : null;
}
{
  gameOverReady ? (
    <GameOverOverlay
      retryCount={retryCount}
      onPlayAgain={handlePlayAgain}
      onHome={handleHome}
    />
  ) : null;
}
```

- [ ] **Step 6: Run typecheck**

```bash
yarn typecheck
```

Expected: passes.

- [ ] **Step 7: Run all tests**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(sort-numbers): wire level mode UI into SortNumbers

Show LevelCompleteOverlay on level-complete phase. Handle Next Level
and I'm Done buttons. Dispatch ADVANCE_LEVEL with generated next level."
```

---

## Task 10: Add SortNumbers level mode Storybook stories

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`

- [ ] **Step 1: Add level mode stories**

Add to `SortNumbers.stories.tsx`:

```tsx
import { createSortNumbersLevelGenerator } from '../sort-numbers-level-generator';

export const LevelModeUnlimited: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 2,
          step: 2,
          quantity: 5,
          direction: 'ascending',
        }),
      },
    },
  },
};

export const LevelModeCapped: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 3,
      skip: { mode: 'by', step: 5, start: 5 },
      range: { min: 5, max: 15 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [5, 10, 15] }],
      levelMode: {
        maxLevels: 3,
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 5,
          step: 5,
          quantity: 3,
          direction: 'ascending',
        }),
      },
    },
  },
};

export const LevelModeDescending: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 4,
      skip: { mode: 'by', step: 3, start: 3 },
      range: { min: 3, max: 12 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [3, 6, 9, 12] }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 3,
          step: 3,
          quantity: 4,
          direction: 'descending',
        }),
      },
    },
  },
};
```

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
git commit -m "feat(storybook): add SortNumbers level mode stories

Add stories for unlimited levels, capped levels (maxLevels: 3),
and descending direction with level mode."
```

---

## Task 11: Level system docs page

**Files:**

- Create: `src/games/level-system.mdx`

- [ ] **Step 1: Create docs MDX file**

Create `src/games/level-system.mdx`:

````mdx
{/* eslint-disable */}

import { Meta } from '@storybook/blocks';

<Meta title="Games/Level System" />

# Level System

The level system adds progressive gameplay to any AnswerGame-based game. Instead
of a fixed set of rounds, players advance through levels that are generated
on-the-fly. Each game defines its own level generation logic.

## How It Works

1. Player completes all answer zones in a level
2. A **Level Complete** screen appears (confetti + "Next Level" / "I'm Done")
3. Tapping "Next Level" generates the next level via `generateNextLevel`
4. Tapping "I'm Done" ends the session and shows the Game Over screen
5. If `maxLevels` is set and reached, the game ends automatically

## Opting In

Add `levelMode` to your `AnswerGameConfig`:

```ts
levelMode: {
  // Optional: cap the number of levels. Omit for unlimited.
  maxLevels: 5,
  // Required: generates the next level's tiles and zones.
  // Receives the 0-based index of the just-completed level.
  generateNextLevel: (completedLevel: number) => {
    // Return { tiles, zones } or null to end early
    return buildYourRound(completedLevel);
  },
}
```

When `levelMode` is present, set `totalRounds: 1` (each level is one round).
Provide the first level via `initialTiles` / `initialZones` as usual.

## SortNumbers Example

SortNumbers uses level mode with unlimited levels. Each level continues the
number sequence:

```ts
// Config: start=2, step=2, quantity=5
// Level 0: 2, 4, 6, 8, 10
// Level 1: 12, 14, 16, 18, 20
// Level 2: 22, 24, 26, 28, 30

import { createSortNumbersLevelGenerator } from './sort-numbers/sort-numbers-level-generator';

const generator = createSortNumbersLevelGenerator({
  start: 2,
  step: 2,
  quantity: 5,
  direction: 'ascending',
});

const config = {
  // ...other config
  totalRounds: 1,
  levelMode: {
    generateNextLevel: generator,
  },
};
```

## Unlimited vs Capped

| Config                             | Behavior                             |
| ---------------------------------- | ------------------------------------ |
| `levelMode: { generateNextLevel }` | Unlimited — player decides when done |
| `levelMode: { maxLevels: 5, ... }` | Caps at 5 levels then game over      |
| No `levelMode`                     | Classic rounds mode (no change)      |

## Sounds

| Phase          | Sound            | Visual             |
| -------------- | ---------------- | ------------------ |
| Level complete | `level-complete` | Confetti burst     |
| Game over      | `game-complete`  | Fireworks confetti |

## Games Using Level Mode

- **SortNumbers** — unlimited levels, continues the sequence pattern

Other games (NumberMatch, WordSpell) can adopt level mode by adding `levelMode`
to their configs.
````

- [ ] **Step 2: Run markdown fix from worktree**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/level-system-spec && yarn fix:md
```

- [ ] **Step 3: Commit**

```bash
git add src/games/level-system.mdx
git commit -m "docs: add level system documentation page

Explains the level system concept, how games opt in, config shape,
SortNumbers example, unlimited vs capped, and sound mapping."
```

---

## Task 12: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full typecheck**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Step 2: Run all unit tests**

```bash
yarn test
```

Expected: all pass.

- [ ] **Step 3: Run lint**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 4: Verify Storybook builds**

```bash
yarn build-storybook 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 5: Commit any remaining fixes**

If any checks fail, fix and commit before proceeding.
