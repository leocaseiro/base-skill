# useGameRound Extraction + Tap-Select Slot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the duplicated round lifecycle from WordSpell, NumberMatch, and SortNumbers into a shared `useGameRound` hook; add 6 `round:*` events to the GameEventBus; add tap-select mode to the Slot component.

**Architecture:** `useGameRound` lives in `src/lib/game-engine/` alongside existing engine code. It owns round index, phase, and timing — it dispatches `ADVANCE_ROUND` / `COMPLETE_GAME` into `answerGameReducer` and emits `round:*` events on the `GameEventBus`. The reducer gains `firstActionAt` tracking and `round:mistake` / `round:first-action` emission. A new `SELECT_SLOT` action + `selectedSlotIds` state supports tap-select mode for SpotAll v2.

**Tech Stack:** React 18, TypeScript, Vitest, existing GameEventBus, existing answerGameReducer

**Spec:** `docs/superpowers/specs/2026-05-03-use-game-round-design.md`

**Spec Deltas:** None — plan follows spec exactly.

**Required skills for executors:**

- `update-architecture-docs` — for `.mdx` files under `src/lib/game-engine/`
- Markdown Authoring rules from CLAUDE.md — for this plan file

---

## File Structure

### New files

```text
src/lib/game-engine/
├── useGameRound.ts               # Hook: round lifecycle, event emission
├── useGameRound.test.ts          # Hook unit tests
└── useVisibilityTracking.ts      # Visibility change listener + event emission
```

### Modified files

| File                                                 | Change                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/types/game-events.ts`                           | Add 6 `round:*` event types + payload interfaces                         |
| `src/lib/game-event-bus.ts`                          | Support `round:*` wildcard subscription                                  |
| `src/components/answer-game/answer-game-reducer.ts`  | Add `firstActionAt`, `round:first-action` + `round:mistake` emission     |
| `src/components/answer-game/types.ts`                | Add `SELECT_SLOT` action, `selectedSlotIds` state, `firstActionAt` field |
| `src/components/answer-game/Slot/Slot.tsx`           | Add `interactionMode` prop                                               |
| `src/components/answer-game/Slot/useSlotBehavior.ts` | Tap-select click handling                                                |
| `src/games/word-spell/WordSpell/WordSpell.tsx`       | Migrate to `useGameRound`                                                |
| `src/games/number-match/NumberMatch/NumberMatch.tsx` | Migrate to `useGameRound`                                                |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` | Migrate to `useGameRound`                                                |
| `src/lib/game-engine/GameEngine.reference.mdx`       | Document useGameRound API                                                |
| `src/lib/game-engine/GameEngine.flows.mdx`           | Document round lifecycle flow                                            |

---

## Task 1: round:\* Event Types

**Files:**

- Modify: `src/types/game-events.ts`
- Test: `src/types/game-events.test.ts` (new — type-level + bus integration)

- [ ] **Step 1: Write failing test**

```ts
// src/types/game-events.test.ts
import { describe, it, expect } from 'vitest';
import { createGameEventBus } from '@/lib/game-event-bus';
import type { GameEvent } from './game-events';

describe('round:* event types', () => {
  const events: GameEvent['type'][] = [
    'round:shown',
    'round:first-action',
    'round:mistake',
    'round:tts-played',
    'round:visibility-change',
    'round:resolved',
  ];

  it.each(events)('%s is a valid event type', (type) => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe(type, (e) => received.push(e));

    bus.emit({
      type,
      gameId: 'test',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
    } as GameEvent);

    expect(received).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/game-events.test.ts --reporter=verbose`
Expected: FAIL — `round:*` types not in `GameEventType` union.

- [ ] **Step 3: Add round:\* event types to GameEventType**

In `src/types/game-events.ts`, extend the `GameEventType` union:

```ts
export type GameEventType =
  | 'game:start'
  | 'game:prepare'
  | 'game:instructions_shown'
  | 'game:action'
  | 'game:evaluate'
  | 'game:score'
  | 'game:hint'
  | 'game:retry'
  | 'game:time_up'
  | 'game:end'
  | 'game:round-advance'
  | 'game:level-advance'
  | 'game:drag-start'
  | 'game:drag-over-zone'
  | 'game:tile-ejected'
  | 'round:shown'
  | 'round:first-action'
  | 'round:mistake'
  | 'round:tts-played'
  | 'round:visibility-change'
  | 'round:resolved';
```

Add payload interfaces:

