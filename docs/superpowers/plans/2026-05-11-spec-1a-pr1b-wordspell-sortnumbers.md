# Spec 1a — PR 1b: WordSpell + SortNumbers XState Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate **WordSpell** and **SortNumbers** end-to-end to XState-first by mirroring NumberMatch's PR 1a pattern. Add the `levelComplete` machine state for SortNumbers' level progression. Drop `useGameSounds` from both games and gate overlays directly on `engine.phase`. Populate `firstActionAt`/`selectedSlotIds` placeholder fields in both new machines (shape parity with NumberMatch). Append WordSpell + SortNumbers sections to the engine architecture MDX. **Do not** delete `answer-game-reducer.ts` (PR 1c owns that).

**Architecture:** Per-game XState machine context owns all per-game state (tiles, zones, drag, retryCount, roundIndex, levelIndex, phase). The game component lifts the engine into an inner `<Game>Instance` keyed by `sessionEpoch` so "Play again" remounts the actor cleanly. `<AnswerGameProvider engineDispatch={...} />` continues to mirror reducer actions into the machine until PR 1c removes the reducer.

**Tech Stack:** XState v5 (`xstate@5`, `@xstate/react@5`), Vitest, React 18, AnswerGame primitive, existing `useGameEngine` hook from PR 1a.

**Reference implementation:** `worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/number-match/{definition.ts,definition.test.ts,NumberMatch/NumberMatch.tsx}` and the engine-bridge prop on `worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/components/answer-game/AnswerGameProvider.tsx` (lines 56–115).

---

## Spec Deltas (PR 1b scope reductions)

The handoff prompt described a broader scope than PR 1b can land in one PR. The following deltas are intentional and recorded so the deferred work lands in a coherent follow-up (PR 1b-bis).

1. **`useGameRound` adoption is deferred to PR 1b-bis.** The hook does not exist in the codebase yet; only the spec + 2026-05-11 Spec Delta are written. Building it (with reducer + engine dual paths per Spec Delta) is itself ~1–2 days. PR 1b ships the XState foundation that PR 1b-bis can then adopt without further game-component surgery. **Why now is fine:** WordSpell and SortNumbers already have working round-advance `useEffect`s; rewriting them twice (once for engine direct, again for `useGameRound`) is churn. PR 1b uses the same engine-direct pattern as NumberMatch in PR 1a.

2. **`round:first-action`, `round:mistake`, `round:resolved` event emission is deferred to PR 1b-bis.** The `round:*` event types do not exist in `src/types/game-events.ts`. The `GameEventBus` wildcard support for `round:*` is also unbuilt. PR 1b populates the context fields (`firstActionAt`, `selectedSlotIds`) so the shape is ready for PR 1b-bis to wire emission. **Why now is fine:** no current subscriber (SRS, lifecycle TTS) consumes these events; they only matter when `useGameRound` + the bus changes land. Populating the context shape now keeps PR 1b-bis a pure wiring PR.

3. **`firstActionAt` and `selectedSlotIds` are placeholder fields in PR 1b (reset on init/advance only, no timestamp write).** NumberMatch's PR 1a machine already initialises them to `null` / `new Set()` and resets them on `INIT_ROUND` / `ADVANCE_ROUND`. WordSpell and SortNumbers do the same. The actual `firstActionAt: Date.now()` write on first interaction and `selectedSlotIds` toggle on `SELECT_SLOT` land in PR 1b-bis alongside the event emission. **Why now is fine:** zero call sites read these fields today; the contract is "field exists with correct type and reset cadence."

4. **`buildRound` stays a passthrough in WordSpell + SortNumbers definitions (Spec Delta 6 from PR 1a continues).** Round construction stays in the React component (`buildSentenceGapRound`, `buildTilesAndZones`, `buildSortRound`). The component dispatches `ADVANCE_ROUND { tiles, zones }` and the machine's `advanceRoundState` assign action populates context. PR 1c lifts round construction into definition.ts once all three games are migrated. **Why now is fine:** matches the proven NumberMatch pattern; lifting now would need three game-specific closure shapes converged in one PR.

5. **`useGameSounds` deletion is absorbed in PR 1b** (PR 1a Spec Delta 1 deferred this here). After migration, no game consumes `useGameSounds`, so `useGameSounds.ts` + `useGameSounds.test.tsx` are deleted. **Why now is fine:** the gate-boolean pattern was a workaround for reducer-driven phase races; XState machines fire `playSound` declaratively from `entry: [...]` actions and overlays gate on `engine.phase` — both replace the hook completely.

6. **`answer-game-reducer.ts` is not deleted.** PR 1c owns reducer deletion. PR 1b keeps the reducer in place because the `engineDispatch` bridge requires `useReducer` to still run inside `AnswerGameProvider`. `Slot`, `LetterTileBank`, `SortNumbersTileBank`, and `useTouchKeyboardInput` still read reducer state via `AnswerGameStateContext`. The migrated games read primary state from `engine.context`, but the surrounding answer-game primitives keep their reducer-backed reads until PR 1c.

7. **WordSpell's `slotInteraction` stays mode-driven (`'free-swap' | 'ordered'`).** The current logic — `mode === 'sentence-gap' ? 'free-swap' : 'ordered'` — is preserved in the migrated component. The machine itself does not branch on slotInteraction; the value is forwarded to `AnswerGameConfig` so existing `Slot` rendering keeps working.

---

## File Structure

### New files

