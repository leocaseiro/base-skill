# Fast-Tap Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix false error bounces on rapid Android taps by pre-validating tiles at the bank and using a ref-based pending-placements queue to prevent stale-closure races.

**Architecture:** A module-scoped `pendingPlacements` ref acts as a write-ahead log so concurrent taps see each other's claimed slots without waiting for React's batched re-render. Wrong tiles are caught at the bank (pre-validation) instead of traveling to a slot and bouncing back. A new `REJECT_TAP` reducer action tracks retries without zone mutations.

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-05-01-fast-tap-queue-design.md`

## Spec Delta

**Red flash styling — inline styles instead of CSS class:** The spec says
"Add the `.is-wrong` styles to the existing DraggableTile CSS module." However,
there is no DraggableTile CSS module — bank tiles use inline styles via
`tileStyle()` (which sets `background: linear-gradient(...)`) and Tailwind
utility classes. A CSS class cannot override inline styles without `!important`.
This plan uses direct `el.style` assignment and `animationend` cleanup instead,
achieving the same visual result (skin-wrong-bg/border flash for shake duration)
without needing `!important` hacks or a new CSS module.

---

## File Structure

### Modified files

| File                                                | Responsibility                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/components/answer-game/types.ts`               | Add `REJECT_TAP` to `AnswerGameAction` union                                                       |
| `src/types/game-events.ts`                          | Add `expected` field to `GameEvaluateEvent`                                                        |
| `src/components/answer-game/answer-game-reducer.ts` | Handle `REJECT_TAP` action                                                                         |
| `src/components/answer-game/useTileEvaluation.ts`   | Add `expected` to emits; dispatch `REJECT_TAP` for reject-mode wrong on drag; return `{ correct }` |
| `src/components/answer-game/useAutoNextSlot.ts`     | Pending queue, pre-validation, `PlaceResult` return type                                           |
| `src/components/answer-game/useDraggableTile.ts`    | Pre-validate on click with shake/sound feedback; drag-reject shake                                 |

### Modified test files

| File                                                     | Responsibility                                     |
| -------------------------------------------------------- | -------------------------------------------------- |
| `src/components/answer-game/answer-game-reducer.test.ts` | `REJECT_TAP` handler tests                         |
| `src/components/answer-game/useTileEvaluation.test.tsx`  | `expected` field + reject-dispatch tests           |
| `src/components/answer-game/useAutoNextSlot.test.tsx`    | Pending queue, pre-validation, `PlaceResult` tests |
| `src/components/answer-game/useDraggableTile.test.tsx`   | Click reject path + drag-reject tests              |

---

## Task 1: Add REJECT_TAP action and expected field to types

**Files:**

- Modify: `src/components/answer-game/types.ts:101-121`
- Modify: `src/types/game-events.ts:51-58`

- [ ] **Step 1: Add REJECT_TAP to AnswerGameAction union**

In `src/components/answer-game/types.ts`, add to the union after the `SET_ACTIVE_SLOT` member (line 121):

```typescript
  | { type: 'SET_ACTIVE_SLOT'; zoneIndex: number }
  | { type: 'REJECT_TAP'; tileId: string; zoneIndex: number };
```

- [ ] **Step 2: Add expected field to GameEvaluateEvent**

In `src/types/game-events.ts`, add after the `zoneIndex` field (line 57):

```typescript
export interface GameEvaluateEvent extends BaseGameEvent {
  type: 'game:evaluate';
  answer: string | string[] | number;
  correct: boolean;
  nearMiss: boolean;
  /** Index of the slot the tile was placed into. */
  zoneIndex: number;
  /** Expected value for the target slot — provides confusion pair for SRS. */
  expected: string;
}
```

- [ ] **Step 3: Run typecheck to verify**

Run: `yarn typecheck`