```ts
export interface RoundShownEvent extends BaseGameEvent {
  type: 'round:shown';
  roundId: string;
  itemId: string;
}

export interface RoundFirstActionEvent extends BaseGameEvent {
  type: 'round:first-action';
  roundId: string;
  kind: 'tile' | 'key' | 'tap';
}

export interface RoundMistakeEvent extends BaseGameEvent {
  type: 'round:mistake';
  roundId: string;
  expectedTile: string;
  actualTile: string;
  slotId: number;
  distractorSource: string | null;
}

export interface RoundTtsPlayedEvent extends BaseGameEvent {
  type: 'round:tts-played';
  roundId: string;
}

export interface RoundVisibilityChangeEvent extends BaseGameEvent {
  type: 'round:visibility-change';
  hidden: boolean;
}

export interface RoundResolvedEvent extends BaseGameEvent {
  type: 'round:resolved';
  roundId: string;
  outcome: 'correct' | 'timeout' | 'skip';
  finalAnswer?: string;
}
```

Add all to the `GameEvent` union.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/game-events.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/game-events.ts src/types/game-events.test.ts
git commit -m "feat(events): add 6 round:* event types with payload interfaces"
```

---

## Task 2: GameEventBus round:\* Wildcard

**Files:**

- Modify: `src/lib/game-event-bus.ts:25-47` (subscribe method)
- Test: `src/lib/game-event-bus.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/game-event-bus.test.ts (append)
describe('round:* wildcard subscription', () => {
  it('receives all round:* events', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('round:*', (e) => received.push(e));

    bus.emit({
      type: 'round:shown',
      gameId: 'test',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
      roundId: 'r1',
      itemId: 'i1',
    } as GameEvent);

    bus.emit({
      type: 'round:resolved',
      gameId: 'test',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
      roundId: 'r1',
      outcome: 'correct',
    } as GameEvent);

    expect(received).toHaveLength(2);
    expect(received[0].type).toBe('round:shown');
    expect(received[1].type).toBe('round:resolved');
  });

  it('does not receive game:* events on round:* subscription', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('round:*', (e) => received.push(e));

    bus.emit({
      type: 'game:start',
      gameId: 'test',
      sessionId: 'test',
      profileId: 'test',
      timestamp: Date.now(),
      roundIndex: 0,
      locale: 'en',
      difficulty: 'easy',
      gradeBand: 'k',
    } as GameEvent);

    expect(received).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: FAIL — `'round:*'` not accepted by `subscribe()`.

- [ ] **Step 3: Extend subscribe to support prefix wildcards**

Replace the hardcoded `'game:*'` check with a generic prefix-wildcard system:

```ts
// src/lib/game-event-bus.ts
type WildcardType = 'game:*' | 'round:*';

export class TypedGameEventBus implements GameEventBus {
  private readonly byType = new Map<GameEventType, Set<Handler>>();
  private readonly prefixWildcards = new Map<string, Set<Handler>>();

  emit(event: GameEvent): void {
    for (const [prefix, handlers] of this.prefixWildcards) {
      if (event.type.startsWith(prefix)) {
        for (const h of handlers) h(event);
      }
    }
    const specific = this.byType.get(event.type);
    if (specific) {
      for (const h of specific) h(event);
    }
  }

  subscribe(
    type: GameEventType | WildcardType,
    handler: Handler,
  ): () => void {
    if (type.endsWith(':*')) {
      const prefix = type.slice(0, -1);
      let bucket = this.prefixWildcards.get(prefix);
      if (!bucket) {
        bucket = new Set();
        this.prefixWildcards.set(prefix, bucket);
      }
      bucket.add(handler);
      return () => {
        bucket.delete(handler);
        if (bucket.size === 0) this.prefixWildcards.delete(prefix);
      };
    }
    let bucket = this.byType.get(type as GameEventType);
    if (!bucket) {
      bucket = new Set();
      this.byType.set(type as GameEventType, bucket);
    }
    bucket.add(handler);
    return () => {
      bucket.delete(handler);
      if (bucket.size === 0) this.byType.delete(type as GameEventType);
    };
  }
}
```

Also update the `GameEventBus` interface in `game-events.ts` to accept `'round:*'`:

```ts
export interface GameEventBus {
  emit(event: GameEvent): void;
  subscribe(
    type: GameEventType | 'game:*' | 'round:*',
    handler: (event: GameEvent) => void,
  ): () => void;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-event-bus.ts src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(bus): add round:* wildcard subscription via prefix matching

Replaces hardcoded game:* wildcard with generic prefix matching.
Both game:* and round:* wildcards now work."
```

---

## Task 3: useGameRound Hook — Basic Round Lifecycle

**Files:**

- Create: `src/lib/game-engine/useGameRound.ts`
- Create: `src/lib/game-engine/useGameRound.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/game-engine/useGameRound.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameRound } from './useGameRound';
import { createGameEventBus } from '@/lib/game-event-bus';
import type { GameEvent } from '@/types/game-events';

// Mock AnswerGameDispatchContext to capture dispatched actions
// Mock GameEventBus to capture emitted events

type Round = { id: string; word: string };

const rounds: Round[] = [
  { id: 'r1', word: 'cat' },
  { id: 'r2', word: 'dog' },
  { id: 'r3', word: 'hat' },
];

describe('useGameRound — basic lifecycle', () => {
  it('starts on first round with phase playing', () => {
    const { result } = renderHook(() =>
      useGameRound({ rounds, advanceDelayMs: 0 }),
    );
    expect(result.current.roundIndex).toBe(0);
    expect(result.current.currentRound).toBe(rounds[0]);
    expect(result.current.phase).toBe('playing');
    expect(result.current.isLastRound).toBe(false);
    expect(result.current.totalRounds).toBe(3);
  });

  it('emits round:shown on mount', () => {
    // Assert round:shown emitted with roundId 'r1'
  });

  it('transitions to round-complete on markResolved', () => {
    const { result } = renderHook(() =>
      useGameRound({ rounds, advanceDelayMs: 0 }),
    );
    act(() => result.current.markResolved('correct'));
    expect(result.current.phase).toBe('round-complete');
  });

  it('advances to next round after delay', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameRound({ rounds, advanceDelayMs: 750 }),
    );

    act(() => result.current.markResolved('correct'));
    expect(result.current.phase).toBe('round-complete');

    act(() => vi.advanceTimersByTime(750));
    expect(result.current.roundIndex).toBe(1);
    expect(result.current.currentRound).toBe(rounds[1]);
    expect(result.current.phase).toBe('playing');
    vi.useRealTimers();
  });

  it('emits round:resolved on markResolved', () => {
    // Assert round:resolved emitted with outcome 'correct'
  });

  it('emits round:shown on advance to next round', () => {
    // Advance past round 0
    // Assert second round:shown emitted with roundId 'r2'
  });

  it('sets phase to game-over on last round', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameRound({ rounds, advanceDelayMs: 0 }),
    );

    // Resolve all 3 rounds
    act(() => result.current.markResolved('correct'));
    act(() => vi.advanceTimersByTime(0));
    act(() => result.current.markResolved('correct'));
    act(() => vi.advanceTimersByTime(0));
    act(() => result.current.markResolved('correct'));

    expect(result.current.phase).toBe('game-over');
    expect(result.current.isLastRound).toBe(true);
    vi.useRealTimers();
  });

  it('dispatches ADVANCE_ROUND to reducer', () => {
    // Assert dispatch called with { type: 'ADVANCE_ROUND', tiles, zones }
  });

  it('dispatches COMPLETE_GAME on last round', () => {
    // Assert dispatch called with { type: 'COMPLETE_GAME' }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/game-engine/useGameRound.test.ts --reporter=verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement useGameRound**

```ts
// src/lib/game-engine/useGameRound.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';
import type { GameEvent } from '@/types/game-events';

type RoundOutcome = 'correct' | 'timeout' | 'skip';

type UseGameRoundOptions<TRound> = {
  rounds: TRound[];
  advanceDelayMs?: number;
  levelBoundaries?: number[];
  roundIdAccessor?: (round: TRound) => string;
  itemIdAccessor?: (round: TRound) => string;
  gameId: string;
  sessionId?: string;
  profileId?: string;
};

type UseGameRoundReturn<TRound> = {
  currentRound: TRound;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  phase: 'playing' | 'round-complete' | 'level-complete' | 'game-over';
  isLastRound: boolean;
  markResolved: (outcome: RoundOutcome) => void;
};

export const useGameRound = <TRound>(
  options: UseGameRoundOptions<TRound>,
): UseGameRoundReturn<TRound> => {
  const {
    rounds,
    advanceDelayMs = 750,
    levelBoundaries,
    roundIdAccessor,
    itemIdAccessor,
    gameId,
    sessionId = '',
    profileId = '',
  } = options;

  const [roundIndex, setRoundIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<
    'playing' | 'round-complete' | 'level-complete' | 'game-over'
  >('playing');

  const currentRound = rounds[roundIndex];
  const isLastRound = roundIndex >= rounds.length - 1;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeBaseEvent = useCallback(
    () => ({
      gameId,
      sessionId,
      profileId,
      timestamp: Date.now(),
      roundIndex,
    }),
    [gameId, sessionId, profileId, roundIndex],
  );

  const getRoundId = useCallback(
    (round: TRound, idx: number) =>
      roundIdAccessor?.(round) ?? `round-${idx}`,
    [roundIdAccessor],
  );

  const getItemId = useCallback(
    (round: TRound, idx: number) =>
      itemIdAccessor?.(round) ?? `item-${idx}`,
    [itemIdAccessor],
  );

  // Emit round:shown on mount and on each advance
  useEffect(() => {
    if (!currentRound) return;
    getGameEventBus().emit({
      ...makeBaseEvent(),
      type: 'round:shown',
      roundId: getRoundId(currentRound, roundIndex),
      itemId: getItemId(currentRound, roundIndex),
    } as GameEvent);
  }, [roundIndex, currentRound, makeBaseEvent, getRoundId, getItemId]);

  const markResolved = useCallback(
    (outcome: RoundOutcome) => {
      if (phase !== 'playing') return;

      getGameEventBus().emit({
        ...makeBaseEvent(),
        type: 'round:resolved',
        roundId: getRoundId(currentRound, roundIndex),
        outcome,
      } as GameEvent);

      if (isLastRound) {
        setPhase('game-over');
        return;
      }

      const nextIndex = roundIndex + 1;
      const isLevelBoundary =
        levelBoundaries?.includes(nextIndex) ?? false;

      setPhase(isLevelBoundary ? 'level-complete' : 'round-complete');

      timerRef.current = globalThis.setTimeout(() => {
        if (isLevelBoundary) {
          setLevelIndex((prev) => prev + 1);
        }
        setRoundIndex(nextIndex);
        setPhase('playing');
      }, advanceDelayMs);
    },
    [
      phase,
      makeBaseEvent,
      getRoundId,
      currentRound,
      roundIndex,
      isLastRound,
      levelBoundaries,
      advanceDelayMs,
    ],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) globalThis.clearTimeout(timerRef.current);
    };
  }, []);

  return {
    currentRound,
    roundIndex,
    levelIndex,
    totalRounds: rounds.length,
    phase,
    isLastRound,
    markResolved,
  };
};
```

**Note to implementer:** The hook above owns index/phase/timing state internally. In the final implementation, the game component that calls `useGameRound` is responsible for building the next round's tiles/zones and dispatching `ADVANCE_ROUND` / `COMPLETE_GAME` to the `answerGameReducer`. The hook should accept a `buildNextRound` callback or return enough info for the game to do this. Alternatively, the hook can dispatch to the reducer directly if it receives `dispatch` as an option. Decide based on what minimizes coupling — the spec says the hook "dispatches ADVANCE_ROUND and COMPLETE_GAME actions" (§1 State Ownership).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-engine/useGameRound.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/useGameRound.ts src/lib/game-engine/useGameRound.test.ts
git commit -m "feat(game-engine): add useGameRound hook with round lifecycle + event emission"
```