- `src/games/word-spell/definition.ts` — XState machine + `wordSpellDefinition: GameDefinition`. ~350 lines (mirrors NumberMatch's shape; no level support).
- `src/games/word-spell/definition.test.ts` — Machine-level tests using `createActor + send + getSnapshot + waitFor`. ~300 lines.
- `src/games/sort-numbers/definition.ts` — XState machine + `sortNumbersDefinition: GameDefinition`. Adds `levelComplete` state + `ADVANCE_LEVEL` event handler. ~400 lines.
- `src/games/sort-numbers/definition.test.ts` — Machine-level tests including level progression. ~350 lines.
- `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx` — Component-level tests (currently SortNumbers has no `.tsx` test). Includes single-mount regression mirroring NumberMatch's U4. ~120 lines.

### Modified files

- `src/games/word-spell/WordSpell/WordSpell.tsx` — Refactor to lift engine into `WordSpellInstance` keyed by `sessionEpoch`. Pass `engine.send` (wrapped via `useRef`) to `<AnswerGame engineDispatch={...}>`. Drop `useGameSounds`. Read `phase`, `roundIndex`, `retryCount`, `zones` from `engine.context`. Gate overlays on `engine.phase === 'roundComplete' | 'gameOver'`. Round-advance `useEffect` watches `engine.phase === 'waitingForNext'` and dispatches `ADVANCE_ROUND` via the reducer dispatch (mirrored to engine). ~-50 lines, +100 lines net.
- `src/games/word-spell/WordSpell/WordSpell.test.tsx` — Rewrite assertions that consumed reducer state to use DOM queries against engine-driven phase. Add U4 single-mount regression test mirroring NumberMatch's pattern. ~30–50 lines changed.
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — Same shape as WordSpell refactor + handle `levelComplete` phase (camelCase) for `LevelCompleteOverlay`. Preserve `game:level-advance` event emission (move from `handleNextLevel` to engine `emit` action). Round-advance dispatches `ADVANCE_LEVEL` via the reducer mirror.
- `src/games/number-match/definition.ts` — No machine-shape changes; tiny clean-up: remove the `// PR 1b placeholder (no-op in PR 1a)` comment on `selectSlot` assign (it stays a no-op until PR 1b-bis). Note `firstActionAt`/`selectedSlotIds` placeholders are already documented in PR 1a; no real-time write yet.
- `src/components/answer-game/useGameSounds.ts` — Deleted (no consumers after WordSpell + SortNumbers migration).
- `src/components/answer-game/useGameSounds.test.tsx` — Deleted (no production consumers).
- `src/lib/game-engine/GameEngine.flows.mdx` — Append two sections: "WordSpell phase machine" and "SortNumbers phase machine (with levelComplete)". Cross-link to NumberMatch's canonical section.
- `src/lib/game-engine/GameEngine.reference.mdx` — Append context shape tables for `WordSpellEngineContext` and `SortNumbersEngineContext`.
- `src/games/word-spell/WordSpell/WordSpell.flows.mdx` — Replace the legacy reducer-flow diagram with an XState-driven one (file exists; update in place).
- `src/games/sort-numbers/SortNumbers/SortNumbers.flows.mdx` — Create new co-located flow doc (file doesn't exist; create).

### Test files

- `src/games/word-spell/definition.test.ts` — new (machine-level, see Tasks 2–3).
- `src/games/sort-numbers/definition.test.ts` — new (machine-level, see Tasks 7–8).
- `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx` — new (component-level, see Task 10).
- `src/games/word-spell/WordSpell/WordSpell.test.tsx` — updated assertions + U4 (Task 5).
- `src/components/answer-game/answer-game-reducer.test.ts` — unchanged in PR 1b. PR 1c moves out the WordSpell + SortNumbers cases and deletes the file alongside the reducer.

### Deleted files

- `src/components/answer-game/useGameSounds.ts`
- `src/components/answer-game/useGameSounds.test.tsx`

---

## Required Skills For Executors

Load these skills into the implementer's context before writing matching files (per the CLAUDE.md plan-overrides-skill rule):

- `superpowers:test-driven-development` — every feature step is red → green → refactor.
- `write-storybook` — if any story file is touched (none planned in PR 1b; flag if needed).
- `write-e2e-vr-tests` — if any `tests-vr/` or `tests-e2e/` file is touched (none planned).
- `update-architecture-docs` — before editing `*.flows.mdx` or `*.reference.mdx` (Task 13).

---

## Task 0: Worktree And Branch

**Files:** none (environment setup only).

- [ ] **Step 1: Confirm you are in the PR 1b worktree on the right branch.**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
git rev-parse --abbrev-ref HEAD
```

Expected output: `feat/spec-1a-pr1b-wordspell-sortnumbers`

If the branch is different, stop and ask the user. Do not proceed.

- [ ] **Step 2: Confirm clean working tree against `origin/master`.**

```bash
git fetch origin --quiet
git status -sb
git log --oneline origin/master..HEAD | head -5
```

Expected: branch is at `origin/master` (or ahead by your own previous commits), working tree clean.

- [ ] **Step 3: Install dependencies and verify baseline tests pass.**

```bash
yarn install
yarn test --run src/games/number-match/definition.test.ts
yarn typecheck
```

Expected: all NumberMatch machine tests pass (29 tests in the canonical reference file), typecheck clean. If anything fails, stop and ask — you cannot distinguish your bugs from a broken baseline.

---

## Task 1: WordSpell Machine Skeleton + INIT_ROUND

**Files:**

- Create: `src/games/word-spell/definition.ts`
- Create: `src/games/word-spell/definition.test.ts`

Mirror NumberMatch's `definition.ts` shape (1:1 except for the WordSpell-specific concerns documented below).

**WordSpell-specific context fields:** none new beyond NumberMatch. WordSpell shares all the same context fields (`allTiles`, `bankTileIds`, `zones`, `activeSlotIndex`, `dragActiveTileId`, `dragHoverZoneIndex`, `dragHoverBankTileId`, `retryCount`, `roundIndex`, `levelIndex`, `totalRounds`, `maxLevels`, `wrongTileBehavior`, `isLevelMode`, `firstActionAt`, `selectedSlotIds`). The differences are:

- `levelIndex` and `maxLevels` are present but unused at runtime (`maxLevels: null` always).
- `isLevelMode` is always `false`.

- [ ] **Step 1: Write the failing test — INIT_ROUND seeds context.**

`src/games/word-spell/definition.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { wordSpellDefinition } from './definition';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { Actor, AnyStateMachine } from 'xstate';
import { buildEngineGuards } from '@/lib/game-engine/useGameEngine';

const tile = (id: string, value: string): TileItem => ({
  id,
  label: value,
  value,
});

const slot = (
  index: number,
  expectedValue: string,
  overrides: Partial<AnswerZone> = {},
): AnswerZone => ({
  id: `z${index}`,
  index,
  expectedValue,
  placedTileId: null,
  isWrong: false,
  isLocked: false,
  ...overrides,
});

// "cat" — three single-letter tiles to three slots.
const buildRound = () => ({
  tiles: [tile('t1', 'c'), tile('t2', 'a'), tile('t3', 't')],
  zones: [slot(0, 'c'), slot(1, 'a'), slot(2, 't')],
});

interface StartActorOptions {
  totalRounds?: number;
  wrongTileBehavior?: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

interface StartedActor {
  actor: Actor<AnyStateMachine>;
  mocks: {
    playSound: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
  };
  context: () => Record<string, unknown>;
  zones: () => AnswerZone[];
}

const liveActors: Actor<AnyStateMachine>[] = [];

const startActor = (options: StartActorOptions = {}): StartedActor => {
  const totalRounds = options.totalRounds ?? 3;
  const guards = buildEngineGuards(totalRounds, totalRounds);
  const mocks = {
    playSound: vi.fn(),
    speak: vi.fn(),
    completeGame: vi.fn(),
  };
  const actor = createActor(
    wordSpellDefinition.machine.provide({
      guards,
      actions: mocks,
    }),
    {
      input: {
        totalRounds,
        maxLevels: null,
        wrongTileBehavior:
          options.wrongTileBehavior ?? 'lock-auto-eject',
      },
    },
  ) as Actor<AnyStateMachine>;
  actor.start();
  liveActors.push(actor);
  return {
    actor,
    mocks,
    context: () =>
      actor.getSnapshot().context as Record<string, unknown>,
    zones: () =>
      (actor.getSnapshot().context as { zones: AnswerZone[] }).zones,
  };
};

afterEach(() => {
  while (liveActors.length > 0) {
    liveActors.pop()?.stop();
  }
  vi.useRealTimers();
});

const initEvent = (tiles: TileItem[], zones: AnswerZone[]) =>
  ({ type: 'INIT_ROUND', tiles, zones }) as const;

describe('WordSpell machine — happy path', () => {
  it('starts in playing with roundIndex 0 after INIT_ROUND', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('playing');
    expect(context().roundIndex).toBe(0);
    expect(context().bankTileIds).toEqual(['t1', 't2', 't3']);
    expect(context().firstActionAt).toBeNull();
    expect(context().selectedSlotIds).toBeInstanceOf(Set);
    expect((context().selectedSlotIds as Set<string>).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails because `definition.ts` does not exist.**

```bash
yarn test --run src/games/word-spell/definition.test.ts
```

Expected: FAIL with `Cannot find module './definition'`.

- [ ] **Step 3: Create `src/games/word-spell/definition.ts` with the machine skeleton.**

```ts
import { assign, setup } from 'xstate';
import type {
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { GameDefinition } from '@/lib/game-engine/definition-types';

export interface WordSpellEngineContext {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  dragActiveTileId: string | null;
  dragHoverZoneIndex: number | null;
  dragHoverBankTileId: string | null;
  retryCount: number;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  isLevelMode: boolean;
  firstActionAt: number | null;
  selectedSlotIds: Set<string>;
}

interface WordSpellInput {
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

type WordSpellEvent =
  | { type: 'INIT_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'RESUME_ROUND'; draft: AnswerGameDraftState }
  | { type: 'PLACE_TILE'; tileId: string; zoneIndex: number }
  | {
      type: 'TYPE_TILE';
      tileId: string;
      value: string;
      zoneIndex: number;
    }
  | { type: 'REMOVE_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_TILES';
      fromZoneIndex: number;
      toZoneIndex: number;
    }
  | { type: 'EJECT_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_SLOT_BANK';
      zoneIndex: number;
      bankTileId: string;
    }
  | { type: 'SET_ACTIVE_SLOT'; zoneIndex: number }
  | { type: 'REJECT_TAP'; tileId: string; zoneIndex: number }
  | { type: 'SELECT_SLOT'; zoneIndex: number }
  | { type: 'SET_DRAG_ACTIVE'; tileId: string | null }
  | { type: 'SET_DRAG_HOVER'; zoneIndex: number | null }
  | { type: 'SET_DRAG_HOVER_BANK'; tileId: string | null }
  | { type: 'ADVANCE_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | {
      type: 'CELEBRATION_DONE';
      skipMethod?: 'play-again' | 'go-home';
    }
  | { type: 'GAME_OVER' };

// Identical helpers to NumberMatch's `definition.ts` — keep names + bodies.
const findNextActiveSlot = (
  zones: AnswerZone[],
  afterIndex: number,
  fallback: number,
): number => {
  const nextEmpty = zones.findIndex(
    (z, i) => i > afterIndex && z.placedTileId === null,
  );
  if (nextEmpty !== -1) return nextEmpty;
  const anyEmpty = zones.findIndex((z) => z.placedTileId === null);
  if (anyEmpty !== -1) return anyEmpty;
  const anyWrong = zones.findIndex((z) => z.isWrong);
  if (anyWrong !== -1) return anyWrong;
  return fallback;
};

const allFilledCorrectly = (zones: AnswerZone[]): boolean =>
  zones.length > 0 &&
  zones.every((z) => z.placedTileId !== null && !z.isWrong);

const wordSpellMachine = setup({
  types: {} as {
    context: WordSpellEngineContext;
    events: WordSpellEvent;
    input: WordSpellInput;
  },
  guards: {
    allFilledCorrectly: ({ context }) =>
      allFilledCorrectly(context.zones),
    canEject: ({ context, event }) => {
      if (event.type !== 'EJECT_TILE') return false;
      const zone = context.zones[event.zoneIndex];
      if (!zone) return false;
      return zone.isWrong || zone.isLocked;
    },
    isLastRound: () => false,
    isMidLevelRound: () => false,
    isLastRoundOfLevel: () => false,
  },
  actions: {
    speak: (_, _params: { lifecycleEvent: string }) => {},
    playSound: (_, _params: { sound: string }) => {},
    completeGame: () => {},
    emit: (_, _params: { event: unknown }) => {},

    initRound: assign(({ event }) => {
      if (event.type !== 'INIT_ROUND') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
        roundIndex: 0,
        firstActionAt: null,
        selectedSlotIds: new Set<string>(),
      } satisfies Partial<WordSpellEngineContext>;
    }),

    // Remaining assign actions are 1:1 with NumberMatch's. See Task 2.
    resumeRound: assign(() => ({})),
    placeTile: assign(() => ({})),
    typeTile: assign(() => ({})),
    removeTile: assign(() => ({})),
    swapTiles: assign(() => ({})),
    ejectTile: assign(() => ({})),
    swapSlotBank: assign(() => ({})),
    setActiveSlot: assign(() => ({})),
    rejectTap: assign(() => ({})),
    selectSlot: assign(() => ({})),
    setDragActive: assign(() => ({})),
    setDragHover: assign(() => ({})),
    setDragHoverBank: assign(() => ({})),
    incrementRoundIndex: assign(() => ({})),
    advanceRoundState: assign(() => ({})),
  },
}).createMachine({
  id: 'word-spell',
  initial: 'playing',
  context: ({ input }) => ({
    allTiles: [],
    bankTileIds: [],
    zones: [],
    activeSlotIndex: 0,
    dragActiveTileId: null,
    dragHoverZoneIndex: null,
    dragHoverBankTileId: null,
    retryCount: 0,
    roundIndex: 0,
    levelIndex: 0,
    totalRounds: input.totalRounds,
    maxLevels: input.maxLevels,
    wrongTileBehavior: input.wrongTileBehavior,
    isLevelMode: input.maxLevels !== null,
    firstActionAt: null,
    selectedSlotIds: new Set<string>(),
  }),
  on: {
    INIT_ROUND: { actions: 'initRound' },
    RESUME_ROUND: { actions: 'resumeRound' },
    GAME_OVER: { target: '.gameOver' },
  },
  states: {
    playing: {
      always: [
        { guard: 'allFilledCorrectly', target: 'roundComplete' },
      ],
      on: {
        PLACE_TILE: { actions: 'placeTile' },
        TYPE_TILE: { actions: 'typeTile' },
        REMOVE_TILE: { actions: 'removeTile' },
        SWAP_TILES: { actions: 'swapTiles' },
        EJECT_TILE: { guard: 'canEject', actions: 'ejectTile' },
        SWAP_SLOT_BANK: { actions: 'swapSlotBank' },
        SET_ACTIVE_SLOT: { actions: 'setActiveSlot' },
        REJECT_TAP: { actions: 'rejectTap' },
        SELECT_SLOT: { actions: 'selectSlot' },
        SET_DRAG_ACTIVE: { actions: 'setDragActive' },
        SET_DRAG_HOVER: { actions: 'setDragHover' },
        SET_DRAG_HOVER_BANK: { actions: 'setDragHoverBank' },
      },
    },
    roundComplete: {
      entry: [
        { type: 'playSound', params: { sound: 'round-complete' } },
      ],
      after: {
        750: [
          { guard: 'isLastRound', target: 'gameOver' },
          { target: 'waitingForNext' },
        ],
      },
      on: {
        CELEBRATION_DONE: [
          { guard: 'isLastRound', target: 'gameOver' },
          { target: 'waitingForNext' },
        ],
      },
    },
    waitingForNext: {
      on: {
        ADVANCE_ROUND: {
          actions: ['incrementRoundIndex', 'advanceRoundState'],
          target: 'playing',
        },
      },
    },
    gameOver: {
      entry: [
        { type: 'playSound', params: { sound: 'game-complete' } },
        { type: 'speak', params: { lifecycleEvent: 'game.over' } },
        'completeGame',
      ],
    },
  },
});

export const wordSpellDefinition: GameDefinition = {
  id: 'word-spell',
  interaction: 'drag-to-slot',
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  machine: wordSpellMachine,
};
```

This skeleton has all assign actions stubbed; Task 2 fills them in.

- [ ] **Step 4: Run the test — confirm it passes.**

```bash
yarn test --run src/games/word-spell/definition.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/games/word-spell/definition.ts src/games/word-spell/definition.test.ts
git commit -m "feat(word-spell): scaffold XState machine skeleton

PR 1b U1: introduces wordSpellMachine + wordSpellDefinition mirroring
NumberMatch's PR 1a shape. Assign actions are stubs in this commit;
Task 2 fills them in."
```

---

## Task 2: WordSpell Assign Actions (Port From NumberMatch)

**Files:**

- Modify: `src/games/word-spell/definition.ts`
- Modify: `src/games/word-spell/definition.test.ts`

Copy every assign-action body from `src/games/number-match/definition.ts` (lines 117–527) into the WordSpell machine. The bodies are 100% identical at the machine level — they operate on the shared `AnswerZone` + `TileItem` types and have no number-specific knowledge.

- [ ] **Step 1: Write the failing tests — happy-path event handlers.**

Append to `src/games/word-spell/definition.test.ts`:

```ts
describe('WordSpell machine — happy path', () => {
  it('PLACE_TILE on correct slot updates placedTileId, removes tile from bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(context().bankTileIds).toEqual(['t2', 't3']);
  });

  it('TYPE_TILE on empty slot creates a virtual tile and marks correct', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: 'c',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBe('typed-z0');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(
      (context().allTiles as TileItem[]).some(
        (t) => t.id === 'typed-z0',
      ),
    ).toBe(true);
  });

  it('REMOVE_TILE on placed slot returns real tile to bank and clears slot', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t1');
  });

  it('completing all zones via PLACE_TILE transitions atomically to roundComplete', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
  });

  it('roundComplete entry fires playSound("round-complete")', () => {
    const { actor, mocks } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(mocks.playSound).toHaveBeenCalledTimes(1);
    expect(mocks.playSound.mock.calls[0]?.[1]).toEqual({
      sound: 'round-complete',
    });
  });

  it('after 750ms in roundComplete on last round, advances to gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({ totalRounds: 1 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.playSound).toHaveBeenCalledWith(expect.anything(), {
      sound: 'game-complete',
    });
    expect(mocks.speak).toHaveBeenCalledWith(expect.anything(), {
      lifecycleEvent: 'game.over',
    });
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('ADVANCE_ROUND from waitingForNext increments roundIndex and returns to playing', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });

    const nextTiles = [
      tile('t4', 'd'),
      tile('t5', 'o'),
      tile('t6', 'g'),
    ];
    const nextZones = [slot(0, 'd'), slot(1, 'o'), slot(2, 'g')];
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: nextTiles,
      zones: nextZones,
    });

    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(1);
    expect(context().allTiles).toEqual(nextTiles);
    expect(context().retryCount).toBe(0);
    expect((context().selectedSlotIds as Set<string>).size).toBe(0);
    expect(context().firstActionAt).toBeNull();
  });
});

describe('WordSpell machine — edge cases', () => {
  it('PLACE_TILE on wrong slot (lock-auto-eject) locks the tile, bumps retry', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t2');
    expect(zones()[0]?.isWrong).toBe(true);
    expect(zones()[0]?.isLocked).toBe(true);
    expect(context().retryCount).toBe(1);
  });

  it('TYPE_TILE with wrong value (reject mode) bumps retryCount, leaves slot empty', () => {
    const { actor, zones, context } = startActor({
      wrongTileBehavior: 'reject',
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: 'x',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().retryCount).toBe(1);
  });

  it('EJECT_TILE on a wrong-locked slot clears it and returns tile to bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t2');
  });

  it('SWAP_TILES exchanges two placed slots and recomputes correctness', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 1 });
    actor.send({
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 1,
    });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[1]?.placedTileId).toBe('t2');
    expect(zones()[1]?.isWrong).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new tests — confirm they fail.**

```bash
yarn test --run src/games/word-spell/definition.test.ts
```

Expected: all 10 new tests FAIL (assign actions are stubs returning empty objects, so context never mutates).

- [ ] **Step 3: Port the assign-action bodies from NumberMatch.**

Replace every stub in `wordSpellMachine` with the corresponding body from `src/games/number-match/definition.ts`. Do not rename anything. Verbatim copy of:

- `resumeRound` (lines 135–150 of NumberMatch's definition.ts)
- `placeTile` (lines 152–242)
- `typeTile` (lines 244–304)
- `removeTile` (lines 306–335)
- `swapTiles` (lines 337–394)
- `ejectTile` (lines 396–442)
- `swapSlotBank` (lines 444–471)
- `setActiveSlot` (lines 473–480)
- `rejectTap` (lines 482–484)
- `selectSlot` (line 486)
- `setDragActive` (lines 488–497)
- `setDragHover` (lines 499–502)
- `setDragHoverBank` (lines 504–507)
- `incrementRoundIndex` (lines 509–511)
- `advanceRoundState` (lines 513–527)

Replace the type annotation `Partial<NumberMatchEngineContext>` with `Partial<WordSpellEngineContext>` in every `satisfies` clause.

- [ ] **Step 4: Run the tests — confirm green.**

```bash
yarn test --run src/games/word-spell/definition.test.ts
```

Expected: all tests PASS (initial INIT_ROUND test from Task 1 + 10 new happy/edge tests = 11 passing).

- [ ] **Step 5: Run typecheck to lock the context type contract.**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 6: Commit.**

```bash
git add src/games/word-spell/definition.ts src/games/word-spell/definition.test.ts
git commit -m "feat(word-spell): port assign actions from NumberMatch

PR 1b U2: copies all assign-action bodies from the canonical
NumberMatch machine into WordSpell. Bodies are 1:1 because they
operate on AnswerZone + TileItem (no number-specific logic).
Adds 10 machine-level tests covering PLACE_TILE / TYPE_TILE /
REMOVE_TILE / SWAP_TILES / EJECT_TILE / round transitions."
```

---

## Task 3: WordSpell Machine — Error / No-op + Integration Tests

**Files:**

- Modify: `src/games/word-spell/definition.test.ts`

Port the remaining test cases from NumberMatch's definition.test.ts that cover no-op paths and the multi-round integration path.

- [ ] **Step 1: Append no-op and integration tests.**

```ts
describe('WordSpell machine — error / no-op paths', () => {
  it('PLACE_TILE with unknown tileId is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'PLACE_TILE',
      tileId: 'nonexistent',
      zoneIndex: 0,
    });
    expect(context().zones).toEqual(before.zones);
    expect(context().bankTileIds).toEqual(before.bankTileIds);
  });

  it('PLACE_TILE with out-of-range zoneIndex is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 99 });
    expect(context().zones).toEqual(before.zones);
  });

  it('ADVANCE_ROUND while in playing is ignored', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(before.roundIndex);
  });

  it('drag events during roundComplete do not mutate context', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    const dragBefore = context().dragActiveTileId;
    actor.send({ type: 'SET_DRAG_ACTIVE', tileId: 'sneaky' });
    expect(context().dragActiveTileId).toBe(dragBefore);
  });
});

describe('WordSpell machine — integration', () => {
  it('completes a full three-round game ending in gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playThrough = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    playThrough();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);

    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('root-level GAME_OVER handler is defense-in-depth', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('playing');
    actor.send({ type: 'GAME_OVER' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });
});
```

- [ ] **Step 2: Run the tests — confirm green.**

```bash
yarn test --run src/games/word-spell/definition.test.ts
```

Expected: all tests PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/games/word-spell/definition.test.ts
git commit -m "test(word-spell): add no-op and integration tests

PR 1b U3: completes the WordSpell machine test coverage matching
NumberMatch's reference (no-op paths + 3-round integration +
defense-in-depth GAME_OVER handler)."
```

---

## Task 4: Refactor `WordSpell.tsx` To Engine

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

Mirror the structure of `NumberMatch.tsx` (lines 99–494 of the reference). Key changes:

1. Add `WordSpellInstance` inner component holding the engine, keyed by `sessionEpoch` (passed via outer `<WordSpellInstance key={sessionEpoch} />`).
2. `useGameEngine(wordSpellDefinition, { input, totalRounds, levelSize, envelope })`.
3. Wrap `engine.send` in a `useRef`-backed stable `engineDispatch` callback (NumberMatch.tsx lines 425–433).
4. Pass `engineDispatch` to `<AnswerGame engineDispatch={engineDispatch}>`.
5. `WordSpellSession` reads `phase`, `roundIndex`, `retryCount`, `zones` from `engine.context` and `engine` directly — drop `useAnswerGameContext()` reads in WordSpellSession.
6. Drop `useGameSounds()` and its return values (`confettiReady`, `gameOverReady`). Replace with `engine.phase === 'roundComplete'` / `'gameOver'` (camelCase!).
7. Replace the `setTimeout` advance loop (lines 128–182 of current WordSpell.tsx) with an effect that watches `engine.phase === 'waitingForNext'` and dispatches `ADVANCE_ROUND` via the reducer dispatch (NumberMatch.tsx lines 137–173 is the template).
8. Drop the manual `game:end` emit `useEffect` (lines 105–126 of current WordSpell.tsx) — the engine's `completeGame` action handles it via the side-effects executor.

- [ ] **Step 1: Refactor the component.**

Replace the body of `src/games/word-spell/WordSpell/WordSpell.tsx` following these structural rules. (No full code block here because the file is 543 lines and most pre-engine pre-amble — library resolution, persisted content, stale-draft toast — stays unchanged. Touch only `WordSpellSession` + the outer `WordSpell` to insert `WordSpellInstance`.)

Key invariants to preserve:

- `useLibraryRounds` and the persisted-content/stale-draft logic remain in the outer `WordSpell` component, unchanged.
- `sessionEpoch` keying continues to gate "Play again". After Task 4, `sessionEpoch` keys `WordSpellInstance` (the engine owner) instead of `AnswerGame` directly.
- `slotInteraction` still depends on `resolvedConfig.mode === 'sentence-gap'`.

Diff sketch (apply manually):

```tsx
// BEFORE (WordSpellSession, lines 73–78):
const { phase, roundIndex, retryCount, zones } = useAnswerGameContext();
const dispatch = useAnswerGameDispatch();
const { confettiReady, gameOverReady } = useGameSounds();

// AFTER (WordSpellSession, takes engine prop):
const engine: WordSpellEngine = props.engine;
const dispatch = useAnswerGameDispatch();
const phase = engine.phase;
const roundIndex = engine.roundIndex;
const retryCount = engine.retryCount;
const zones = engine.context.zones;
const showRoundComplete = phase === 'roundComplete';
const showGameOver = phase === 'gameOver';
```

```tsx
// BEFORE (lines 105–126 of current WordSpell.tsx — manual game:end emit):
useEffect(() => {
  if (phase !== 'game-over') return;
  getGameEventBus().emit({ type: 'game:end', ... });
}, [phase, ...]);

// AFTER: removed entirely — engine.completeGame action handles it.
```

```tsx
// BEFORE (lines 128–182 of current WordSpell.tsx — setTimeout advance loop):
useEffect(() => {
  if (phase !== 'round-complete' || !confettiReady) return;
  const timer = setTimeout(() => { ... dispatch ADVANCE_ROUND ... }, 750);
  return () => clearTimeout(timer);
}, [phase, confettiReady, ...]);

// AFTER: phase-driven (machine's after: 750 has already advanced phase
// to 'waitingForNext'):
useEffect(() => {
  if (engine.phase !== 'waitingForNext') return;
  const nextConfigIndex = roundOrder[engine.roundIndex + 1];
  const nextRound =
    nextConfigIndex === undefined ? undefined : rounds[nextConfigIndex];
  const word = nextRound?.word.trim() ?? '';
  if (!word) return;
  if (nextRound?.gaps && nextRound.gaps.length > 0) {
    const { tiles, zones } = buildSentenceGapRound(nextRound.gaps);
    dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
  } else {
    const { tiles, zones } = buildTilesAndZones(word, wordSpellConfig.tileUnit);
    dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
  }
}, [engine.phase, engine.roundIndex, roundOrder, rounds, dispatch, wordSpellConfig.tileUnit]);
```

```tsx
// Overlay gates — replace confettiReady / gameOverReady:
{skin.RoundCompleteEffect ? (
  <skin.RoundCompleteEffect visible={showRoundComplete} />
) : (
  <ScoreAnimation visible={showRoundComplete} />
)}
{showGameOver ? (
  skin.CelebrationOverlay ? (
    <skin.CelebrationOverlay {...} />
  ) : (
    <GameOverOverlay {...} />
  )
) : null}
```

```tsx
// Outer WordSpell component — wrap inner instance:
return (
  <div
    className={`game-container skin-${skin.id}`}
    style={skin.tokens as React.CSSProperties}
  >
    {skin.SceneBackground ? <skin.SceneBackground /> : null}
    <WordSpellInstance
      key={sessionEpoch}
      config={resolvedConfig}
      initialState={
        sessionEpoch === 0 && !staleDraft ? initialState : undefined
      }
      sessionId={sessionId}
      roundOrder={roundOrder}
      skin={skin}
      onRestartSession={() => setSessionEpoch((e) => e + 1)}
      tiles={tiles}
      zones={zones}
    />
  </div>
);

// New inner WordSpellInstance:
const WordSpellInstance = ({
  config,
  initialState,
  sessionId,
  roundOrder,
  skin,
  onRestartSession,
  tiles,
  zones,
}: WordSpellInstanceProps) => {
  const answerGameConfig = useMemo<AnswerGameConfig>(
    () => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      totalRounds: roundOrder.length,
      roundsInOrder: config.roundsInOrder,
      ttsEnabled: config.ttsEnabled,
      touchKeyboardInputMode: 'text',
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction:
        config.mode === 'sentence-gap' ? 'free-swap' : 'ordered',
    }),
    [
      /* ... */
    ],
  );

  const engine = useGameEngine<unknown, WordSpellEngineContext>(
    wordSpellDefinition,
    {
      input: {
        totalRounds: roundOrder.length,
        maxLevels: null,
        wrongTileBehavior: config.wrongTileBehavior,
      },
      totalRounds: roundOrder.length,
      levelSize: roundOrder.length,
      envelope: { gameId: config.gameId },
    },
  );

  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);
  const engineDispatch = useCallback(
    (action: AnswerGameAction) =>
      engineRef.current.send(action as never),
    [],
  );

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
      skin={skin}
      engineDispatch={engineDispatch}
    >
      <WordSpellSession
        wordSpellConfig={config}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={onRestartSession}
        engine={engine}
      />
    </AnswerGame>
  );
};
```

- [ ] **Step 2: Run typecheck.**

```bash
yarn typecheck
```

Expected: clean. Any TS errors mean the engineDispatch type or context casts don't line up — fix before proceeding.

- [ ] **Step 3: Run existing component tests against the refactor.**

```bash
yarn test --run src/games/word-spell/WordSpell/WordSpell.test.tsx
```

Expected: most existing tests still pass because they assert DOM structure (slots, tiles) that hasn't changed. Tests that asserted reducer-derived `phase` strings (kebab-case) will fail — Task 5 updates them.

- [ ] **Step 4: Commit (allowing failures in WordSpell.test.tsx).**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat(word-spell): refactor component to XState engine

PR 1b U4: lifts WordSpellInstance keyed by sessionEpoch; engine drives
phase, retryCount, zones via engine.context. Drops useGameSounds() —
overlays gate on engine.phase camelCase ('roundComplete' / 'gameOver').
Round-advance effect watches engine.phase === 'waitingForNext' and
dispatches ADVANCE_ROUND via reducer (mirrored to engine via
engineDispatch). game:end emit moves into engine.completeGame action.

WordSpell.test.tsx assertions are updated in U5."
```

---

## Task 5: Update `WordSpell.test.tsx` + Add U4 Single-Mount Regression

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.test.tsx`

Existing describe blocks: `WordSpell`, `WordSpell library levels recall`, `WordSpell stale-draft recovery toast`, `WordSpell Play again`. Update assertions that read reducer-driven phase or visibility booleans (`confettiReady`/`gameOverReady`) to use DOM queries against the engine-driven overlay.

- [ ] **Step 1: Add the U4 regression test.**

Append a new describe block:

```ts
describe('WordSpell round-complete overlay', () => {
  it('mounts the round-complete effect exactly once during the celebration window', async () => {
    const config: WordSpellConfig = {
      gameId: 'word-spell-test',
      component: 'WordSpell',
      inputMethod: 'type',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      mode: 'recall',
      tileUnit: 'letter',
      totalRounds: 3,
      roundsInOrder: true,
      ttsEnabled: false,
      rounds: [{ word: 'cat' }, { word: 'dog' }, { word: 'pig' }],
    };

    render(<WordSpell config={config} />);

    // Type 'c', 'a', 't' to complete round 1.
    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    });
    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    });
    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
    });

    const overlays = await screen.findAllByRole('status', {
      name: 'Round complete!',
    });
    expect(overlays).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the full WordSpell.test.tsx.**

```bash
yarn test --run src/games/word-spell/WordSpell/WordSpell.test.tsx
```

Expected: any test that previously matched reducer-driven `phase` strings (kebab-case `'round-complete'`, `'game-over'`) fails. The U4 test passes. The Play-again test should still pass because it asserts DOM structure.

- [ ] **Step 3: Fix the failing assertions to use DOM/engine state.**

Examples (search-and-replace pattern):

```ts
// Before:
expect(state.phase).toBe('round-complete');

// After (DOM-driven):
const overlay = await screen.findByRole('status', {
  name: 'Round complete!',
});
expect(overlay).toBeInTheDocument();
```

- [ ] **Step 4: Run the tests — confirm all pass.**

```bash
yarn test --run src/games/word-spell/WordSpell/WordSpell.test.tsx
```

Expected: all PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/games/word-spell/WordSpell/WordSpell.test.tsx
git commit -m "test(word-spell): port assertions to engine-driven DOM + add U4

PR 1b U5: rewrites reducer-state assertions in WordSpell.test.tsx
to DOM-driven engine queries. Adds U4 single-mount regression
mirroring NumberMatch — proves the round-complete overlay mounts
exactly once during the celebration window."
```

---

## Task 6: Sort Numbers Machine Skeleton + `levelComplete` State

**Files:**

- Create: `src/games/sort-numbers/definition.ts`
- Create: `src/games/sort-numbers/definition.test.ts`

SortNumbers diverges from WordSpell + NumberMatch in two ways:

1. **Level progression.** Adds `levelComplete` state, `ADVANCE_LEVEL` event, and a phase transition `roundComplete → levelComplete → waitingForNext` (when the level boundary is hit and `isMidLevelRound` is false but more levels remain).
2. **Distractor banks / level generators.** The machine doesn't know about generators; `ADVANCE_LEVEL` payload carries `tiles` + `zones` like `ADVANCE_ROUND`.

Phase transition logic:

```text
playing.always(allFilledCorrectly) → roundComplete
roundComplete.after(750):
  - guard(isLastRound)            → gameOver
  - guard(isLastRoundOfLevel)     → levelComplete
  - otherwise                     → waitingForNext
levelComplete:
  on(ADVANCE_LEVEL): ['incrementLevelIndex', 'advanceLevelState'] → playing
  on(COMPLETE_GAME): → gameOver
waitingForNext:
  on(ADVANCE_ROUND): ['incrementRoundIndex', 'advanceRoundState'] → playing
```

- [ ] **Step 1: Write the failing test — INIT_ROUND + level mode flag.**

`src/games/sort-numbers/definition.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { sortNumbersDefinition } from './definition';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { Actor, AnyStateMachine } from 'xstate';
import { buildEngineGuards } from '@/lib/game-engine/useGameEngine';

const tile = (id: string, value: string): TileItem => ({
  id,
  label: value,
  value,
});

const slot = (
  index: number,
  expectedValue: string,
  overrides: Partial<AnswerZone> = {},
): AnswerZone => ({
  id: `z${index}`,
  index,
  expectedValue,
  placedTileId: null,
  isWrong: false,
  isLocked: false,
  ...overrides,
});

const buildRound = () => ({
  tiles: [tile('t1', '1'), tile('t2', '2'), tile('t3', '3')],
  zones: [slot(0, '1'), slot(1, '2'), slot(2, '3')],
});

interface StartActorOptions {
  totalRounds?: number;
  maxLevels?: number | null;
  levelSize?: number;
  wrongTileBehavior?: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

interface StartedActor {
  actor: Actor<AnyStateMachine>;
  mocks: {
    playSound: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
  context: () => Record<string, unknown>;
  zones: () => AnswerZone[];
}

const liveActors: Actor<AnyStateMachine>[] = [];

const startActor = (options: StartActorOptions = {}): StartedActor => {
  const totalRounds = options.totalRounds ?? 3;
  const levelSize = options.levelSize ?? totalRounds;
  const guards = buildEngineGuards(totalRounds, levelSize);
  const mocks = {
    playSound: vi.fn(),
    speak: vi.fn(),
    completeGame: vi.fn(),
    emit: vi.fn(),
  };
  const actor = createActor(
    sortNumbersDefinition.machine.provide({ guards, actions: mocks }),
    {
      input: {
        totalRounds,
        maxLevels: options.maxLevels ?? null,
        wrongTileBehavior:
          options.wrongTileBehavior ?? 'lock-auto-eject',
      },
    },
  ) as Actor<AnyStateMachine>;
  actor.start();
  liveActors.push(actor);
  return {
    actor,
    mocks,
    context: () =>
      actor.getSnapshot().context as Record<string, unknown>,
    zones: () =>
      (actor.getSnapshot().context as { zones: AnswerZone[] }).zones,
  };
};

afterEach(() => {
  while (liveActors.length > 0) liveActors.pop()?.stop();
  vi.useRealTimers();
});

const initEvent = (tiles: TileItem[], zones: AnswerZone[]) =>
  ({ type: 'INIT_ROUND', tiles, zones }) as const;

describe('SortNumbers machine — INIT_ROUND + level flags', () => {
  it('starts in playing with levelIndex 0', () => {
    const { actor, context } = startActor({
      maxLevels: 3,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('playing');
    expect(context().levelIndex).toBe(0);
    expect(context().isLevelMode).toBe(true);
    expect(context().firstActionAt).toBeNull();
  });

  it('maxLevels: null leaves isLevelMode false', () => {
    const { actor, context } = startActor({ maxLevels: null });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(context().isLevelMode).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test — fails because `definition.ts` does not exist.**

```bash
yarn test --run src/games/sort-numbers/definition.test.ts
```

- [ ] **Step 3: Create `src/games/sort-numbers/definition.ts`.**

```ts
import { assign, setup } from 'xstate';
import type {
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { GameDefinition } from '@/lib/game-engine/definition-types';

export interface SortNumbersEngineContext {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  dragActiveTileId: string | null;
  dragHoverZoneIndex: number | null;
  dragHoverBankTileId: string | null;
  retryCount: number;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  isLevelMode: boolean;
  firstActionAt: number | null;
  selectedSlotIds: Set<string>;
}

interface SortNumbersInput {
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

type SortNumbersEvent =
  | { type: 'INIT_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'RESUME_ROUND'; draft: AnswerGameDraftState }
  | { type: 'PLACE_TILE'; tileId: string; zoneIndex: number }
  | {
      type: 'TYPE_TILE';
      tileId: string;
      value: string;
      zoneIndex: number;
    }
  | { type: 'REMOVE_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_TILES';
      fromZoneIndex: number;
      toZoneIndex: number;
    }
  | { type: 'EJECT_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_SLOT_BANK';
      zoneIndex: number;
      bankTileId: string;
    }
  | { type: 'SET_ACTIVE_SLOT'; zoneIndex: number }
  | { type: 'REJECT_TAP'; tileId: string; zoneIndex: number }
  | { type: 'SELECT_SLOT'; zoneIndex: number }
  | { type: 'SET_DRAG_ACTIVE'; tileId: string | null }
  | { type: 'SET_DRAG_HOVER'; zoneIndex: number | null }
  | { type: 'SET_DRAG_HOVER_BANK'; tileId: string | null }
  | { type: 'ADVANCE_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'ADVANCE_LEVEL'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'COMPLETE_GAME' }
  | {
      type: 'CELEBRATION_DONE';
      skipMethod?: 'play-again' | 'go-home';
    }
  | { type: 'GAME_OVER' };

const findNextActiveSlot = (
  zones: AnswerZone[],
  afterIndex: number,
  fallback: number,
): number => {
  const nextEmpty = zones.findIndex(
    (z, i) => i > afterIndex && z.placedTileId === null,
  );
  if (nextEmpty !== -1) return nextEmpty;
  const anyEmpty = zones.findIndex((z) => z.placedTileId === null);
  if (anyEmpty !== -1) return anyEmpty;
  const anyWrong = zones.findIndex((z) => z.isWrong);
  if (anyWrong !== -1) return anyWrong;
  return fallback;
};

const allFilledCorrectly = (zones: AnswerZone[]): boolean =>
  zones.length > 0 &&
  zones.every((z) => z.placedTileId !== null && !z.isWrong);

const sortNumbersMachine = setup({
  types: {} as {
    context: SortNumbersEngineContext;
    events: SortNumbersEvent;
    input: SortNumbersInput;
  },
  guards: {
    allFilledCorrectly: ({ context }) =>
      allFilledCorrectly(context.zones),
    canEject: ({ context, event }) => {
      if (event.type !== 'EJECT_TILE') return false;
      const zone = context.zones[event.zoneIndex];
      if (!zone) return false;
      return zone.isWrong || zone.isLocked;
    },
    isLastRound: () => false,
    isMidLevelRound: () => false,
    isLastRoundOfLevel: () => false,
  },
  actions: {
    speak: (_, _params: { lifecycleEvent: string }) => {},
    playSound: (_, _params: { sound: string }) => {},
    completeGame: () => {},
    emit: (_, _params: { event: unknown }) => {},

    initRound: assign(({ event }) => {
      if (event.type !== 'INIT_ROUND') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
        roundIndex: 0,
        firstActionAt: null,
        selectedSlotIds: new Set<string>(),
      } satisfies Partial<SortNumbersEngineContext>;
    }),

    // STUBS — Task 7 fills these in by porting from NumberMatch.
    resumeRound: assign(() => ({})),
    placeTile: assign(() => ({})),
    typeTile: assign(() => ({})),
    removeTile: assign(() => ({})),
    swapTiles: assign(() => ({})),
    ejectTile: assign(() => ({})),
    swapSlotBank: assign(() => ({})),
    setActiveSlot: assign(() => ({})),
    rejectTap: assign(() => ({})),
    selectSlot: assign(() => ({})),
    setDragActive: assign(() => ({})),
    setDragHover: assign(() => ({})),
    setDragHoverBank: assign(() => ({})),
    incrementRoundIndex: assign(() => ({})),
    advanceRoundState: assign(() => ({})),

    // SortNumbers-specific.
    incrementLevelIndex: assign(({ context }) => ({
      levelIndex: context.levelIndex + 1,
    })),
    advanceLevelState: assign(({ event }) => {
      if (event.type !== 'ADVANCE_LEVEL') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
        roundIndex: 0,
        firstActionAt: null,
        selectedSlotIds: new Set<string>(),
      } satisfies Partial<SortNumbersEngineContext>;
    }),
  },
}).createMachine({
  id: 'sort-numbers',
  initial: 'playing',
  context: ({ input }) => ({
    allTiles: [],
    bankTileIds: [],
    zones: [],
    activeSlotIndex: 0,
    dragActiveTileId: null,
    dragHoverZoneIndex: null,
    dragHoverBankTileId: null,
    retryCount: 0,
    roundIndex: 0,
    levelIndex: 0,
    totalRounds: input.totalRounds,
    maxLevels: input.maxLevels,
    wrongTileBehavior: input.wrongTileBehavior,
    isLevelMode: input.maxLevels !== null,
    firstActionAt: null,
    selectedSlotIds: new Set<string>(),
  }),
  on: {
    INIT_ROUND: { actions: 'initRound' },
    RESUME_ROUND: { actions: 'resumeRound' },
    GAME_OVER: { target: '.gameOver' },
    COMPLETE_GAME: { target: '.gameOver' },
  },
  states: {
    playing: {
      always: [
        { guard: 'allFilledCorrectly', target: 'roundComplete' },
      ],
      on: {
        PLACE_TILE: { actions: 'placeTile' },
        TYPE_TILE: { actions: 'typeTile' },
        REMOVE_TILE: { actions: 'removeTile' },
        SWAP_TILES: { actions: 'swapTiles' },
        EJECT_TILE: { guard: 'canEject', actions: 'ejectTile' },
        SWAP_SLOT_BANK: { actions: 'swapSlotBank' },
        SET_ACTIVE_SLOT: { actions: 'setActiveSlot' },
        REJECT_TAP: { actions: 'rejectTap' },
        SELECT_SLOT: { actions: 'selectSlot' },
        SET_DRAG_ACTIVE: { actions: 'setDragActive' },
        SET_DRAG_HOVER: { actions: 'setDragHover' },
        SET_DRAG_HOVER_BANK: { actions: 'setDragHoverBank' },
      },
    },
    roundComplete: {
      entry: [
        { type: 'playSound', params: { sound: 'round-complete' } },
      ],
      after: {
        750: [
          { guard: 'isLastRound', target: 'gameOver' },
          { guard: 'isLastRoundOfLevel', target: 'levelComplete' },
          { target: 'waitingForNext' },
        ],
      },
      on: {
        CELEBRATION_DONE: [
          { guard: 'isLastRound', target: 'gameOver' },
          { guard: 'isLastRoundOfLevel', target: 'levelComplete' },
          { target: 'waitingForNext' },
        ],
      },
    },
    levelComplete: {
      entry: [
        { type: 'playSound', params: { sound: 'level-complete' } },
      ],
      on: {
        ADVANCE_LEVEL: {
          actions: ['incrementLevelIndex', 'advanceLevelState'],
          target: 'playing',
        },
      },
    },
    waitingForNext: {
      on: {
        ADVANCE_ROUND: {
          actions: ['incrementRoundIndex', 'advanceRoundState'],
          target: 'playing',
        },
      },
    },
    gameOver: {
      entry: [
        { type: 'playSound', params: { sound: 'game-complete' } },
        { type: 'speak', params: { lifecycleEvent: 'game.over' } },
        'completeGame',
      ],
    },
  },
});

export const sortNumbersDefinition: GameDefinition = {
  id: 'sort-numbers',
  interaction: 'drag-to-slot',
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  machine: sortNumbersMachine,
};
```

- [ ] **Step 4: Run the test — confirm green.**

```bash
yarn test --run src/games/sort-numbers/definition.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/games/sort-numbers/definition.ts src/games/sort-numbers/definition.test.ts
git commit -m "feat(sort-numbers): scaffold XState machine with levelComplete

PR 1b U6: introduces sortNumbersMachine + sortNumbersDefinition.
Machine adds levelComplete state and ADVANCE_LEVEL event versus
the NumberMatch reference; phase transitions out of roundComplete
now route to gameOver / levelComplete / waitingForNext via the
buildEngineGuards isLastRound / isLastRoundOfLevel guards.
Assign-action bodies for shared events are stubs; Task 7 ports
them from NumberMatch."
```

---

## Task 7: Sort Numbers Assign Actions + Level Transition Tests

**Files:**

- Modify: `src/games/sort-numbers/definition.ts`
- Modify: `src/games/sort-numbers/definition.test.ts`

- [ ] **Step 1: Port assign-action bodies from NumberMatch.**

Same as Task 2: copy `resumeRound`, `placeTile`, `typeTile`, `removeTile`, `swapTiles`, `ejectTile`, `swapSlotBank`, `setActiveSlot`, `rejectTap`, `selectSlot`, `setDragActive`, `setDragHover`, `setDragHoverBank`, `incrementRoundIndex`, `advanceRoundState` from `src/games/number-match/definition.ts`. Replace `Partial<NumberMatchEngineContext>` with `Partial<SortNumbersEngineContext>` in `satisfies` clauses.

- [ ] **Step 2: Add machine tests covering levelComplete and ADVANCE_LEVEL.**

```ts
describe('SortNumbers machine — levelComplete', () => {
  it('after roundComplete on last round of level (not last round), advances to levelComplete', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    // Round 2 (last of level 1 with levelSize: 2):
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
    const levelCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'level-complete',
    );
    expect(levelCompleteCalls).toHaveLength(1);
  });

  it('ADVANCE_LEVEL from levelComplete increments levelIndex and returns to playing with reset round state', () => {
    vi.useFakeTimers();
    const { actor, context } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    playRound();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');

    const nextLevelTiles = [
      tile('t4', '4'),
      tile('t5', '5'),
      tile('t6', '6'),
    ];
    const nextLevelZones = [slot(0, '4'), slot(1, '5'), slot(2, '6')];
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: nextLevelTiles,
      zones: nextLevelZones,
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().levelIndex).toBe(1);
    expect(context().roundIndex).toBe(0);
    expect(context().retryCount).toBe(0);
    expect(context().firstActionAt).toBeNull();
  });

  it('COMPLETE_GAME from levelComplete jumps to gameOver', () => {
    vi.useFakeTimers();
    const { actor } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const playRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };
    playRound();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');

    actor.send({ type: 'COMPLETE_GAME' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });
});
```

- [ ] **Step 3: Run the tests — confirm green.**

```bash
yarn test --run src/games/sort-numbers/definition.test.ts
```

Expected: PASS (initial 2 + 3 level tests = 5 passing minimum).

- [ ] **Step 4: Commit.**

```bash
git add src/games/sort-numbers/definition.ts src/games/sort-numbers/definition.test.ts
git commit -m "feat(sort-numbers): port assign actions + add level tests

PR 1b U7: copies shared assign-action bodies from NumberMatch and
adds machine tests covering the unique SortNumbers transitions:
roundComplete → levelComplete (mid-game), ADVANCE_LEVEL increments
levelIndex + resets round state, COMPLETE_GAME from levelComplete
routes to gameOver."
```

---

## Task 8: SortNumbers Machine — Happy + Error/No-op Tests

**Files:**

- Modify: `src/games/sort-numbers/definition.test.ts`

Add the remaining happy-path, no-op, and integration coverage matching NumberMatch's reference.

- [ ] **Step 1: Append additional happy-path tests.**

```ts
describe('SortNumbers machine — happy path', () => {
  it('PLACE_TILE on correct slot updates placedTileId, removes tile from bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(context().bankTileIds).toEqual(['t2', 't3']);
  });

  it('TYPE_TILE on empty slot creates a virtual tile and marks correct', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: '1',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBe('typed-z0');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(
      (context().allTiles as TileItem[]).some(
        (t) => t.id === 'typed-z0',
      ),
    ).toBe(true);
  });

  it('REMOVE_TILE on placed slot returns real tile to bank and clears slot', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t1');
  });

  it('completing all zones via PLACE_TILE transitions atomically to roundComplete', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
  });

  it('after 750ms in roundComplete on last round (no levels), advances to gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
      totalRounds: 1,
      maxLevels: null,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('SWAP_TILES exchanges two placed slots and recomputes correctness', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 1 });
    actor.send({
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 1,
    });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[1]?.placedTileId).toBe('t2');
    expect(zones()[1]?.isWrong).toBe(false);
  });
});
```

- [ ] **Step 2: Append edge-case and no-op tests.**

```ts
describe('SortNumbers machine — edge cases', () => {
  it('PLACE_TILE on wrong slot (lock-auto-eject) locks the tile, bumps retry', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t2');
    expect(zones()[0]?.isWrong).toBe(true);
    expect(zones()[0]?.isLocked).toBe(true);
    expect(context().retryCount).toBe(1);
  });

  it('EJECT_TILE on a wrong-locked slot clears it and returns tile to bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t2');
  });
});