Expected: Type errors in files that emit `game:evaluate` without `expected` (useTileEvaluation.ts, possibly useDraggableTile.ts). This is expected — we fix those emits in Tasks 3 and 5.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/types.ts src/types/game-events.ts
git commit -m "feat(answer-game): add REJECT_TAP action type and expected field to GameEvaluateEvent (#276)"
```

---

## Task 2: Handle REJECT_TAP in reducer

**Files:**

- Modify: `src/components/answer-game/answer-game-reducer.ts:104`
- Test: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing test for REJECT_TAP**

Add to the end of the `describe('answerGameReducer', ...)` block in `answer-game-reducer.test.ts`:

```typescript
describe('REJECT_TAP', () => {
  it('increments retryCount without mutating zones or bank', () => {
    const state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });

    const next = answerGameReducer(state, {
      type: 'REJECT_TAP',
      tileId: 't2',
      zoneIndex: 0,
    });

    expect(next.retryCount).toBe(state.retryCount + 1);
    expect(next.zones).toEqual(state.zones);
    expect(next.bankTileIds).toEqual(state.bankTileIds);
    expect(next.activeSlotIndex).toBe(state.activeSlotIndex);
    expect(next.phase).toBe('playing');
  });

  it('preserves existing retryCount accumulation', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'REJECT_TAP',
      tileId: 't2',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'REJECT_TAP',
      tileId: 't2',
      zoneIndex: 0,
    });

    expect(state.retryCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/answer-game-reducer.test.ts`

Expected: FAIL — `REJECT_TAP` is not handled by the reducer (falls through to default, returns unchanged state, retryCount stays 0).

- [ ] **Step 3: Implement REJECT_TAP handler**

In `answer-game-reducer.ts`, add a new case before the closing `default:` of the switch statement. Insert after the `RESUME_ROUND` case block (after line 104, before `case 'PLACE_TILE':`):

```typescript
    case 'REJECT_TAP': {
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/answer-game-reducer.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/answer-game-reducer.ts src/components/answer-game/answer-game-reducer.test.ts
git commit -m "feat(answer-game): handle REJECT_TAP reducer action (#276)"
```

---

## Task 3: Add expected field to game:evaluate emits and reject-mode dispatch

**Files:**

- Modify: `src/components/answer-game/useTileEvaluation.ts:9-10,24-50,52-83`
- Test: `src/components/answer-game/useTileEvaluation.test.tsx`

This task modifies `placeTile` to:

1. Include `expected` in all `game:evaluate` emits
2. Return `{ correct: boolean }` so callers can react to the outcome
3. Dispatch `REJECT_TAP` instead of `PLACE_TILE` for wrong tiles in `reject` mode

- [ ] **Step 1: Write failing tests**

First, update the mock for `getGameEventBus` so we can capture emitted events. Replace the existing mock at the top of `useTileEvaluation.test.tsx`:

```typescript
const mockEmit = vi.fn();
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: mockEmit, subscribe: vi.fn() }),
}));
```

Add a `beforeEach` to clear the mock (add inside or alongside existing `beforeEach`):

```typescript
beforeEach(() => {
  mockEmit.mockClear();
});
```

Then add these tests at the end of the test file's describe block:

```typescript
describe('expected field on game:evaluate', () => {
  it('includes expected value from zone in placeTile emit', () => {
    const Wrapper = createWrapper(baseConfig);
    function useHarness() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      const { placeTile } = useTileEvaluation();
      return { state, placeTile };
    }

    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => result.current.placeTile('t1', 0));

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'game:evaluate',
        expected: 'C',
      }),
    );
  });
});

describe('placeTile return value', () => {
  it('returns { correct: true } for correct placement', () => {
    const Wrapper = createWrapper(baseConfig);
    function useHarness() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      const { placeTile } = useTileEvaluation();
      return { placeTile };
    }

    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    let returnVal: { correct: boolean } | undefined;
    act(() => {
      returnVal = result.current.placeTile('t1', 0);
    });

    expect(returnVal).toEqual({ correct: true });
  });

  it('returns { correct: false } for wrong placement', () => {
    const Wrapper = createWrapper(baseConfig);
    function useHarness() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      const { placeTile } = useTileEvaluation();
      return { placeTile };
    }

    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    let returnVal: { correct: boolean } | undefined;
    act(() => {
      returnVal = result.current.placeTile('t2', 0);
    });

    expect(returnVal).toEqual({ correct: false });
  });
});