---

## Task 4: useGameRound — Level Boundaries

**Files:**

- Modify: `src/lib/game-engine/useGameRound.test.ts` (add level tests)
- Modify: `src/lib/game-engine/useGameRound.ts` (if needed)

- [ ] **Step 1: Write failing tests**

```ts
describe('useGameRound — level boundaries', () => {
  const rounds = Array.from({ length: 6 }, (_, i) => ({
    id: `r${i}`,
    word: `word${i}`,
  }));
  const levelBoundaries = [3]; // Level 1: rounds 0-2, Level 2: rounds 3-5

  it('tracks levelIndex starting at 0', () => {
    const { result } = renderHook(() =>
      useGameRound({
        rounds,
        levelBoundaries,
        advanceDelayMs: 0,
        gameId: 'test',
      }),
    );
    expect(result.current.levelIndex).toBe(0);
  });

  it('sets phase to level-complete at boundary', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameRound({
        rounds,
        levelBoundaries,
        advanceDelayMs: 0,
        gameId: 'test',
      }),
    );

    // Advance through rounds 0, 1, 2
    for (let i = 0; i < 3; i++) {
      act(() => result.current.markResolved('correct'));
      act(() => vi.advanceTimersByTime(0));
    }
    // Round 2 resolved, next is round 3 which is a level boundary
    // Phase should be 'level-complete' before advance timer fires
    // (Actually: markResolved at round 2 → next is round 3 → boundary → level-complete)
    vi.useRealTimers();
  });

  it('increments levelIndex after level-complete delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameRound({
        rounds,
        levelBoundaries,
        advanceDelayMs: 750,
        gameId: 'test',
      }),
    );

    // Resolve through to the level boundary
    for (let i = 0; i < 3; i++) {
      act(() => result.current.markResolved('correct'));
      act(() => vi.advanceTimersByTime(750));
    }
    expect(result.current.levelIndex).toBe(1);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npx vitest run src/lib/game-engine/useGameRound.test.ts --reporter=verbose`