describe('SortNumbers machine — error / no-op paths', () => {
  it('PLACE_TILE with unknown tileId is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'PLACE_TILE',
      tileId: 'nonexistent',
      zoneIndex: 0,
    });
    expect(context().zones).toEqual(before.zones);
    expect(context().bankTileIds).toEqual(before.bankTileIds);
  });

  it('ADVANCE_ROUND while in playing is ignored', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(before.roundIndex);
  });

  it('ADVANCE_LEVEL while in playing is ignored', () => {
    const { actor, context } = startActor({
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().levelIndex).toBe(before.levelIndex);
  });
});
```

- [ ] **Step 3: Append the multi-level integration test.**

```ts
describe('SortNumbers machine — integration', () => {
  it('completes a full two-level (4-round) game ending in gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    // Level 1, round 1 (mid-level).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 1, round 2 (last of level 1).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 2, round 3 (mid-level).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 2, round 4 (last round overall).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');

    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
    const roundCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'round-complete',
    );
    const levelCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'level-complete',
    );
    const gameCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'game-complete',
    );
    expect(roundCompleteCalls).toHaveLength(4);
    expect(levelCompleteCalls).toHaveLength(1);
    expect(gameCompleteCalls).toHaveLength(1);
  });

  it('root-level GAME_OVER handler is defense-in-depth', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('playing');
    actor.send({ type: 'GAME_OVER' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });
});
```

- [ ] **Step 4: Run all tests.**

```bash
yarn test --run src/games/sort-numbers/definition.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/games/sort-numbers/definition.test.ts
git commit -m "test(sort-numbers): add happy-path, edge, no-op, and integration tests