describe('reject mode dispatches REJECT_TAP', () => {
  it('dispatches REJECT_TAP instead of PLACE_TILE for wrong tile in reject mode', () => {
    const rejectConfig: AnswerGameConfig = {
      ...baseConfig,
      wrongTileBehavior: 'reject',
    };
    const Wrapper = createWrapper(rejectConfig);
    function useHarness() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      const { placeTile } = useTileEvaluation();
      return { state, placeTile };
    }

    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => result.current.placeTile('t2', 0));

    expect(result.current.state.retryCount).toBe(1);
    expect(result.current.state.zones[0].placedTileId).toBeNull();
  });

  it('dispatches PLACE_TILE for wrong tile in lock-auto-eject mode', () => {
    const Wrapper = createWrapper(baseConfig);
    function useHarness() {
      const dispatch = useAnswerGameDispatch();
      const state = useAnswerGameContext();
      if (state.zones.length === 0)
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      const { placeTile } = useTileEvaluation();
      return { state, placeTile };
    }

    const { result } = renderHook(() => useHarness(), {
      wrapper: Wrapper,
    });
    act(() => result.current.placeTile('t2', 0));

    expect(result.current.state.zones[0].placedTileId).toBe('t2');
    expect(result.current.state.zones[0].isWrong).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/answer-game/useTileEvaluation.test.tsx`

Expected: FAIL — `expected` field missing from emit, `placeTile` returns void, reject mode still dispatches `PLACE_TILE`.

- [ ] **Step 3: Implement changes in useTileEvaluation.ts**

Update the `TileEvaluation` interface:

```typescript
export interface TileEvaluation {
  placeTile: (
    tileId: string,
    zoneIndex: number,
  ) => { correct: boolean };
  typeTile: (value: string, zoneIndex: number) => void;
}
```

Update `placeTile` implementation:

```typescript
const placeTile = useCallback(
  (tileId: string, zoneIndex: number): { correct: boolean } => {
    const tile = state.allTiles.find((t) => t.id === tileId);
    const zone = state.zones[zoneIndex];
    if (!tile || !zone) return { correct: false };

    const correct = tile.value === zone.expectedValue;
    if (!skin.suppressDefaultSounds) {
      playSound(correct ? 'correct' : 'wrong', 0.8);
    }

    if (!correct && state.config.wrongTileBehavior === 'reject') {
      dispatch({ type: 'REJECT_TAP', tileId, zoneIndex });
    } else {
      dispatch({ type: 'PLACE_TILE', tileId, zoneIndex });
    }

    getGameEventBus().emit({
      type: 'game:evaluate',
      gameId: state.config.gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex: state.roundIndex,
      answer: tileId,
      correct,
      nearMiss: false,
      zoneIndex,
      expected: zone.expectedValue,
    });

    return { correct };
  },
  [state, dispatch, skin],
);
```

Update `typeTile` to add `expected` to its emit:

```typescript
getGameEventBus().emit({
  type: 'game:evaluate',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  answer: value,
  correct,
  nearMiss: false,
  zoneIndex,
  expected: zone.expectedValue,
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/useTileEvaluation.test.tsx`

Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `yarn typecheck`

Expected: PASS (or errors only in files we haven't touched yet — useDraggableTile emit sites).

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/useTileEvaluation.ts src/components/answer-game/useTileEvaluation.test.tsx
git commit -m "feat(answer-game): add expected field to game:evaluate emits and reject-mode dispatch (#276)"
```

---

## Task 4: Refactor useAutoNextSlot — pending queue and pre-validation

**Files:**

- Modify: `src/components/answer-game/useAutoNextSlot.ts`
- Test: `src/components/answer-game/useAutoNextSlot.test.tsx`

This is the core fix. Changes:

1. Module-scoped `pendingPlacements` array (write-ahead log)
2. `PlaceResult` return type: `{ placed: boolean; zoneIndex: number; rejected: boolean }`
3. Pre-validation against target slot's `expectedValue` (skipped for `lock-manual`)
4. Drain logic removes entries the reducer has applied
5. Clear on round transitions via `useEffect`
6. Remove `isWrong` early-return guard (superseded by pre-validation)

- [ ] **Step 1: Write failing tests**

Replace the entire content of `useAutoNextSlot.test.tsx` with:

```typescript
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import {
  clearPendingPlacements,
  useAutoNextSlot,
} from './useAutoNextSlot';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { PlaceResult } from './useAutoNextSlot';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tileItems: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const answerZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 'T',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

beforeEach(() => {
  clearPendingPlacements();
});

function createWrapper(config: AnswerGameConfig) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
  );
  Wrapper.displayName = 'AutoNextSlotTestWrapper';
  return Wrapper;
}

function useHarness(
  tiles: TileItem[] = tileItems,
  zones: AnswerZone[] = answerZones,
) {
  const dispatch = useAnswerGameDispatch();
  const state = useAnswerGameContext();
  if (state.zones.length === 0)
    dispatch({ type: 'INIT_ROUND', tiles, zones });
  const { placeInNextSlot } = useAutoNextSlot();
  return { state, placeInNextSlot };
}

describe('useAutoNextSlot', () => {
  describe('basic placement', () => {
    it('places correct tile in activeSlotIndex zone', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t1');
      });

      expect(res).toEqual({ placed: true, zoneIndex: 0, rejected: false });
      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
    });

    it('advances activeSlotIndex after correct placement', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      expect(result.current.state.activeSlotIndex).toBe(0);
      act(() => result.current.placeInNextSlot('t1'));
      expect(result.current.state.activeSlotIndex).toBe(1);
    });

    it('skips locked zones when finding the next available slot', () => {
      const lockedZones: AnswerZone[] = [
        { ...answerZones[0], isLocked: true },
        answerZones[1],
        answerZones[2],
      ];

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tileItems, lockedZones),
        { wrapper: Wrapper },
      );

      act(() => result.current.placeInNextSlot('t2'));
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });
  });

  describe('pre-validation', () => {
    it('rejects wrong tile in lock-auto-eject mode', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({ placed: false, zoneIndex: 0, rejected: true });
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    });

    it('rejects wrong tile in reject mode', () => {
      const rejectConfig: AnswerGameConfig = {
        ...gameConfig,
        wrongTileBehavior: 'reject',
      };
      const Wrapper = createWrapper(rejectConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({ placed: false, zoneIndex: 0, rejected: true });
      expect(result.current.state.zones[0]?.placedTileId).toBeNull();
    });

    it('allows wrong tile through in lock-manual mode (no pre-validation)', () => {
      const manualConfig: AnswerGameConfig = {
        ...gameConfig,
        wrongTileBehavior: 'lock-manual',
      };
      const Wrapper = createWrapper(manualConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({ placed: true, zoneIndex: 0, rejected: false });
      expect(result.current.state.zones[0]?.placedTileId).toBe('t2');
    });
  });

  describe('pending placements queue', () => {
    it('prevents double-placement on rapid taps (stale closure fix)', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.placeInNextSlot('t1');
        result.current.placeInNextSlot('t2');
      });

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });

    it('handles three rapid correct taps', () => {
      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(() => useHarness(), {
        wrapper: Wrapper,
      });

      act(() => {
        result.current.placeInNextSlot('t1');
        result.current.placeInNextSlot('t2');
        result.current.placeInNextSlot('t3');
      });

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
      expect(result.current.state.zones[2]?.placedTileId).toBe('t3');
    });
  });

  describe('wrap-around', () => {
    it('wraps around to fill earlier empty slots', () => {
      const threeZones: AnswerZone[] = [
        { ...answerZones[0], placedTileId: null },
        { ...answerZones[1], placedTileId: 't2' },
        { ...answerZones[2], placedTileId: null },
      ];

      const Wrapper = createWrapper(gameConfig);

      function useHarnessWrap() {
        const dispatch = useAnswerGameDispatch();
        const state = useAnswerGameContext();
        if (state.zones.length === 0) {
          dispatch({
            type: 'INIT_ROUND',
            tiles: tileItems,
            zones: threeZones,
          });
          dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
        }
        const { placeInNextSlot } = useAutoNextSlot();
        return { state, placeInNextSlot };
      }

      const { result } = renderHook(() => useHarnessWrap(), {
        wrapper: Wrapper,
      });

      act(() => result.current.placeInNextSlot('t3'));
      act(() => result.current.placeInNextSlot('t1'));

      expect(result.current.state.zones[0]?.placedTileId).toBe('t1');
    });
  });

  describe('isWrong guard removal', () => {
    it('places correct tile in next slot even when active slot is wrong (lock-auto-eject drag)', () => {
      const wrongZones: AnswerZone[] = [
        {
          ...answerZones[0],
          placedTileId: 'tX',
          isWrong: true,
          isLocked: true,
        },
        answerZones[1],
        answerZones[2],
      ];

      const tilesWithX: TileItem[] = [
        ...tileItems,
        { id: 'tX', label: 'X', value: 'X' },
      ];

      const Wrapper = createWrapper(gameConfig);
      const { result } = renderHook(
        () => useHarness(tilesWithX, wrongZones),
        { wrapper: Wrapper },
      );

      let res: PlaceResult | undefined;
      act(() => {
        res = result.current.placeInNextSlot('t2');
      });

      expect(res).toEqual({ placed: true, zoneIndex: 1, rejected: false });
      expect(result.current.state.zones[1]?.placedTileId).toBe('t2');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/answer-game/useAutoNextSlot.test.tsx`

Expected: FAIL — `clearPendingPlacements` not exported, `PlaceResult` not exported, `placeInNextSlot` returns `void`, no pre-validation, no pending queue.

- [ ] **Step 3: Implement the refactored useAutoNextSlot**

Replace the entire content of `src/components/answer-game/useAutoNextSlot.ts`:

```typescript
import { useCallback, useEffect } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useTileEvaluation } from './useTileEvaluation';

export interface PlaceResult {
  placed: boolean;
  zoneIndex: number;
  rejected: boolean;
}

export interface AutoNextSlot {
  placeInNextSlot: (tileId: string) => PlaceResult;
}

let pendingPlacements: Array<{ tileId: string; zoneIndex: number }> =
  [];

export const clearPendingPlacements = (): void => {
  pendingPlacements = [];
};

export const useAutoNextSlot = (): AutoNextSlot => {
  const state = useAnswerGameContext();
  const { zones, activeSlotIndex, config, allTiles, roundIndex } =
    state;
  const { placeTile } = useTileEvaluation();

  useEffect(() => {
    clearPendingPlacements();
  }, [roundIndex]);

  const placeInNextSlot = useCallback(
    (tileId: string): PlaceResult => {
      pendingPlacements = pendingPlacements.filter(
        (entry) =>
          zones[entry.zoneIndex]?.placedTileId !== entry.tileId,
      );

      const claimedZones = new Set(
        pendingPlacements.map((e) => e.zoneIndex),
      );

      const isAvailable = (i: number) =>
        zones[i] &&
        !zones[i].placedTileId &&
        !zones[i].isLocked &&
        !claimedZones.has(i);

      let targetIndex = -1;
      for (let i = activeSlotIndex; i < zones.length; i++) {
        if (isAvailable(i)) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        for (let i = 0; i < activeSlotIndex; i++) {
          if (isAvailable(i)) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        return { placed: false, zoneIndex: -1, rejected: false };
      }

      if (config.wrongTileBehavior !== 'lock-manual') {
        const tile = allTiles.find((t) => t.id === tileId);
        if (tile && tile.value !== zones[targetIndex].expectedValue) {
          return {
            placed: false,
            zoneIndex: targetIndex,
            rejected: true,
          };
        }
      }

      pendingPlacements.push({ tileId, zoneIndex: targetIndex });
      placeTile(tileId, targetIndex);
      return { placed: true, zoneIndex: targetIndex, rejected: false };
    },
    [
      zones,
      activeSlotIndex,
      config.wrongTileBehavior,
      allTiles,
      placeTile,
    ],
  );

  return { placeInNextSlot };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/useAutoNextSlot.test.tsx`

Expected: PASS

- [ ] **Step 5: Run full unit tests to check for regressions**

Run: `npx vitest run src/components/answer-game/`

Expected: PASS (some `useDraggableTile` tests may need updates due to changed `placeInNextSlot` return type — address in Task 5).

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/useAutoNextSlot.ts src/components/answer-game/useAutoNextSlot.test.tsx
git commit -m "feat(answer-game): add pending-placements queue and pre-validation to useAutoNextSlot (#276)"
```

---

## Task 5: Wire handleClick pre-validation and bank tile feedback

**Files:**

- Modify: `src/components/answer-game/useDraggableTile.ts:1-143`
- Test: `src/components/answer-game/useDraggableTile.test.tsx`

This task wires the `PlaceResult` from `placeInNextSlot` into `handleClick`:

- Throttle re-taps during shake (`animate-shake` check)
- On rejection: shake + wrong-state inline styles on bank tile, wrong sound, `REJECT_TAP` dispatch, `game:evaluate` emit
- On placement: no change (already handled by `placeTile` inside `placeInNextSlot`)

- [ ] **Step 1: Update useDraggableTile mock and write failing tests**

In `useDraggableTile.test.tsx`, update the `useAutoNextSlot` mock to return a `PlaceResult`:

```typescript
const mockPlaceInNextSlot = vi.fn().mockReturnValue({
  placed: true,
  zoneIndex: 0,
  rejected: false,
});
```

Add these imports at the top of the file:

```typescript
import { playSound } from '@/lib/audio/AudioFeedback';
```

Add mock for audio (after existing mocks):

```typescript
vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));
```

Add mock for slot-animations:

```typescript
const mockTriggerShake = vi.fn();
vi.mock('./Slot/slot-animations', () => ({
  triggerShake: (...args: unknown[]) => mockTriggerShake(...args),
}));
```

Add mock for skin:

```typescript
vi.mock('@/lib/skin', () => ({
  resolveSkin: () => ({ suppressDefaultSounds: false }),
}));
```

Update the mock for `getGameEventBus` to capture emits:

```typescript
const mockEmit = vi.fn();
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: mockEmit, subscribe: vi.fn() }),
}));
```

Add `beforeEach` to clear mocks:

```typescript
beforeEach(() => {
  mockPlaceInNextSlot.mockClear().mockReturnValue({
    placed: true,
    zoneIndex: 0,
    rejected: false,
  });
  mockSpeakTile.mockClear();
  mockDispatch.mockClear();
  mockEmit.mockClear();
  mockTriggerShake.mockClear();
  vi.mocked(playSound).mockClear();
});
```

Update `useAnswerGameContext` mock to include `allTiles` and zone data for pre-validation testing:

```typescript
vi.mock('./useAnswerGameContext', () => ({
  useAnswerGameContext: () => ({
    config: {
      inputMethod: 'drag',
      ttsEnabled: true,
      totalRounds: 1,
      gameId: 'test',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
    },
    zones: [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ],
    allTiles: [
      { id: 't1', label: 'C', value: 'C' },
      { id: 't2', label: 'X', value: 'X' },
    ],
    bankTileIds: ['t1', 't2'],
    activeSlotIndex: 0,
    roundIndex: 0,
    retryCount: 0,
    phase: 'playing',
    dragActiveTileId: null,
  }),
}));
```

Add these tests:

```typescript
describe('handleClick reject path', () => {
  it('does not speak or place when tile is already shaking', () => {
    const tile = { id: 't1', label: 'C', value: 'C' };
    const { result } = renderHook(() => useDraggableTile(tile));

    // Simulate shake in progress
    const button = document.createElement('button');
    button.classList.add('animate-shake');
    Object.defineProperty(result.current.ref, 'current', {
      value: button,
      writable: true,
    });

    act(() => result.current.handleClick());

    expect(mockSpeakTile).not.toHaveBeenCalled();
    expect(mockPlaceInNextSlot).not.toHaveBeenCalled();
  });

  it('dispatches REJECT_TAP and plays wrong sound on rejection', () => {
    mockPlaceInNextSlot.mockReturnValue({
      placed: false,
      zoneIndex: 0,
      rejected: true,
    });

    const tile = { id: 't2', label: 'X', value: 'X' };
    const { result } = renderHook(() => useDraggableTile(tile));

    const button = document.createElement('button');
    Object.defineProperty(result.current.ref, 'current', {
      value: button,
      writable: true,
    });

    act(() => result.current.handleClick());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REJECT_TAP',
      tileId: 't2',
      zoneIndex: 0,
    });
    expect(playSound).toHaveBeenCalledWith('wrong', 0.8);
  });

  it('emits game:evaluate with expected field on rejection', () => {
    mockPlaceInNextSlot.mockReturnValue({
      placed: false,
      zoneIndex: 0,
      rejected: true,
    });

    const tile = { id: 't2', label: 'X', value: 'X' };
    const { result } = renderHook(() => useDraggableTile(tile));

    const button = document.createElement('button');
    Object.defineProperty(result.current.ref, 'current', {
      value: button,
      writable: true,
    });

    act(() => result.current.handleClick());

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'game:evaluate',
        answer: 't2',
        correct: false,
        expected: 'C',
        zoneIndex: 0,
      }),
    );
  });

  it('does not dispatch REJECT_TAP on successful placement', () => {
    const tile = { id: 't1', label: 'C', value: 'C' };
    const { result } = renderHook(() => useDraggableTile(tile));

    act(() => result.current.handleClick());

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'REJECT_TAP' }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/answer-game/useDraggableTile.test.tsx`

Expected: FAIL — handleClick doesn't check `PlaceResult`, no shake, no `REJECT_TAP` dispatch.

- [ ] **Step 3: Implement handleClick changes**

In `useDraggableTile.ts`, add imports:

```typescript
import { playSound } from '@/lib/audio/AudioFeedback';
import { triggerShake } from './Slot/slot-animations';
import { resolveSkin } from '@/lib/skin';
```

Inside the hook body, add skin resolution (after the existing `const { placeTile } = useTileEvaluation();` line):

```typescript
const skin = resolveSkin(state.config.gameId, state.config.skin);
```

Replace the `handleClick` function (lines 129-132):

```typescript
const handleClick = () => {
  if (ref.current?.classList.contains('animate-shake')) return;

  speakTile(tile.label);
  const result = placeInNextSlot(tile.id);

  if (result.rejected && ref.current) {
    triggerShake(ref.current);
    const el = ref.current;
    el.style.background = 'var(--skin-wrong-bg)';
    el.style.borderColor = 'var(--skin-wrong-border)';
    el.addEventListener(
      'animationend',
      () => {
        el.style.background = '';
        el.style.borderColor = '';
      },
      { once: true },
    );

    if (!skin.suppressDefaultSounds) {
      playSound('wrong', 0.8);
    }

    dispatch({
      type: 'REJECT_TAP',
      tileId: tile.id,
      zoneIndex: result.zoneIndex,
    });

    getGameEventBus().emit({
      type: 'game:evaluate',
      gameId: state.config.gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex: state.roundIndex,
      answer: tile.id,
      correct: false,
      nearMiss: false,
      zoneIndex: result.zoneIndex,
      expected: state.zones[result.zoneIndex]?.expectedValue ?? '',
    });
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/useDraggableTile.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/useDraggableTile.ts src/components/answer-game/useDraggableTile.test.tsx
git commit -m "feat(answer-game): wire bank tile pre-validation with shake and reject feedback (#276)"
```

---

## Task 6: Add touch-drag reject feedback

**Files:**

- Modify: `src/components/answer-game/useDraggableTile.ts:105-108`
- Test: `src/components/answer-game/useDraggableTile.test.tsx`

When a tile is dropped onto a slot via touch drag and rejected (reject mode + wrong), shake the bank tile after it reappears.

- [ ] **Step 1: Write failing test**

First, add a mock for `useTouchDrag` at module scope (alongside the other mocks
at the top of `useDraggableTile.test.tsx`). This captures the `onDrop` callback
so we can invoke it directly:

```typescript
let capturedTouchDragOptions: Record<string, unknown> = {};
vi.mock('./useTouchDrag', () => ({
  useTouchDrag: (options: Record<string, unknown>) => {
    capturedTouchDragOptions = options;
    return {
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn(),
    };
  },
}));
```

Then update the `useAnswerGameContext` mock to accept a config override for
`wrongTileBehavior`. The simplest way: change the existing mock to use a
module-scope variable:

```typescript
let mockWrongTileBehavior = 'lock-auto-eject';

vi.mock('./useAnswerGameContext', () => ({
  useAnswerGameContext: () => ({
    config: {
      inputMethod: 'drag',
      ttsEnabled: true,
      totalRounds: 1,
      gameId: 'test',
      wrongTileBehavior: mockWrongTileBehavior,
      tileBankMode: 'exact',
    },
    zones: [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ],
    allTiles: [
      { id: 't1', label: 'C', value: 'C' },
      { id: 't2', label: 'X', value: 'X' },
    ],
    bankTileIds: ['t1', 't2'],
    activeSlotIndex: 0,
    roundIndex: 0,
    retryCount: 0,
    phase: 'playing',
    dragActiveTileId: null,
  }),
}));
```

Add the drag-reject test:

```typescript
describe('touch drag reject path', () => {
  it('calls triggerShake on bank tile when drag-drop is rejected in reject mode', () => {
    mockWrongTileBehavior = 'reject';
    mockPlaceTile.mockReturnValue({ correct: false });

    const tile = { id: 't2', label: 'X', value: 'X' };
    const { result } = renderHook(() => useDraggableTile(tile));

    const button = document.createElement('button');
    Object.defineProperty(result.current.ref, 'current', {
      value: button,
      writable: true,
    });

    const onDrop = capturedTouchDragOptions.onDrop as (
      tileId: string,
      zoneIndex: number,
    ) => void;
    act(() => onDrop('t2', 0));

    expect(mockTriggerShake).toHaveBeenCalledWith(button);

    mockWrongTileBehavior = 'lock-auto-eject';
  });

  it('does not shake when wrong tile is dropped in lock-auto-eject mode', () => {
    mockPlaceTile.mockReturnValue({ correct: false });

    const tile = { id: 't2', label: 'X', value: 'X' };
    renderHook(() => useDraggableTile(tile));

    const onDrop = capturedTouchDragOptions.onDrop as (
      tileId: string,
      zoneIndex: number,
    ) => void;
    act(() => onDrop('t2', 0));

    expect(mockTriggerShake).not.toHaveBeenCalled();
  });
});
```

> **Note:** The `capturedTouchDragOptions` approach captures the callbacks
> `useDraggableTile` passes to `useTouchDrag`. The `stateRef` used in
> `onDrop` (line 29 of useDraggableTile.ts: `const stateRef = useRef(state)`)
> ensures `wrongTileBehavior` reads the current value even inside a stale
> closure. The `requestAnimationFrame` wrapper in the implementation defers
> the shake until after React re-renders the tile at full opacity.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/useDraggableTile.test.tsx`

Expected: FAIL — onDrop doesn't check placeTile result.

- [ ] **Step 3: Implement drag-reject feedback**

In `useDraggableTile.ts`, update the touch drag `onDrop` handler (lines 105-108):

```typescript
      onDrop: (droppedTileId, zoneIndex) => {
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
        const { correct } = placeTile(droppedTileId, zoneIndex);
        if (
          !correct &&
          stateRef.current.config.wrongTileBehavior === 'reject' &&
          ref.current
        ) {
          requestAnimationFrame(() => {
            if (ref.current) {
              triggerShake(ref.current);
              ref.current.style.background = 'var(--skin-wrong-bg)';
              ref.current.style.borderColor = 'var(--skin-wrong-border)';
              ref.current.addEventListener(
                'animationend',
                () => {
                  if (ref.current) {
                    ref.current.style.background = '';
                    ref.current.style.borderColor = '';
                  }
                },
                { once: true },
              );
            }
          });
        }
      },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/answer-game/useDraggableTile.test.tsx`

Expected: PASS

- [ ] **Step 5: Run full answer-game test suite**

Run: `npx vitest run src/components/answer-game/`

Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `yarn typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/answer-game/useDraggableTile.ts src/components/answer-game/useDraggableTile.test.tsx
git commit -m "feat(answer-game): add touch-drag reject feedback with bank tile shake (#276)"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`

Expected: PASS — no regressions.

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`

Expected: PASS

- [ ] **Step 3: Run linters**

Run: `yarn fix:md && yarn lint:md`

Expected: PASS

- [ ] **Step 4: Manual verification checklist**

Verify against the spec's behavior matrix:

| Mode              | Input                      | Expected behavior                                   |
| ----------------- | -------------------------- | --------------------------------------------------- |
| `lock-auto-eject` | Tap wrong tile             | Tile shakes in bank, wrong sound, no slot placement |
| `lock-auto-eject` | Tap correct tile           | Tile placed in slot, correct sound                  |
| `lock-auto-eject` | Rapid correct taps (C-A-T) | All three placed correctly, no false bounces        |
| `lock-manual`     | Tap wrong tile             | Tile goes to slot (unchanged behavior)              |
| `reject`          | Tap wrong tile             | Tile shakes in bank, wrong sound                    |
| `reject`          | Drag wrong tile            | Tile returns to bank, wrong sound, shake            |
| `lock-auto-eject` | Drag wrong tile            | Tile lands in slot, auto-ejects (unchanged)         |

- [ ] **Step 5: Push and verify CI**

Run: `git push`

Expected: CI passes all required checks.