Expected: If Task 3's implementation already handles `levelBoundaries`, tests pass. If not, they fail and you implement the boundary check.

- [ ] **Step 3: Fix any failures**

Ensure the `markResolved` function checks if `nextIndex` is in `levelBoundaries` and sets phase to `'level-complete'` before the advance timer.

- [ ] **Step 4: Commit**

```bash
git add src/lib/game-engine/useGameRound.test.ts src/lib/game-engine/useGameRound.ts
git commit -m "feat(game-engine): useGameRound level boundary support for SortNumbers"
```

---

## Task 5: Reducer — firstActionAt + round:first-action

**Files:**

- Modify: `src/components/answer-game/types.ts` — add `firstActionAt` to state
- Modify: `src/components/answer-game/answer-game-reducer.ts` — track first action, emit event
- Test: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// In answer-game-reducer.test.ts, add:
describe('round:first-action detection', () => {
  it('emits round:first-action on first PLACE_TILE in a round', () => {
    // Place a tile when firstActionAt is null
    // Assert round:first-action emitted with kind: 'tile'
  });

  it('does not emit round:first-action on second PLACE_TILE', () => {
    // Place two tiles
    // Assert round:first-action emitted only once
  });

  it('emits with kind key on TYPE_TILE', () => {
    // Type a tile when firstActionAt is null
    // Assert kind: 'key'
  });

  it('resets firstActionAt on ADVANCE_ROUND', () => {
    // Place tile (sets firstActionAt)
    // Advance round
    // Assert firstActionAt is null again
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/answer-game/answer-game-reducer.test.ts --reporter=verbose`
Expected: FAIL — `firstActionAt` doesn't exist.

- [ ] **Step 3: Add firstActionAt to state**

In `src/components/answer-game/types.ts`, add to `AnswerGameState`:

```ts
firstActionAt: number | null;
```

In `makeInitialState`, set `firstActionAt: null`.

- [ ] **Step 4: Track first action in reducer**

In `answer-game-reducer.ts`, in the `PLACE_TILE` branch, after line 113:

```ts
case 'PLACE_TILE': {
  const isFirstAction = state.firstActionAt === null;
  // ... existing logic ...
  // After computing the new state, set firstActionAt if first action:
  const newFirstActionAt = isFirstAction ? Date.now() : state.firstActionAt;

  if (isFirstAction) {
    getGameEventBus().emit({
      type: 'round:first-action',
      gameId: state.config.gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex: state.roundIndex,
      roundId: `round-${state.roundIndex}`,
      kind: 'tile',
    } as GameEvent);
  }

  return { ...newState, firstActionAt: newFirstActionAt };
}
```

Same pattern for `TYPE_TILE` with `kind: 'key'`.

In `ADVANCE_ROUND`, reset: `firstActionAt: null`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/answer-game-reducer.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/types.ts src/components/answer-game/answer-game-reducer.ts src/components/answer-game/answer-game-reducer.test.ts
git commit -m "feat(reducer): track firstActionAt, emit round:first-action on first interaction"
```

---

## Task 6: Reducer — round:mistake Emission

**Files:**

- Modify: `src/components/answer-game/answer-game-reducer.ts:126-132` (wrong-placement branch)
- Test: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
describe('round:mistake emission', () => {
  it('emits round:mistake on wrong tile placement (reject mode)', () => {
    // Place wrong tile in reject mode
    // Assert round:mistake emitted with expectedTile, actualTile, slotId
  });

  it('emits round:mistake on wrong tile placement (lock mode)', () => {
    // Place wrong tile in lock-auto-eject mode
    // Assert round:mistake emitted
  });

  it('includes distractorSource from tile metadata', () => {
    // Place a distractor tile
    // Assert distractorSource matches tile.source
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — no `round:mistake` emission.

- [ ] **Step 3: Add round:mistake emission to wrong-placement branches**

In the `PLACE_TILE` branch, in both the `reject` path (line 126) and the `lock` path (line 186), emit:

```ts
getGameEventBus().emit({
  type: 'round:mistake',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  roundId: `round-${state.roundIndex}`,
  expectedTile: zone.expectedValue,
  actualTile: tile.value,
  slotId: action.zoneIndex,
  distractorSource:
    ((tile as Record<string, unknown>).source as string | null) ?? null,
} as GameEvent);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/answer-game/answer-game-reducer.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/answer-game-reducer.ts src/components/answer-game/answer-game-reducer.test.ts
git commit -m "feat(reducer): emit round:mistake on wrong tile placement with full SRS payload"
```

---

## Task 7: Visibility Change Tracking

**Files:**

- Create: `src/lib/game-engine/useVisibilityTracking.ts`
- Test: `src/lib/game-engine/useGameRound.test.ts` (add visibility tests)

- [ ] **Step 1: Write failing test**

```ts
describe('useVisibilityTracking', () => {
  it('emits round:visibility-change when document becomes hidden', () => {
    // Render hook
    // Simulate visibilitychange event with hidden = true
    // Assert round:visibility-change emitted with hidden: true
  });

  it('emits round:visibility-change when document becomes visible', () => {
    // Simulate visibilitychange with hidden = false
    // Assert round:visibility-change emitted with hidden: false
  });

  it('unsubscribes on unmount', () => {
    // Render and unmount
    // Simulate visibilitychange
    // Assert no event emitted after unmount
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useVisibilityTracking**

```ts
// src/lib/game-engine/useVisibilityTracking.ts
import { useEffect } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';
import type { GameEvent } from '@/types/game-events';

export const useVisibilityTracking = (
  gameId: string,
  sessionId = '',
  profileId = '',
): void => {
  useEffect(() => {
    const handler = () => {
      getGameEventBus().emit({
        type: 'round:visibility-change',
        gameId,
        sessionId,
        profileId,
        timestamp: Date.now(),
        roundIndex: 0,
        hidden: document.hidden,
      } as GameEvent);
    };
    document.addEventListener('visibilitychange', handler);
    return () =>
      document.removeEventListener('visibilitychange', handler);
  }, [gameId, sessionId, profileId]);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/game-engine/useGameRound.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/useVisibilityTracking.ts src/lib/game-engine/useGameRound.test.ts
git commit -m "feat(game-engine): add useVisibilityTracking for round:visibility-change events"
```

---

## Task 8: Slot Tap-Select Mode

**Files:**

- Modify: `src/components/answer-game/types.ts` — add `SELECT_SLOT`, `selectedSlotIds`
- Modify: `src/components/answer-game/answer-game-reducer.ts` — handle `SELECT_SLOT`
- Modify: `src/components/answer-game/Slot/Slot.tsx` — add `interactionMode` prop
- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts` — tap handler
- Test: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe('SELECT_SLOT action (tap-select mode)', () => {
  it('adds slot to selectedSlotIds on correct tap', () => {
    // Dispatch SELECT_SLOT for a correct tile
    // Assert selectedSlotIds contains the slot id
  });

  it('triggers round-complete when all correct slots selected', () => {
    // Select all correct tiles
    // Assert phase is 'round-complete'
  });

  it('increments retryCount on wrong tap', () => {
    // Dispatch SELECT_SLOT for a wrong tile
    // Assert retryCount incremented
    // Assert selectedSlotIds does NOT contain the slot
  });

  it('emits round:first-action with kind tap', () => {
    // First SELECT_SLOT in a round
    // Assert round:first-action emitted with kind: 'tap'
  });

  it('emits round:mistake on wrong tap', () => {
    // SELECT_SLOT wrong tile
    // Assert round:mistake emitted
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — `SELECT_SLOT` action doesn't exist.

- [ ] **Step 3: Add types**

In `src/components/answer-game/types.ts`:

Add to `AnswerGameState`:

```ts
selectedSlotIds: Set<string>;
```

Add to `AnswerGameAction` union:

```ts
| { type: 'SELECT_SLOT'; slotId: string; tileId: string }
```

In `makeInitialState`, set `selectedSlotIds: new Set()`.

- [ ] **Step 4: Implement SELECT_SLOT in reducer**

In `answer-game-reducer.ts`, add a new case:

```ts
case 'SELECT_SLOT': {
  const tile = state.allTiles.find((t) => t.id === action.tileId);
  if (!tile) return state;

  const zone = state.zones.find((z) => z.placedTileId === action.tileId);
  const isCorrect = tile.value === zone?.expectedValue;
  const isFirstAction = state.firstActionAt === null;

  if (isFirstAction) {
    getGameEventBus().emit({
      type: 'round:first-action',
      gameId: state.config.gameId,
      sessionId: '', profileId: '',
      timestamp: Date.now(),
      roundIndex: state.roundIndex,
      roundId: `round-${state.roundIndex}`,
      kind: 'tap',
    } as GameEvent);
  }

  if (isCorrect) {
    const next = new Set(state.selectedSlotIds);
    next.add(action.slotId);
    const allCorrectSelected = state.zones
      .filter((z) => z.placedTileId !== null)
      .every((z) => next.has(z.placedTileId!));
    return {
      ...state,
      selectedSlotIds: next,
      firstActionAt: isFirstAction ? Date.now() : state.firstActionAt,
      phase: allCorrectSelected ? resolveCompletionPhase(state) : 'playing',
    };
  }

  // Wrong tap
  getGameEventBus().emit({
    type: 'round:mistake',
    gameId: state.config.gameId,
    sessionId: '', profileId: '',
    timestamp: Date.now(),
    roundIndex: state.roundIndex,
    roundId: `round-${state.roundIndex}`,
    expectedTile: zone?.expectedValue ?? '',
    actualTile: tile.value,
    slotId: state.zones.indexOf(zone!),
    distractorSource: (tile as Record<string, unknown>).source as string | null ?? null,
  } as GameEvent);

  return {
    ...state,
    retryCount: state.retryCount + 1,
    firstActionAt: isFirstAction ? Date.now() : state.firstActionAt,
  };
}
```

Reset `selectedSlotIds: new Set()` in `ADVANCE_ROUND` and `INIT_ROUND`.

- [ ] **Step 5: Add interactionMode prop to Slot**

In `src/components/answer-game/Slot/Slot.tsx`, add to `SlotProps`:

```ts
interactionMode?: 'drag' | 'tap-select';
```

Default to `'drag'`. When `interactionMode === 'tap-select'`, wire an `onClick` handler that dispatches `SELECT_SLOT` instead of using `useDroppable`.

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/components/answer-game/ --reporter=verbose`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/answer-game/
git commit -m "feat(answer-game): add SELECT_SLOT action + tap-select Slot mode

Slot gains interactionMode prop ('drag' | 'tap-select'). Tap-select mode
uses selectedSlotIds Set, emits round:first-action and round:mistake."
```

---

## Task 9: WordSpell Migration to useGameRound

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx:128-182` (round lifecycle useEffect)
- Test: `src/games/word-spell/WordSpell/WordSpell.test.tsx` (existing tests must pass)

- [ ] **Step 1: Run existing WordSpell tests as baseline**

Run: `npx vitest run src/games/word-spell/ --reporter=verbose`
Expected: PASS — baseline before migration.

- [ ] **Step 2: Replace round lifecycle with useGameRound**

Replace the ~55 LOC useEffect (lines 128-182) with:

```ts
const { phase, markResolved, roundIndex, isLastRound } = useGameRound({
  rounds: roundOrder.map((i) => rounds[i]),
  advanceDelayMs: 750,
  gameId: wordSpellConfig.gameId,
  roundIdAccessor: (r) => r.word,
  itemIdAccessor: (r) => r.word,
});
```

The `useGameRound` hook replaces:

- The `phase === 'round-complete'` check
- The completion token
- The 750ms delay
- The `ADVANCE_ROUND` / `COMPLETE_GAME` dispatch logic
- The next-round building logic

**Important:** The game still needs to build `nextTiles` and `nextZones` via `buildTilesAndZones()` or `buildSentenceGapRound()`. Pass a `buildNextRound` callback to useGameRound, or have useGameRound call back with the next round object and let the game build tiles.

Call `markResolved('correct')` from the existing confetti-ready path where `phase === 'round-complete'` was previously detected. The detection point moves to wherever `allFilledCorrectly` is confirmed in the reducer.

- [ ] **Step 3: Run WordSpell tests**

Run: `npx vitest run src/games/word-spell/ --reporter=verbose`
Expected: PASS — all existing tests pass unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/games/word-spell/
git commit -m "refactor(WordSpell): migrate round lifecycle to useGameRound

Replaces ~55 LOC of manual round-advance logic with useGameRound hook.
All existing tests pass unchanged."
```

---

## Task 10: NumberMatch Migration to useGameRound

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx:151-207`
- Test: `src/games/number-match/NumberMatch/NumberMatch.test.tsx`

- [ ] **Step 1: Run existing NumberMatch tests as baseline**

Run: `npx vitest run src/games/number-match/ --reporter=verbose`
Expected: PASS

- [ ] **Step 2: Replace round lifecycle with useGameRound**

Same pattern as WordSpell. Replace the ~55 LOC useEffect with:

```ts
const { phase, markResolved, roundIndex, isLastRound } = useGameRound({
  rounds: roundOrder.map((i) => numberMatchConfig.rounds[i]),
  advanceDelayMs: 750,
  gameId: numberMatchConfig.gameId,
  roundIdAccessor: (r) => String(r.value),
  itemIdAccessor: (r) => String(r.value),
});
```

Build next-round tiles/zones via `buildNumeralRound()` in a callback.

- [ ] **Step 3: Run NumberMatch tests**

Run: `npx vitest run src/games/number-match/ --reporter=verbose`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/games/number-match/
git commit -m "refactor(NumberMatch): migrate round lifecycle to useGameRound"
```

---

## Task 11: SortNumbers Migration to useGameRound

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:131-205`
- Test: `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx`

This is the most complex migration because SortNumbers has level progression and emits `game:round-advance` / `game:level-advance`.

- [ ] **Step 1: Run existing SortNumbers tests as baseline**

Run: `npx vitest run src/games/sort-numbers/ --reporter=verbose`
Expected: PASS

- [ ] **Step 2: Replace round lifecycle with useGameRound**

```ts
const { phase, markResolved, roundIndex, levelIndex, isLastRound } =
  useGameRound({
    rounds: roundOrder.map((i) => sortNumbersConfig.rounds[i]),
    advanceDelayMs: resolveTiming(
      'roundAdvanceDelay',
      skin,
      sortNumbersConfig.timing,
    ),
    levelBoundaries: sortNumbersConfig.levelMode?.boundaries,
    gameId: sortNumbersConfig.gameId,
    roundIdAccessor: (r) => r.sequence.join('-'),
    itemIdAccessor: (r) => r.sequence.join('-'),
  });
```

**Backward compatibility:** The existing `game:round-advance` and `game:level-advance` events must continue to fire. Option A: useGameRound emits them internally. Option B: the game emits them in a `useEffect` that watches `roundIndex` and `levelIndex`. Option B is simpler and preserves existing behavior without coupling useGameRound to game-specific events.

- [ ] **Step 3: Preserve existing event emission**

Add a `useEffect` that watches `roundIndex` changes and emits `game:round-advance`:

```ts
const prevRoundIndex = useRef(roundIndex);
useEffect(() => {
  if (prevRoundIndex.current !== roundIndex && roundIndex > 0) {
    getGameEventBus().emit({
      type: 'game:round-advance',
      gameId: sortNumbersConfig.gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex,
    });
  }
  prevRoundIndex.current = roundIndex;
}, [roundIndex, sortNumbersConfig.gameId]);
```

Same pattern for `game:level-advance` watching `levelIndex`.

- [ ] **Step 4: Run SortNumbers tests**

Run: `npx vitest run src/games/sort-numbers/ --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/
git commit -m "refactor(SortNumbers): migrate round lifecycle to useGameRound

Preserves game:round-advance and game:level-advance events for backward
compatibility. Level boundaries passed to useGameRound for level tracking."
```

---

## Task 12: Architecture Docs Update

**Files:**

- Modify: `src/lib/game-engine/GameEngine.reference.mdx`
- Modify: `src/lib/game-engine/GameEngine.flows.mdx`

Per CLAUDE.md: "When modifying game state logic — update the co-located `.mdx` docs in the same PR."

- [ ] **Step 1: Load the update-architecture-docs skill**

Invoke `update-architecture-docs` to get guided prompts.

- [ ] **Step 2: Update GameEngine.reference.mdx**

Add a section documenting:

- `useGameRound` API (options, return type)
- `round:*` event namespace
- Tap-select Slot mode
- `firstActionAt` tracking

- [ ] **Step 3: Update GameEngine.flows.mdx**

Add a flow diagram for the round lifecycle:

```text
mount → round:shown → playing → markResolved → round:resolved
  → round-complete → (delay) → ADVANCE_ROUND → round:shown → playing
  → ... → game-over → COMPLETE_GAME
```

- [ ] **Step 4: Run markdown lint**

Run: `yarn fix:md`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/*.mdx
git commit -m "docs(game-engine): document useGameRound API and round:* event lifecycle"
```

---

## Task 13: Final Integration + Smoke Test

- [ ] **Step 1: Run full typecheck**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: PASS — all tests pass including WordSpell, NumberMatch, SortNumbers.

- [ ] **Step 3: Run lint**

Run: `yarn fix:md && yarn lint`
Expected: PASS

- [ ] **Step 4: Start dev server and verify**

Run: `yarn dev`

Verify:

- WordSpell rounds advance correctly (same behavior as before)
- NumberMatch rounds advance correctly
- SortNumbers levels + rounds advance, direction label changes
- `game:round-advance` still fires in SortNumbers (check console or event bus spy)
- All four games compile and run without errors

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final integration fixes for useGameRound extraction"
```