PR 1b U8: completes SortNumbers machine test coverage with the same
happy-path event coverage as WordSpell + NumberMatch, plus
SortNumbers-specific paths: ADVANCE_LEVEL no-op in playing, and a
4-round / 2-level integration test asserting roundComplete (4×),
levelComplete (1×), and gameComplete (1×) sounds fire in order."
```

---

## Task 9: Refactor `SortNumbers.tsx` To Engine

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

Apply the same structural refactor as Task 4, with SortNumbers-specific additions:

1. Lift `SortNumbersInstance` keyed by `sessionEpoch`.
2. Pass `engineDispatch` to `<AnswerGame engineDispatch={engineDispatch}>`.
3. Drop `useGameSounds()` (and its `levelCompleteReady` return value).
4. Read `phase`, `roundIndex`, `retryCount`, `zones`, `levelIndex` from `engine.context` / `engine`.
5. Gate overlays on `engine.phase`:
   - `engine.phase === 'roundComplete'` → `RoundCompleteEffect` / `ScoreAnimation`
   - `engine.phase === 'levelComplete'` → `LevelCompleteOverlay`
   - `engine.phase === 'gameOver'` → `CelebrationOverlay` / `GameOverOverlay`
6. Round-advance effect: `engine.phase === 'waitingForNext'` → dispatch `ADVANCE_ROUND` via reducer.
7. Level-advance: `handleNextLevel` continues to call `generateNextLevel(levelIndex)` and dispatches `ADVANCE_LEVEL` via reducer (mirrored to engine).
8. Preserve `game:round-advance` and `game:level-advance` emit (move into the same effects).
9. Drop the manual `game:end` `useEffect` (line 108–129 of current SortNumbers.tsx) — engine's `completeGame` action handles it.
10. Preserve `useGameSkin`'s `resolveTiming('roundAdvanceDelay', ...)` timer config — but note the actual timing is now machine-owned (`after: 750`). The component reads the value for parity but the machine's transition fires first. **Open question:** if `resolveTiming` returns something ≠ 750, the machine's hardcoded 750 wins. Document this as a known gap and target it in PR 1b-bis or PR 1c. For now, audit which skins override `roundAdvanceDelay` — if any do, capture as Open Question.

- [ ] **Step 1: Audit `resolveTiming('roundAdvanceDelay', ...)` overrides.**

```bash
grep -rn "roundAdvanceDelay" /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/lib/skin 2>/dev/null
```

If any skin overrides the default 750, document the divergence in this task's commit message and surface to the user before continuing.

- [ ] **Step 2: Refactor `SortNumbersSession` to consume engine state.**

```tsx
// BEFORE (lines 36–55 of current SortNumbers.tsx):
const { phase, roundIndex, retryCount, zones, levelIndex } =
  useAnswerGameContext();
const dispatch = useAnswerGameDispatch();
const { confettiReady, levelCompleteReady, gameOverReady } =
  useGameSounds();
// ... completionToken ref ...

// AFTER (takes `engine` prop):
const dispatch = useAnswerGameDispatch();
const engine: SortNumbersEngine = props.engine;
const phase = engine.phase;
const roundIndex = engine.roundIndex;
const retryCount = engine.retryCount;
const levelIndex = engine.context.levelIndex;
const zones = engine.context.zones;
const showRoundComplete = phase === 'roundComplete';
const showLevelComplete = phase === 'levelComplete';
const showGameOver = phase === 'gameOver';
```

- [ ] **Step 3: Replace the round-advance `useEffect` with the phase-driven version.**

```tsx
// BEFORE (lines 131–205 of current SortNumbers.tsx):
useEffect(() => {
  if (phase !== 'round-complete' || !confettiReady) return;
  const delayMs = resolveTiming('roundAdvanceDelay', skin, sortNumbersConfig.timing);
  const timer = globalThis.setTimeout(() => {
    // ... isLastRound? COMPLETE_GAME : ADVANCE_ROUND ...
  }, delayMs);
  return () => globalThis.clearTimeout(timer);
}, [phase, confettiReady, ...]);

// AFTER:
useEffect(() => {
  if (engine.phase !== 'waitingForNext') return;
  const nextConfigIndex = roundOrder[engine.roundIndex + 1];
  const nextRound =
    nextConfigIndex === undefined
      ? undefined
      : sortNumbersConfig.rounds[nextConfigIndex];
  if (!nextRound) return;
  const distractor =
    sortNumbersConfig.tileBankMode === 'distractors'
      ? {
          config: sortNumbersConfig.distractors,
          range: sortNumbersConfig.range,
        }
      : undefined;
  const { tiles: nextTiles, zones: nextZones } = buildSortRound(
    nextRound.sequence,
    sortNumbersConfig.direction,
    distractor,
  );
  dispatch({ type: 'ADVANCE_ROUND', tiles: nextTiles, zones: nextZones });
  getGameEventBus().emit({
    type: 'game:round-advance',
    gameId: sortNumbersConfig.gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex: engine.roundIndex + 1,
  });
}, [
  engine.phase,
  engine.roundIndex,
  dispatch,
  roundOrder,
  sortNumbersConfig.gameId,
  sortNumbersConfig.rounds,
  sortNumbersConfig.direction,
  sortNumbersConfig.tileBankMode,
  sortNumbersConfig.distractors,
  sortNumbersConfig.range,
]);
```

- [ ] **Step 4: Keep `handleNextLevel` and `handleDone` essentially unchanged — they already dispatch `ADVANCE_LEVEL` / `COMPLETE_GAME` via the reducer. Verify the dispatches are still mirrored by `engineDispatch` after the wrap.**

The existing `handleNextLevel` body (lines 78–102 of current SortNumbers.tsx) is preserved verbatim. It calls `dispatch({ type: 'ADVANCE_LEVEL', ... })`, which goes through the reducer and (via `engineDispatch` provided by the new `SortNumbersInstance`) the engine. No code change needed beyond the wrapping component restructure.

- [ ] **Step 5: Drop the manual `game:end` emit useEffect (lines 108–129 of current SortNumbers.tsx).**

The engine's `completeGame` action emits `game:end` via the side-effects executor. Delete the `useEffect` block entirely.

- [ ] **Step 6: Replace overlay gates.**

```tsx
// BEFORE: { skin.RoundCompleteEffect ? <skin.RoundCompleteEffect visible={confettiReady} /> ... }
// AFTER:
{
  skin.RoundCompleteEffect ? (
    <skin.RoundCompleteEffect visible={showRoundComplete} />
  ) : (
    <ScoreAnimation visible={showRoundComplete} />
  );
}

// BEFORE: { levelCompleteReady ? ... }
// AFTER:
{
  showLevelComplete ? (
    skin.LevelCompleteOverlay ? (
      <skin.LevelCompleteOverlay
        level={levelIndex + 1}
        onNextLevel={handleNextLevel}
        onDone={handleDone}
      />
    ) : (
      <LevelCompleteOverlay
        level={levelIndex + 1}
        onNextLevel={handleNextLevel}
        onDone={handleDone}
      />
    )
  ) : null;
}

// BEFORE: { gameOverReady ? ... }
// AFTER:
{
  showGameOver ? (
    skin.CelebrationOverlay ? (
      <skin.CelebrationOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    ) : (
      <GameOverOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    )
  ) : null;
}
```

- [ ] **Step 7: Insert the outer `SortNumbersInstance` wrapper keyed by `sessionEpoch`.**

```tsx
// New inner SortNumbersInstance component (mirrors WordSpellInstance):
const SortNumbersInstance = ({
  config,
  initialState,
  sessionId,
  roundOrder,
  skin,
  onRestartSession,
  tiles,
  zones,
}: SortNumbersInstanceProps) => {
  const answerGameConfig = useMemo<AnswerGameConfig>(
    () => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      totalRounds: config.rounds.length,
      roundsInOrder: config.roundsInOrder,
      ttsEnabled: config.ttsEnabled,
      touchKeyboardInputMode: 'numeric',
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction: 'free-swap' as const,
      levelMode: config.levelMode,
      hud: config.hud,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.rounds.length,
      config.roundsInOrder,
      config.ttsEnabled,
      config.levelMode,
      config.hud,
      tiles,
      zones,
    ],
  );

  const engine = useGameEngine<unknown, SortNumbersEngineContext>(
    sortNumbersDefinition,
    {
      input: {
        totalRounds: config.rounds.length,
        maxLevels: config.levelMode?.maxLevels ?? null,
        wrongTileBehavior: config.wrongTileBehavior,
      },
      totalRounds: config.rounds.length,
      levelSize:
        config.levelMode?.maxLevels !== undefined &&
        config.levelMode.maxLevels > 0
          ? Math.ceil(config.rounds.length / config.levelMode.maxLevels)
          : config.rounds.length,
      envelope: { gameId: config.gameId },
    },
  );

  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);
  const engineDispatch = useCallback(
    (action: AnswerGameAction) =>
      engineRef.current.send(action as never),
    [],
  );

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
      skin={skin}
      engineDispatch={engineDispatch}
    >
      <SortNumbersSession
        sortNumbersConfig={config}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={onRestartSession}
        engine={engine}
      />
    </AnswerGame>
  );
};

// Outer SortNumbers component wraps SortNumbersInstance keyed by sessionEpoch:
return (
  <div
    className={`game-container skin-${skin.id}`}
    style={skin.tokens as React.CSSProperties}
  >
    {skin.SceneBackground ? <skin.SceneBackground /> : null}
    <SortNumbersInstance
      key={sessionEpoch}
      config={config}
      initialState={sessionEpoch === 0 ? initialState : undefined}
      sessionId={sessionId}
      roundOrder={roundOrder}
      skin={skin}
      onRestartSession={() => setSessionEpoch((e) => e + 1)}
      tiles={tiles}
      zones={zones}
    />
  </div>
);
```

- [ ] **Step 8: Run typecheck.**

```bash
yarn typecheck
```

Expected: clean. Any TS errors mean the engineDispatch type, context casts, or `slotInteraction` literal don't line up — fix before proceeding.

- [ ] **Step 9: Commit.**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(sort-numbers): refactor component to XState engine

PR 1b U9: lifts SortNumbersInstance keyed by sessionEpoch. Engine
drives phase/roundIndex/retryCount/levelIndex/zones via context.
Drops useGameSounds — overlays gate on engine.phase camelCase
('roundComplete' / 'levelComplete' / 'gameOver'). Round-advance and
level-advance dispatches mirror to engine via engineDispatch.
game:end emit moves into engine.completeGame action. game:round-advance
and game:level-advance emissions preserved at the dispatch sites."
```

---

## Task 10: Add `SortNumbers.test.tsx` Component Tests

**Files:**

- Create: `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx`

SortNumbers has no component-level test today. Add minimum coverage matching what WordSpell has plus the U4 single-mount regression.

- [ ] **Step 1: Author the test file.**

```tsx
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';

const baseConfig: SortNumbersConfig = {
  gameId: 'sort-numbers-test',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  roundsInOrder: true,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 1, max: 9 },
  rounds: [{ sequence: [1, 2, 3] }],
};

describe('SortNumbers basic rendering', () => {
  it('renders three slots for a three-number sequence', () => {
    const { container } = render(<SortNumbers config={baseConfig} />);
    const zone = container.querySelector<HTMLElement>(
      '.game-answer-zone',
    )!;
    expect(within(zone).getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the direction label', () => {
    render(<SortNumbers config={baseConfig} />);
    expect(screen.getByText(/ascending/i)).toBeInTheDocument();
  });
});

describe('SortNumbers round-complete overlay', () => {
  it('mounts the round-complete effect exactly once during the celebration window', async () => {
    const config: SortNumbersConfig = {
      ...baseConfig,
      totalRounds: 3,
      rounds: [
        { sequence: [1, 2, 3] },
        { sequence: [4, 5, 6] },
        { sequence: [7, 8, 9] },
      ],
    };

    // SortNumbers uses drag input; simulating via reducer dispatch
    // would bypass the round-advance machine path. Instead, we drive
    // the machine directly through the engine bridge: send PLACE_TILE
    // x3 via globalThis keyboard events when SortNumbers' input
    // method is 'type'. Adjust the config for the test:
    const typeConfig: SortNumbersConfig = {
      ...config,
      inputMethod: 'type',
    };
    render(<SortNumbers config={typeConfig} />);

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    const overlays = await screen.findAllByRole('status', {
      name: 'Round complete!',
    });
    expect(overlays).toHaveLength(1);
  });
});

describe('SortNumbers Play again', () => {
  it('resets the game to round 1 after game-over', async () => {
    const user = userEvent.setup();
    const oneRoundConfig: SortNumbersConfig = {
      ...baseConfig,
      inputMethod: 'type',
      rounds: [{ sequence: [1, 2, 3] }],
    };
    render(<SortNumbers config={oneRoundConfig} />);

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    const playAgain = await screen.findByRole('button', {
      name: 'Play again',
    });
    await user.click(playAgain);

    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test.**

```bash
yarn test --run src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx
```

Expected: all three test groups PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx
git commit -m "test(sort-numbers): add component tests including U4 regression

PR 1b U10: introduces SortNumbers.test.tsx — basic rendering,
U4 single-mount regression for the round-complete overlay, and
the Play-again reset path. Mirrors NumberMatch's component-test
shape for consistency."
```

---

## Task 11: Delete `useGameSounds`

**Files:**

- Delete: `src/components/answer-game/useGameSounds.ts`
- Delete: `src/components/answer-game/useGameSounds.test.tsx`

After Tasks 4 and 9, no production code imports `useGameSounds`. The hook becomes dead.

- [ ] **Step 1: Confirm no production imports remain.**

```bash
grep -rn "useGameSounds" /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v useGameSounds.ts | grep -v useGameSounds.test.tsx
```

Expected: no output. If anything appears, stop and fix the leftover import before deleting.

- [ ] **Step 2: Delete the files.**

```bash
git rm src/components/answer-game/useGameSounds.ts src/components/answer-game/useGameSounds.test.tsx
```

- [ ] **Step 3: Run typecheck + unit tests.**

```bash
yarn typecheck
yarn test --run src/components/answer-game src/games/word-spell src/games/sort-numbers src/games/number-match
```

Expected: clean. If `knip` complains about another now-unused symbol, address it inline.

- [ ] **Step 4: Commit.**

```bash
git commit -m "chore(answer-game): delete useGameSounds

PR 1b U11: removes useGameSounds hook + its test. After WordSpell
and SortNumbers migrate to XState (U4, U9), no game consumes the
gate-boolean pattern — overlays gate on engine.phase directly.
Resolves PR 1a Spec Delta 1 (deferred to PR 1b)."
```

---

## Task 12: Architecture MDX Updates

**Files:**

- Modify: `src/lib/game-engine/GameEngine.flows.mdx`
- Modify: `src/lib/game-engine/GameEngine.reference.mdx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.flows.mdx`
- Create: `src/games/sort-numbers/SortNumbers/SortNumbers.flows.mdx`

Run `/update-architecture-docs` first (the skill prompts for which sections need updating).

- [ ] **Step 1: Invoke the architecture-docs skill.**

```text
/update-architecture-docs
```

- [ ] **Step 2: Append `GameEngine.flows.mdx` with WordSpell + SortNumbers sections.**

After the existing "Per-round phase machine (NumberMatch as the canonical example)" section, add:

```markdown
### 5b. WordSpell phase machine

Identical to NumberMatch's machine (same states, same events). The
context shape adds no WordSpell-specific fields — every field is
shared with NumberMatch. Round construction (`buildSentenceGapRound`,
`buildTilesAndZones`) stays in `WordSpell.tsx` per Spec Delta 4.

### 5c. SortNumbers phase machine (with levelComplete)

Adds a `levelComplete` state and an `ADVANCE_LEVEL` event:

\`\`\`text
playing
↓ always(allFilledCorrectly)
roundComplete
↓ after(750)

- isLastRound → gameOver
- isLastRoundOfLevel → levelComplete
- otherwise → waitingForNext

levelComplete
↓ ADVANCE_LEVEL → incrementLevelIndex + advanceLevelState → playing
↓ COMPLETE_GAME → gameOver

waitingForNext
↓ ADVANCE_ROUND → incrementRoundIndex + advanceRoundState → playing
\`\`\`

Level progression is component-driven: the `SortNumbersSession`
component calls `levelMode.generateNextLevel(levelIndex)` from
`SortNumbersConfig` to compute the next level's tiles/zones, then
dispatches `ADVANCE_LEVEL` via the reducer (mirrored to engine).
```

- [ ] **Step 3: Append `GameEngine.reference.mdx` context tables.**

Add `WordSpellEngineContext` and `SortNumbersEngineContext` shape tables, noting they share every field with `NumberMatchEngineContext`. Note SortNumbers reads `levelIndex` at runtime; WordSpell does not.

- [ ] **Step 4: Update `WordSpell.flows.mdx` with the XState diagram.**

Replace any reducer-flow content with a Mermaid diagram for the XState transitions, plus a note that round construction stays in the component (Spec Delta 4).

- [ ] **Step 5: Create `SortNumbers.flows.mdx` mirroring WordSpell's, with the additional `levelComplete` transition.**

- [ ] **Step 6: Lint the markdown.**

```bash
yarn fix:md
yarn lint:md
```

Expected: both clean. Inspect any unfixable lint warnings and address inline.

- [ ] **Step 7: Commit.**

```bash
git add src/lib/game-engine/GameEngine.flows.mdx src/lib/game-engine/GameEngine.reference.mdx src/games/word-spell/WordSpell/WordSpell.flows.mdx src/games/sort-numbers/SortNumbers/SortNumbers.flows.mdx
git commit -m "docs(arch): document WordSpell + SortNumbers XState machines

PR 1b U12: appends WordSpell + SortNumbers sections to GameEngine.flows.mdx
and GameEngine.reference.mdx. Updates co-located WordSpell.flows.mdx with
the new XState diagram and creates SortNumbers.flows.mdx with the
levelComplete-aware transition graph."
```

---

## Task 13: Final Verification + Open PR

**Files:** none.

- [ ] **Step 1: Run the full local pipeline.**

```bash
yarn typecheck
yarn test --run
yarn lint
yarn lint:md
```

Expected: all clean. Fix any failures.

- [ ] **Step 2: Run VR tests (requires Docker).**

```bash
yarn test:vr
```

If Docker is not running, ask the user to start it. The VR check is required before push because WordSpell and SortNumbers overlay timing may have shifted subtly.

If VR diffs appear and are intentional:

```bash
yarn test:vr:update
```

Commit the new snapshots:

```bash
git add tests-vr/__screenshots__
git commit -m "test(vr): refresh baselines for PR 1b XState migration"
```

- [ ] **Step 3: Push the branch.**

```bash
git push -u origin feat/spec-1a-pr1b-wordspell-sortnumbers
```

- [ ] **Step 4: Open the PR against master.**

```bash
gh pr create --base master --title "feat(game-engine): PR 1b — WordSpell + SortNumbers XState migration" --body "$(cat <<'EOF'
## Summary

- Migrates **WordSpell** and **SortNumbers** to the XState-first pattern proven on NumberMatch in PR 1a (#355).
- Adds the `levelComplete` machine state for SortNumbers' level progression.
- Drops `useGameSounds` from both games (and deletes the hook — no consumers remain).
- Populates `firstActionAt` / `selectedSlotIds` placeholder fields in both new machine contexts (shape parity with NumberMatch).
- Appends WordSpell + SortNumbers sections to the GameEngine architecture MDX.

## Deferred to PR 1b-bis

- Building `useGameRound` (the hook doesn't exist yet; design + Spec Delta in #257).
- Adding `round:*` event types to `src/types/game-events.ts` + wildcard support in `GameEventBus`.
- Emitting `round:first-action` / `round:mistake` / `round:resolved` from machine assign actions.
- Adopting `useGameRound` in NumberMatch / WordSpell / SortNumbers.

These are tracked separately because each depends on the next; bundling them with PR 1b would balloon scope past one reviewable PR.

## Test plan

- [x] WordSpell machine tests (definition.test.ts) green
- [x] SortNumbers machine tests (definition.test.ts) green including level transitions
- [x] WordSpell component tests (WordSpell.test.tsx) green including U4 single-mount regression
- [x] SortNumbers component tests (SortNumbers.test.tsx) green including U4 + Play-again
- [x] NumberMatch tests still green (no regression)
- [x] `yarn typecheck`, `yarn lint`, `yarn lint:md` clean
- [x] VR snapshots match (or updated baselines committed with a documented reason)
- [ ] Manual smoke: WordSpell happy path on a multi-round library config
- [ ] Manual smoke: SortNumbers level progression on a `levelMode`-enabled config

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Return the PR URL to the user.**

---

## Deferred / Open Questions

1. **`useGameRound` adoption (PR 1b-bis).** Build the hook with both reducer and engine paths per the 2026-05-11 Spec Delta. Migrate all three answer games. Wire SRS + lifecycle-TTS subscribers.
2. **`round:*` event types + wildcard (PR 1b-bis).** Extend `src/types/game-events.ts` with the 6 event types from spec §5. Update `GameEventBus.emit`/`subscribe` to support `'round:*'` wildcard.
3. **`firstActionAt` and `selectedSlotIds` real population (PR 1b-bis).** Wire timestamp write on first `PLACE_TILE` / `TYPE_TILE` / `SELECT_SLOT`, and `selectedSlotIds` toggle on `SELECT_SLOT`. Emit `round:first-action` / `round:mistake` / `round:resolved` from assign actions.
4. **SortNumbers `roundAdvanceDelay` skin override.** If any skin overrides the default 750 ms, the machine's hardcoded `after: 750` ignores it. Audit + capture as an issue or fix in PR 1c.
5. **`buildRound` lift into definition.ts (PR 1c).** Round construction stays in components in PR 1b (Spec Delta 4). PR 1c centralises it.
6. **`answer-game-reducer.ts` deletion (PR 1c).** Reducer continues to exist in PR 1b because `Slot`, `LetterTileBank`, `SortNumbersTileBank`, and `useTouchKeyboardInput` still subscribe to `AnswerGameStateContext`. PR 1c migrates those readers off the reducer and deletes it.
7. **SpotAll (PR 1d).** Stays on its own reducer (`spot-all-reducer.ts`) until a separate PR migrates it.
