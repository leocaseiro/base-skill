# PR 1a — GameEngine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the GameEngine foundation: install `xstate@5` + `@xstate/react@5`, pin the lifecycle-tts type contract, define `GameDefinition` types, ship `useGameEngine` + `executeSideEffects`, migrate **NumberMatch** to engine-driven phases, and remove the `confettiReady`/`gameOverReady` race gate from `useGameSounds` for NumberMatch — proving the engine works on one game before PR 1b extends it to WordSpell + SortNumbers.

**Architecture:** A new `src/lib/game-engine/useGameEngine.ts` hook wraps XState v5's `useMachine(definition.machine.provide({ guards, actors, actions }))`. The engine is the source of truth for **external** phase concerns (TTS, celebration overlays, engagement events) while the existing `answer-game-reducer` keeps owning **internal** game-specific state (tiles, zones, cooldowns, drag) — a small phase-bridge `useEffect` in the per-game wrapper forwards reducer phase transitions (`round-complete`, `level-complete`, `game-over`) to the engine via `engine.send`. The engine emits `lifecycle:speak` and `celebration:*` events through the existing `GameEventBus`; PR 1a does not subscribe to `lifecycle:speak` (the TTS plan owns that), and existing `useRoundTTS` continues to drive prompt speech unchanged. Celebration overlay **mounting** stays in NumberMatch.tsx in PR 1a — PR 1c (or later) moves mounting into a `CelebrationHost` that the engine owns. Removing the `useGameSounds` gate eliminates the double-mount race today; engine-driven mounting tightens the contract later.

**Tech Stack:** XState v5 (`xstate@5`, `@xstate/react@5`), React 19, TypeScript, Vitest, existing `GameEventBus`.

**Spec:** `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` (lines 95–204 for PR 1a scope, lines 205–318 for the GameDefinition type, lines 461–504 for celebration semantics, lines 502–699 for the NumberMatch machine sample).

---

## Spec Deltas

The design doc is the binding source of truth for the GameDefinition shape; the deltas below are intentional **PR 1a scope reductions** that defer parts of the design to PR 1b/1c. None of them break the typed contract — every type from the design is created with the right shape; some fields are populated minimally in PR 1a and tightened later.

1. **Celebration overlay mounting stays in NumberMatch.tsx in PR 1a.** The design states the engine takes ownership of mounting `<skin.CelebrationOverlay />`, `<skin.LevelCompleteOverlay />`, and `<skin.RoundCompleteEffect />` (design lines 478–481, 698–703). PR 1a only owns the **lifecycle decision** (engine drives the phase). The game component still renders skin overlays based on `engine.phase`. The double-mount race the design warns about is resolved today by removing the `useGameSounds` gate — engine + the existing skin slots become the single mount path. Full registry-based mounting moves into a `CelebrationHost` in PR 1c (after the abstraction is validated across three games). **Why now is fine:** removing the gate is the operational fix the design relies on; relocating mounting is a refactor that can rebase cleanly on three engine-driven games.

2. **`engine.celebrating` returns `null` in PR 1a.** The `UseGameEngineResult.celebrating` field exists (typed exactly per the design) so downstream callers compile, but the implementation returns `null` for now. NumberMatch reads `engine.phase` directly to gate overlays. PR 1b populates `celebrating` from machine context after we register `celebrationActor`/`levelCelebrationActor`/`gameOverActor` with full input plumbing. **Why now is fine:** no caller in PR 1a depends on `celebrating !== null`; the field is only consumed by future engine-mounted overlays (PR 1c+).

3. **Celebration actors are simple `fromPromise` timers in PR 1a, gated by external `engine.send` for early dismiss.** The design describes invoked actors with `onDone` driven by mini-game completion (design lines 469–504). PR 1a implements them as `fromPromise` actors that resolve after a `maxDuration` fallback timer **and** the parent state listens for `CELEBRATION_DONE` (a top-level event sent by the game component when the user dismisses early via Play Again / Go Home). NumberMatch already ships its skip flow through skin-level callbacks; we surface those into engine events. **Why now is fine:** matches the design's "skip via buttons fires `celebration:skip`" semantic; richer actor lifecycles can land alongside DinoEggHatch / FireworksPainter integration when those PRs rebase on the engine.

4. **`reducer.phase` is not removed in PR 1a.** The design says "the reducer handles game-specific state only (tiles, zones, cooldowns)" (line 327). In PR 1a the answer-game reducer keeps `phase` because Phase 1 explicitly does not touch the reducer (line 430: "answerGameReducer and spotAllReducer are NOT touched in Phase 1"). The reducer's `phase` becomes an **internal** signal used only by the phase bridge `useEffect`; consumers read `engine.phase`. Phase 2 (reducer unification) removes `reducer.phase` entirely. **Why now is fine:** keeps blast radius contained — touching the reducer would balloon PR 1a and tangle with WordSpell/SortNumbers behavior covered by PR 1b.

5. **`useLifecycleTTS` is not created in PR 1a.** The design line 781 mentions wiring "a stub `useLifecycleTTS` that subscribes to the bus" in PR 1a. The handoff scope (2026-05-10 handoff lines 51–56) excludes the hook; the TTS plan (`2026-05-06-spec-1a-m1-tts-lifecycle.md`) owns it end-to-end. PR 1a only **emits** `lifecycle:speak` from `executeSideEffects`; with no subscriber, emissions are recorded by the bus but produce no audio — a no-op until the TTS plan ships. Existing `useRoundTTS` continues to drive prompt speech for NumberMatch with no changes. **Why now is fine:** keeps the TTS plan independently shippable and avoids a stub the TTS plan would immediately replace.

6. **`buildRound` is a passthrough in PR 1a; round construction stays in the React component.** The design states `buildRound` is the engine-owned round factory called on transitions (design lines 234–245). PR 1a's NumberMatch definition implements `buildRound` as `(ctx) => ({ roundIndex: ctx.roundIndex })` — a stub — because NumberMatch's existing `buildNumeralRound` factory closure lives in `NumberMatch.tsx`. The phase bridge (Task 9) dispatches the resolved round to the reducer; the engine sees only the round index. As a side effect, `engine.currentRound` returns `{}` in PR 1a (no callers depend on it). PR 1b lifts round-construction into `definition.ts` once WordSpell + SortNumbers migrate (they share the closure shape — sentence-gap mode for WordSpell, level-aware rounds for SortNumbers — and validate the contract across three games). **Why now is fine:** PR 1a's goal is to prove the engine drives phase lifecycle on one game. Round construction is orthogonal — bringing it into the definition without three game-specific shapes to validate against would be premature.

7. **`UseGameEngineResult.phase` is typed as `string` in PR 1a, not `GamePhase`.** The design (line 305) declares `phase: GamePhase` — a typed union. PR 1a's `definition-types.ts` widens this to `phase: string` because XState state-node names are stringly-typed and centralizing the literal union before all three answer games' state shapes are known would force premature decisions. Game components in PR 1a (NumberMatch only) read `engine.phase` against literal strings (`'playing'`, `'roundComplete'`, `'gameOver'`); typos would not be caught at compile time. **Why now is fine:** PR 1a only consumes engine.phase in NumberMatch, where the state names are local to one machine. PR 1c tightens this: once WordSpell + SortNumbers + NumberMatch are all engine-driven, define a shared `GamePhase = 'playing' | 'roundComplete' | 'levelComplete' | 'gameOver' | 'announcing' | 'waitingForNext'` union in `definition-types.ts` and update `UseGameEngineResult.phase` accordingly. Until then, treat string typos as a known risk and prefer `engine.phase === 'roundComplete' as const` patterns where possible.

If an executor disagrees with any of these deltas while implementing, **stop and flag to the user** before deviating. The deltas are scope choices, not guesses.

---

## Phase Bridge Pattern (PR 1a only)

Since the answer-game reducer keeps `phase` in PR 1a (Spec Delta 4), per-game wrappers add a small bridge that forwards reducer transitions into engine events:

```tsx
const reducerPhase = useAnswerGameContext().phase;

useEffect(() => {
  if (reducerPhase === 'round-complete') {
    engine.send({ type: 'ROUND_CORRECT' });
  } else if (reducerPhase === 'level-complete') {
    engine.send({ type: 'LEVEL_COMPLETE' });
  } else if (reducerPhase === 'game-over') {
    engine.send({ type: 'GAME_OVER' });
  }
}, [reducerPhase, engine]);
```

The engine then drives `playing → roundComplete → waitingForNext → playing | levelComplete | gameOver`. The reducer's `phase` is no longer read by overlays, TTS, or sounds — only by the bridge. PR 1c removes the bridge once Phase 2 unifies the reducer.

---

## Required Skills For Executors

When the executor's diff touches files matching the patterns below, load the corresponding project skill before generating code (per `CLAUDE.md` "Before writing a plan"):

- `*.md` (this plan, while editing it) — **Markdown Authoring** rules from `CLAUDE.md`.
- `src/lib/game-engine/GameEngine.flows.mdx`, `*.reference.mdx`, `debugging.mdx` — **`update-architecture-docs`** skill.

This plan does **not** create `*.stories.tsx`, `tests-vr/**`, or `tests-e2e/**` files, so `write-storybook` and `write-e2e-vr-tests` are not required.

---

## File Structure

### New files

```text
src/lib/lifecycle-tts/
└── types.ts                              # LifecycleEvent + EventTemplate (pinned contract)

src/lib/game-engine/
├── definition-types.ts                   # GameDefinition, InteractionAdapter, SideEffect, CelebrationConfig, PhaseContext, RoundOutput, UseGameEngineResult, GameMachineEvent
├── side-effects.ts                       # executeSideEffects(effects)
├── side-effects.test.ts
├── useGameEngine.ts                      # Hook + GameEngineContext + useGameEngineContext
├── useGameEngine.test.tsx
├── interaction-adapter.ts                # answerGameAdapter (concrete adapter for AnswerGameAction)
├── GameEngine.flows.mdx                  # Architecture: phase flow diagrams
├── GameEngine.reference.mdx              # Architecture: API reference
└── debugging.mdx                         # Architecture: debugging guide

src/games/number-match/
├── definition.ts                         # NumberMatch GameDefinition
└── definition.test.ts
```

### Modified files

- `package.json` — add `xstate@^5` and `@xstate/react@^5` dependencies (pinned to v5 majors).
- `src/types/game-events.ts` — add `celebration:start`, `celebration:complete`, `celebration:skip` to `GameEventType` + their event interfaces; add to the `GameEvent` discriminated union.
- `src/components/answer-game/useGameSounds.ts` — remove `confettiReady`/`gameOverReady`/`levelCompleteReady` state and return `void`. Sound playback on phase transitions stays.
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — wire `useGameEngine(numberMatchDef, answerGameAdapter, dispatch)`; replace `phase` reads from `useAnswerGameContext()` with `engine.phase`; add the phase-bridge `useEffect`; replace gate booleans with direct `engine.phase` checks for overlay rendering.
- `src/games/number-match/NumberMatch/NumberMatch.test.tsx` — update assertions that depended on `confettiReady`/`gameOverReady` to use phase-driven assertions.

### Test files (new or extended)

```text
src/lib/lifecycle-tts/types.test-d.ts     # Type-only tests via vitest expect-type or `// @ts-expect-error` lines
src/lib/game-engine/side-effects.test.ts  # Bus emission for emit / speak / delay
src/lib/game-engine/useGameEngine.test.tsx # State transitions, send, context
src/games/number-match/definition.test.ts  # buildRound + tts shape conform to types
src/lib/game-event-bus.test.ts             # Append celebration:* event tests (file already exists)
```

### Deleted files

None in PR 1a. `src/lib/game-engine/lifecycle.ts` is **not** deleted (PR 1c handles it after `GameEngineProvider` migrates off it).

---

## Task 0: Worktree And Branch

**Files:** none — git plumbing.

- [ ] **Step 1: From the project root, create the implementation worktree**

```bash
cd /Users/leocaseiro/Sites/base-skill
git fetch origin master
git worktree add ./worktrees/feat-spec-1a-pr1a-game-engine -b feat/spec-1a-pr1a-game-engine origin/master
cd ./worktrees/feat-spec-1a-pr1a-game-engine
yarn install
```

The branch name mirrors the plan filename (`spec-1a-pr1a-game-engine`), and the worktree lives at `./worktrees/feat-spec-1a-pr1a-game-engine` per `CLAUDE.md` worktree convention.

- [ ] **Step 2: Verify the worktree is clean and on the new branch**

```bash
git status
git branch --show-current
```

Expected: clean tree on `feat/spec-1a-pr1a-game-engine`.

- [ ] **Step 3: Sanity-check the toolchain**

```bash
yarn typecheck
yarn test --run src/lib/game-engine
```

Expected: typecheck PASS; existing engine tests PASS.

---

## Task 1: Install XState v5 Dependencies

**Files:**

- Modify: `package.json` (dependencies)
- Modify: `yarn.lock` (auto)

- [ ] **Step 1: Add `xstate@5` and `@xstate/react@5` as runtime dependencies**

```bash
yarn add xstate@^5 @xstate/react@^5
```

- [ ] **Step 2: Verify both are pinned to v5 majors**

```bash
node -e "const p=require('./package.json');console.log('xstate', p.dependencies.xstate);console.log('@xstate/react', p.dependencies['@xstate/react']);"
```

Expected: both lines start with `^5.`.

- [ ] **Step 3: Confirm install succeeded and types resolve**

```bash
yarn typecheck
```

Expected: PASS — no new type errors. (Adding the dep does not yet introduce imports.)

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "feat(deps): add xstate@5 + @xstate/react@5 for game engine"
```

---

## Task 2: Lifecycle TTS Type Contract Pin

PR 1a creates the minimal `LifecycleEvent` + `EventTemplate` shape that the TTS plan must respect. The TTS plan (`docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` Task 1) imports from this file.

**Files:**

- Create: `src/lib/lifecycle-tts/types.ts`

- [ ] **Step 1: Write the type file**

```ts
// src/lib/lifecycle-tts/types.ts
import type { GradeBand } from '@/types/game-events';

export type LifecycleEvent =
  | 'game.prepare'
  | 'game.start'
  | 'game.resume'
  | 'game.over'
  | 'round.start'
  | 'round.idle'
  | 'round.error'
  | 'round.correct'
  | 'round.celebrate'
  | 'round.advance'
  | 'level.complete';

export type Verbosity = 'off' | 'brief' | 'full';

export type TalkativenessPreset = 'quiet' | 'default' | 'chatty';

export type EventTemplate = {
  tts: { brief: string; full: string };
  byGradeBand: Record<GradeBand, Verbosity>;
  default: Verbosity;
};
```

The shape is the TTS plan Task 1's contract verbatim — keeping the two plans in lockstep.

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: PASS — no errors. The file is referenced by no one yet (downstream usage in Task 4 + Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/lib/lifecycle-tts/types.ts
git commit -m "feat(lifecycle-tts): pin LifecycleEvent + EventTemplate contract"
```

---

## Task 3: Extend `GameEventType` With Celebration + `lifecycle:speak` Events

The engine emits `celebration:start | celebration:complete | celebration:skip` to drive engagement instrumentation (move-log + future SRS), and emits `lifecycle:speak` so the TTS plan's `useLifecycleTTS` (shipping after PR 1a) can subscribe to lifecycle-driven speech. PR 1a owns these type members; the TTS plan only adds `game:prepare`. PR 1a adds the type union members and interfaces; emission lands in Task 5.

**Files:**

- Modify: `src/types/game-events.ts:9-23` (`GameEventType` union)
- Modify: `src/types/game-events.ts` (interfaces + `GameEvent` union)
- Modify: `src/lib/game-event-bus.test.ts` (extend tests)

- [ ] **Step 1: Write failing tests for the three events**

Append to `src/lib/game-event-bus.test.ts`:

```ts
describe('celebration events', () => {
  it('emits and receives celebration:start', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:start', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:start',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('celebration:start');
  });

  it('emits and receives celebration:complete with durationMs', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:complete', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:complete',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
      durationMs: 12_000,
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(
      (received[0] as GameEvent & { durationMs: number }).durationMs,
    ).toBe(12_000);
  });

  it('emits and receives celebration:skip with skipMethod', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('celebration:skip', (e) => received.push(e));

    const event: GameEvent = {
      type: 'celebration:skip',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      miniGame: 'DinoEggHatch',
      phaseId: 'roundComplete',
      levelIndex: 0,
      durationMs: 1_500,
      skipMethod: 'play-again',
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(
      (received[0] as GameEvent & { skipMethod: string }).skipMethod,
    ).toBe('play-again');
  });
});

describe('lifecycle:speak event', () => {
  it('emits and receives lifecycle:speak with lifecycleEvent', () => {
    const bus = createGameEventBus();
    const received: GameEvent[] = [];
    bus.subscribe('lifecycle:speak', (e) => received.push(e));

    const event: GameEvent = {
      type: 'lifecycle:speak',
      gameId: 'number-match',
      sessionId: 'test-session',
      profileId: 'test-profile',
      timestamp: Date.now(),
      roundIndex: 0,
      lifecycleEvent: 'round.start',
    };
    bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('lifecycle:speak');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose
```

Expected: FAIL — `'celebration:start' | 'celebration:complete' | 'celebration:skip' | 'lifecycle:speak'` are not assignable to `GameEventType`.

- [ ] **Step 3: Add the events to `src/types/game-events.ts`**

Extend `GameEventType` (insert after `'game:tile-ejected'`):

```ts
export type GameEventType =
  | 'game:start'
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
  | 'celebration:start'
  | 'celebration:complete'
  | 'celebration:skip'
  | 'lifecycle:speak';
```

Add the interfaces (after the existing event interfaces, before the `GameEvent` union):

```ts
export interface CelebrationStartEvent extends BaseGameEvent {
  type: 'celebration:start';
  miniGame: string;
  phaseId: 'roundComplete' | 'levelComplete' | 'gameOver';
  levelIndex: number;
}

export interface CelebrationCompleteEvent extends BaseGameEvent {
  type: 'celebration:complete';
  miniGame: string;
  phaseId: 'roundComplete' | 'levelComplete' | 'gameOver';
  levelIndex: number;
  durationMs: number;
}

export interface CelebrationSkipEvent extends BaseGameEvent {
  type: 'celebration:skip';
  miniGame: string;
  phaseId: 'roundComplete' | 'levelComplete' | 'gameOver';
  levelIndex: number;
  durationMs: number;
  skipMethod: 'play-again' | 'go-home' | 'timeout';
}

export interface LifecycleSpeakEvent extends BaseGameEvent {
  type: 'lifecycle:speak';
  // LifecycleEvent is defined in src/lib/lifecycle-tts/types.ts (created by Task 2 of this plan)
  lifecycleEvent: import('@/lib/lifecycle-tts/types').LifecycleEvent;
}
```

Add all four to the `GameEvent` discriminated union next to the existing members.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/game-event-bus.test.ts --reporter=verbose
yarn typecheck
```

Expected: PASS for both.

- [ ] **Step 5: Commit**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(events): add celebration:* and lifecycle:speak event types"
```

---

## Task 4: GameDefinition Types

Create the typed surface the engine consumes. `definition-types.ts` is created in PR 1a and merged into `src/lib/game-engine/types.ts` in PR 1c (per design line 165). Keeping it separate now avoids churn against the existing types file and makes the consolidation diff in PR 1c reviewable.

**Files:**

- Create: `src/lib/game-engine/definition-types.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/game-engine/definition-types.ts
import type { Dispatch } from 'react';
import type { AnyStateMachine } from 'xstate';
import type { GameEvent } from '@/types/game-events';
import type {
  EventTemplate,
  LifecycleEvent,
} from '@/lib/lifecycle-tts/types';

/**
 * Phase 1 narrows this union to the modes ready to ship. Future modes
 * (voice-input #309, keyboard-input #286, connect #228, free-form-text)
 * widen this union additively as they ship.
 */
export type InteractionMode = 'drag-to-slot' | 'tap-select';

/**
 * `RoundOutput` is intentionally opaque to the engine. The engine passes it
 * through to the render component without inspection — each game's adapter
 * casts to its concrete shape.
 */
export type RoundOutput = Record<string, unknown>;

export interface PhaseContext {
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  isLastRound: boolean;
  gameId: string;
  previousPhase: string | null;
  currentPhase: string;
}

/**
 * Mini-game celebrations (DinoEggHatch, FireworksPainter, etc.)
 * shown before a phase's normal UI. The engine pauses phase
 * transitions until the mini-game completes, is skipped, or times out.
 */
export interface CelebrationConfig {
  miniGame: string;
  condition?: (ctx: PhaseContext) => boolean;
  renderProps?: Record<string, unknown>;
}

/**
 * Side effects emitted by the engine during state transitions. Resolved by
 * `executeSideEffects` (Task 5) — `speak` and `emit` go to the GameEventBus,
 * `delay` schedules a tracked timeout.
 */
export type SideEffect =
  | { type: 'emit'; event: GameEvent }
  | { type: 'speak'; lifecycleEvent: LifecycleEvent }
  | { type: 'delay'; ms: number };

/**
 * Bridges a GameDefinition to a game-specific reducer. Each adapter method
 * receives `dispatch` as a parameter so adapters can be defined as
 * module-level constants without closing over a per-render dispatch ref.
 */
export interface InteractionAdapter<TAction> {
  advanceRound: (
    roundOutput: RoundOutput,
    dispatch: Dispatch<TAction>,
  ) => void;
  /**
   * Optional — covers games with explicit level boundaries (NumberMatch,
   * SortNumbers, WordSpell). Games without levels omit this.
   */
  advanceLevel?: (
    roundOutput: RoundOutput,
    dispatch: Dispatch<TAction>,
  ) => void;
  completeGame: (dispatch: Dispatch<TAction>) => void;
}

export interface GameDefinition<TRound = unknown> {
  id: string;
  interaction: InteractionMode;
  /**
   * Canonical here. `AnswerGameConfig.slotInteraction` is deprecated in
   * Phase 2 (reducer unification) — the value flows from the engine context.
   */
  slotInteraction?: 'ordered' | 'free-swap';
  /**
   * XState v5 machine — must be created with
   * `setup({ types, guards, actors, actions }).createMachine()`. The engine
   * calls `definition.machine.provide({ guards, actors, actions })` at
   * runtime to inject implementations.
   *
   * Required states: `playing`, `gameOver` (type: 'final').
   * Optional states: `roundComplete`, `levelComplete`, `announcing` (Spec 1b).
   */
  machine: AnyStateMachine;
  /**
   * Required. Synchronous by design — async loaders must resolve before
   * starting the engine. The engine calls `buildRound` on round/level
   * transitions and stores the result in machine context.
   */
  buildRound: (ctx: PhaseContext) => TRound;
  /**
   * `LifecycleEvent` and `EventTemplate` are pinned by
   * `src/lib/lifecycle-tts/types.ts`. The TTS plan extends — never reshapes —
   * this contract.
   */
  tts?: Partial<Record<LifecycleEvent, EventTemplate>>;
}

/**
 * Top-level events the game component can send to the engine.
 * The machine adds game-specific events via `setup({ types: { events } })`.
 */
export type GameMachineEvent =
  | { type: 'ROUND_CORRECT' }
  | { type: 'ROUND_ERROR' }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'GAME_OVER' }
  | { type: 'NEXT' }
  | { type: 'CELEBRATION_DONE'; skipMethod?: 'play-again' | 'go-home' };

/**
 * Public contract returned by `useGameEngine`.
 *
 * `phase` is the current XState state node name (e.g. `playing`,
 * `roundComplete`). `celebrating` returns `null` in PR 1a (Spec Delta 2);
 * PR 1b populates it from machine context once celebration actors fully
 * own their own input.
 */
export interface UseGameEngineResult {
  phase: string;
  currentRound: RoundOutput;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  isLastRound: boolean;
  send: (event: GameMachineEvent) => void;
  celebrating: CelebrationConfig | null;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
yarn typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/game-engine/definition-types.ts
git commit -m "feat(game-engine): add GameDefinition type surface"
```

---

## Task 5: `executeSideEffects`

The engine's actions call `executeSideEffects` to emit on the bus. PR 1a does not subscribe to `lifecycle:speak` (TTS plan owns that). `delay` is implemented as a tracked timeout so the engine can clean up on unmount via the hook (Task 6 wires the cleanup ref).

**Files:**

- Create: `src/lib/game-engine/side-effects.ts`
- Create: `src/lib/game-engine/side-effects.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/game-engine/side-effects.test.ts
import { describe, expect, it, vi } from 'vitest';
import { executeSideEffects } from './side-effects';
import type { SideEffect } from './definition-types';
import { getGameEventBus } from '@/lib/game-event-bus';

const baseEnvelope = {
  gameId: 'number-match',
  sessionId: 'test-session',
  profileId: 'test-profile',
  timestamp: 0,
  roundIndex: 0,
};

describe('executeSideEffects', () => {
  it('emits a lifecycle:speak event for { type: "speak" }', () => {
    const bus = getGameEventBus();
    const received: { type: string }[] = [];
    const unsub = bus.subscribe('lifecycle:speak', (e) =>
      received.push(e),
    );

    executeSideEffects(
      [{ type: 'speak', lifecycleEvent: 'round.correct' }],
      { ...baseEnvelope },
    );

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('lifecycle:speak');
    unsub();
  });

  it('emits the inner event for { type: "emit" }', () => {
    const bus = getGameEventBus();
    const received: { type: string }[] = [];
    const unsub = bus.subscribe('celebration:start', (e) =>
      received.push(e),
    );

    executeSideEffects(
      [
        {
          type: 'emit',
          event: {
            ...baseEnvelope,
            type: 'celebration:start',
            miniGame: 'DinoEggHatch',
            phaseId: 'roundComplete',
            levelIndex: 0,
          },
        },
      ],
      { ...baseEnvelope },
    );

    expect(received).toHaveLength(1);
    unsub();
  });

  it('schedules and clears a delay via setTimeout', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const handle = executeSideEffects(
      [{ type: 'delay', ms: 1000 }],
      { ...baseEnvelope },
      cb,
    );

    vi.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(cb).toHaveBeenCalledTimes(1);

    handle.cancel();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/game-engine/side-effects.test.ts --reporter=verbose
```

Expected: FAIL — `executeSideEffects` is not defined.

- [ ] **Step 3: Implement `executeSideEffects`**

```ts
// src/lib/game-engine/side-effects.ts
import type { SideEffect } from './definition-types';
import type { BaseGameEvent } from '@/types/game-events';
import { getGameEventBus } from '@/lib/game-event-bus';

export interface ExecuteHandle {
  cancel: () => void;
}

/**
 * Process side effects from XState actions. `speak` and `emit` fire on the
 * `GameEventBus`; `delay` schedules a tracked timeout that fires `onDelayDone`
 * if provided. Returned handle lets callers cancel pending delays on unmount.
 */
export const executeSideEffects = (
  effects: SideEffect[],
  envelope: Pick<
    BaseGameEvent,
    'gameId' | 'sessionId' | 'profileId' | 'roundIndex'
  >,
  onDelayDone?: () => void,
): ExecuteHandle => {
  const bus = getGameEventBus();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  for (const effect of effects) {
    switch (effect.type) {
      case 'emit': {
        bus.emit(effect.event);
        break;
      }
      case 'speak': {
        bus.emit({
          ...envelope,
          timestamp: Date.now(),
          type: 'lifecycle:speak',
          lifecycleEvent: effect.lifecycleEvent,
        });
        break;
      }
      case 'delay': {
        const t = setTimeout(() => {
          timers.delete(t);
          onDelayDone?.();
        }, effect.ms);
        timers.add(t);
        break;
      }
    }
  }

  return {
    cancel: () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
    },
  };
};
```

Note: `lifecycle:speak` and `LifecycleSpeakEvent` are added to `GameEventType` in Task 3 of this plan. The TTS plan (Task 2 there) adds only `game:prepare`; it does NOT re-add `lifecycle:speak`. PR 1a is the single owner of the type member.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/game-engine/side-effects.test.ts --reporter=verbose
yarn typecheck
```

Expected: both PASS. If typecheck fails on `'lifecycle:speak'` not being assignable, verify Task 3 added it to `GameEventType` and exported `LifecycleSpeakEvent` correctly.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/side-effects.ts src/lib/game-engine/side-effects.test.ts
git commit -m "feat(game-engine): add executeSideEffects for emit | speak | delay"
```

---

## Task 6: `useGameEngine` Hook + Context

The engine wraps `useMachine(definition.machine.provide({...}))`, exposes a typed `UseGameEngineResult`, and writes `{ definition }` into a React context so child hooks (notably `useLifecycleTTS` in the TTS plan) can read `definition.tts` without prop drilling. PR 1a ships:

- The hook + context + `useGameEngineContext()`
- Engine-provided guards (`isMidLevelRound`, `isLastRoundOfLevel`, `isLastRound`)
- Engine-provided actions (`speak`, `emit`, `buildRound`, `advanceRound`, `advanceLevel`, `completeGame`)
- Engine-provided actors as `fromPromise` timers (`celebrationActor`, `levelCelebrationActor`, `gameOverActor`)

**Files:**

- Create: `src/lib/game-engine/useGameEngine.ts`
- Create: `src/lib/game-engine/useGameEngine.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/game-engine/useGameEngine.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { setup } from 'xstate';
import {
  GameEngineContext,
  useGameEngine,
  useGameEngineContext,
} from './useGameEngine';
import type {
  GameDefinition,
  InteractionAdapter,
} from './definition-types';

interface TestRound {
  prompt: string;
}

interface AdapterAction {
  type: 'ADVANCE_ROUND' | 'ADVANCE_LEVEL' | 'COMPLETE_GAME';
}

const buildTestDefinition = (): GameDefinition<TestRound> => ({
  id: 'test-game',
  interaction: 'drag-to-slot',
  buildRound: (ctx) => ({
    prompt: `round-${ctx.roundIndex}`,
  }),
  machine: setup({
    types: {} as {
      context: { roundIndex: number; levelIndex: number };
      events:
        | { type: 'ROUND_CORRECT' }
        | { type: 'ROUND_ERROR' }
        | { type: 'NEXT' }
        | { type: 'GAME_OVER' };
    },
  }).createMachine({
    id: 'test-game',
    initial: 'playing',
    context: { roundIndex: 0, levelIndex: 0 },
    states: {
      playing: {
        on: {
          ROUND_CORRECT: 'roundComplete',
          GAME_OVER: 'gameOver',
        },
      },
      roundComplete: {
        on: {
          NEXT: 'playing',
        },
      },
      gameOver: { type: 'final' },
    },
  }),
});

const noopAdapter: InteractionAdapter<AdapterAction> = {
  advanceRound: vi.fn(),
  advanceLevel: vi.fn(),
  completeGame: vi.fn(),
};

describe('useGameEngine', () => {
  it('starts in `playing` state', () => {
    const def = buildTestDefinition();
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useGameEngine(def, noopAdapter, dispatch),
    );
    expect(result.current.phase).toBe('playing');
  });

  it('transitions on `send`', () => {
    const def = buildTestDefinition();
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useGameEngine(def, noopAdapter, dispatch),
    );

    act(() => {
      result.current.send({ type: 'ROUND_CORRECT' });
    });
    expect(result.current.phase).toBe('roundComplete');

    act(() => {
      result.current.send({ type: 'NEXT' });
    });
    expect(result.current.phase).toBe('playing');
  });

  it('exposes definition through GameEngineContext', () => {
    const def = buildTestDefinition();
    const dispatch = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const engine = useGameEngine(def, noopAdapter, dispatch);
      return (
        <GameEngineContext.Provider value={{ definition: def, engine }}>
          {children}
        </GameEngineContext.Provider>
      );
    };

    const { result } = renderHook(() => useGameEngineContext(), {
      wrapper,
    });
    expect(result.current.definition.id).toBe('test-game');
  });

  it('returns `celebrating: null` in PR 1a (Spec Delta)', () => {
    const def = buildTestDefinition();
    const { result } = renderHook(() =>
      useGameEngine(def, noopAdapter, vi.fn()),
    );
    expect(result.current.celebrating).toBeNull();
  });

  it('throws when `useGameEngineContext` is called outside provider', () => {
    expect(() => renderHook(() => useGameEngineContext())).toThrow(
      /GameEngineContext/,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```tsx
// src/lib/game-engine/useGameEngine.ts
import { useMachine } from '@xstate/react';
import {
  createContext,
  useContext,
  useMemo,
  type Dispatch,
} from 'react';
import { fromPromise } from 'xstate';
import { executeSideEffects } from './side-effects';
import type {
  CelebrationConfig,
  GameDefinition,
  GameMachineEvent,
  InteractionAdapter,
  PhaseContext,
  RoundOutput,
  UseGameEngineResult,
} from './definition-types';

interface GameEngineContextValue<TRound = unknown> {
  definition: GameDefinition<TRound>;
  engine: UseGameEngineResult;
}

export const GameEngineContext =
  createContext<GameEngineContextValue | null>(null);

export const useGameEngineContext = <
  TRound,
>(): GameEngineContextValue<TRound> => {
  const ctx = useContext(GameEngineContext);
  if (!ctx) {
    throw new Error(
      'useGameEngineContext must be used within GameEngineContext.Provider',
    );
  }
  return ctx as GameEngineContextValue<TRound>;
};

const DEFAULT_MAX_DURATION_MS = 60_000;

const buildEngineActors = () => ({
  /**
   * `fromPromise` actors that resolve after `maxDuration` (PR 1a Spec Delta 3).
   * Parent state listens for `CELEBRATION_DONE` to short-circuit when the
   * user dismisses early.
   */
  celebrationActor: fromPromise<
    void,
    { renderProps?: { maxDuration?: number } }
  >(
    ({ input }) =>
      new Promise<void>((resolve) => {
        const ms =
          input?.renderProps?.maxDuration ?? DEFAULT_MAX_DURATION_MS;
        setTimeout(resolve, ms);
      }),
  ),
  levelCelebrationActor: fromPromise<
    void,
    { renderProps?: { maxDuration?: number } }
  >(
    ({ input }) =>
      new Promise<void>((resolve) => {
        const ms =
          input?.renderProps?.maxDuration ?? DEFAULT_MAX_DURATION_MS;
        setTimeout(resolve, ms);
      }),
  ),
  gameOverActor: fromPromise<
    void,
    { renderProps?: { maxDuration?: number } }
  >(
    ({ input }) =>
      new Promise<void>((resolve) => {
        const ms =
          input?.renderProps?.maxDuration ?? DEFAULT_MAX_DURATION_MS;
        setTimeout(resolve, ms);
      }),
  ),
  /**
   * Placeholder for Spec 1b WordSpell phoneme-sequence announce flow.
   * Resolves immediately in PR 1a — Spec 1b implements the full sequence.
   */
  phonemeSequenceActor: fromPromise<void, unknown>(() =>
    Promise.resolve(),
  ),
});

const buildEngineGuards = (totalRounds: number, levelSize: number) => ({
  isMidLevelRound: ({
    context,
  }: {
    context: { roundIndex: number; levelIndex: number };
  }): boolean => {
    const positionInLevel =
      (context.roundIndex + 1) % Math.max(levelSize, 1);
    return (
      positionInLevel !== 0 && context.roundIndex + 1 < totalRounds
    );
  },
  isLastRoundOfLevel: ({
    context,
  }: {
    context: { roundIndex: number };
  }): boolean => {
    const positionInLevel =
      (context.roundIndex + 1) % Math.max(levelSize, 1);
    return (
      positionInLevel === 0 && context.roundIndex + 1 < totalRounds
    );
  },
  isLastRound: ({
    context,
  }: {
    context: { roundIndex: number };
  }): boolean => context.roundIndex + 1 >= totalRounds,
});

interface EngineEnvelope {
  gameId: string;
  sessionId: string;
  profileId: string;
  roundIndex: number;
}

export const useGameEngine = <TRound, TAction>(
  definition: GameDefinition<TRound>,
  adapter: InteractionAdapter<TAction>,
  dispatch: Dispatch<TAction>,
  options?: {
    totalRounds?: number;
    levelSize?: number;
    envelope?: Partial<EngineEnvelope>;
  },
): UseGameEngineResult => {
  const totalRounds = options?.totalRounds ?? 0;
  const levelSize = options?.levelSize ?? totalRounds;
  const envelope: EngineEnvelope = useMemo(
    () => ({
      gameId: definition.id,
      sessionId: options?.envelope?.sessionId ?? '',
      profileId: options?.envelope?.profileId ?? '',
      roundIndex: options?.envelope?.roundIndex ?? 0,
    }),
    [
      definition.id,
      options?.envelope?.sessionId,
      options?.envelope?.profileId,
      options?.envelope?.roundIndex,
    ],
  );

  const machineWithImpls = useMemo(() => {
    return definition.machine.provide({
      guards: buildEngineGuards(totalRounds, levelSize),
      actors: buildEngineActors(),
      actions: {
        speak: (
          _,
          params: { lifecycleEvent: PhaseContext['currentPhase'] },
        ) =>
          executeSideEffects(
            [
              {
                type: 'speak',
                lifecycleEvent:
                  params.lifecycleEvent as never as import('@/lib/lifecycle-tts/types').LifecycleEvent, // narrowed by definition.tts at call sites
              },
            ],
            envelope,
          ),
        emit: (
          _,
          params: { event: import('@/types/game-events').GameEvent },
        ) =>
          executeSideEffects(
            [{ type: 'emit', event: params.event }],
            envelope,
          ),
        buildRound: ({
          context,
        }: {
          context: { phaseContext: PhaseContext };
        }) => {
          const round = definition.buildRound(context.phaseContext);
          return round as RoundOutput;
        },
        advanceRound: ({
          context,
        }: {
          context: { lastRoundOutput: RoundOutput };
        }) => adapter.advanceRound(context.lastRoundOutput, dispatch),
        advanceLevel: ({
          context,
        }: {
          context: { lastRoundOutput: RoundOutput };
        }) => adapter.advanceLevel?.(context.lastRoundOutput, dispatch),
        completeGame: () => adapter.completeGame(dispatch),
      },
    });
    // adapter + dispatch are stable across renders for module-level adapters;
    // definition + envelope are the meaningful inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, totalRounds, levelSize, envelope]);

  const [state, send] = useMachine(machineWithImpls);

  return useMemo<UseGameEngineResult>(
    () => ({
      phase:
        typeof state.value === 'string'
          ? state.value
          : (Object.keys(state.value)[0] ?? 'unknown'),
      currentRound:
        ((state.context as Record<string, unknown>)
          .lastRoundOutput as RoundOutput) ?? ({} as RoundOutput),
      roundIndex:
        ((state.context as Record<string, unknown>)
          .roundIndex as number) ?? 0,
      levelIndex:
        ((state.context as Record<string, unknown>)
          .levelIndex as number) ?? 0,
      totalRounds,
      isLastRound:
        (((state.context as Record<string, unknown>)
          .roundIndex as number) ?? 0) +
          1 >=
        totalRounds,
      send: (event) => send(event as never),
      // Spec Delta 2: PR 1a always returns null. PR 1b reads context.activeCelebration.
      celebrating: null as CelebrationConfig | null,
    }),
    [state, send, totalRounds],
  );
};
```

The hook deliberately keeps `state.context` typing loose (`Record<string, unknown>` casts) — game definitions choose their own context shape via `setup({ types: { context } })`. The `definition.tts` typed shape is unaffected; the `context` casts only relate to `roundIndex`/`levelIndex`/`lastRoundOutput` access. PR 1c folds this into the canonical `types.ts` and tightens the access pattern.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/game-engine/useGameEngine.test.tsx --reporter=verbose
yarn typecheck
```

Expected: PASS for all five test cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/useGameEngine.ts src/lib/game-engine/useGameEngine.test.tsx
git commit -m "feat(game-engine): add useGameEngine hook + GameEngineContext"
```

---

## Task 7: `interaction-adapter.ts` With `answerGameAdapter`

NumberMatch (and PR 1b's WordSpell + SortNumbers) all dispatch into the same `AnswerGameAction` reducer, so the adapter is shared.

**Files:**

- Create: `src/lib/game-engine/interaction-adapter.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/game-engine/interaction-adapter.ts
import type { AnswerGameAction } from '@/components/answer-game/types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type {
  InteractionAdapter,
  RoundOutput,
} from './definition-types';

interface AnswerGameRoundOutput extends RoundOutput {
  tiles: TileItem[];
  zones: AnswerZone[];
}

const isAnswerGameRoundOutput = (
  output: RoundOutput,
): output is AnswerGameRoundOutput =>
  Array.isArray((output as AnswerGameRoundOutput).tiles) &&
  Array.isArray((output as AnswerGameRoundOutput).zones);

export const answerGameAdapter: InteractionAdapter<AnswerGameAction> = {
  advanceRound: (roundOutput, dispatch) => {
    if (!isAnswerGameRoundOutput(roundOutput)) {
      throw new Error(
        'answerGameAdapter.advanceRound: roundOutput is missing { tiles, zones }',
      );
    }
    dispatch({
      type: 'ADVANCE_ROUND',
      tiles: roundOutput.tiles,
      zones: roundOutput.zones,
    });
  },
  advanceLevel: (roundOutput, dispatch) => {
    if (!isAnswerGameRoundOutput(roundOutput)) {
      throw new Error(
        'answerGameAdapter.advanceLevel: roundOutput is missing { tiles, zones }',
      );
    }
    dispatch({
      type: 'ADVANCE_LEVEL',
      tiles: roundOutput.tiles,
      zones: roundOutput.zones,
    });
  },
  completeGame: (dispatch) => {
    dispatch({ type: 'COMPLETE_GAME' });
  },
};
```

The runtime guard turns "engine handed me an opaque `RoundOutput`" into a typed `AnswerGameAction` payload, with a clear failure message if a future game definition forgets to return `{ tiles, zones }` from `buildRound`. WordSpell + SortNumbers reuse this adapter unchanged in PR 1b.

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/game-engine/interaction-adapter.ts
git commit -m "feat(game-engine): add answerGameAdapter for AnswerGameAction reducer"
```

---

## Task 8: NumberMatch GameDefinition

Encodes NumberMatch as a `GameDefinition<NumberMatchRound>`. NumberMatch has **no level boundaries** today, so the machine is the simplest variant: `playing → roundComplete → waitingForNext → playing | gameOver`. Level handling in `buildEngineGuards` already supports the no-level case (`levelSize === totalRounds`).

**Files:**

- Create: `src/games/number-match/definition.ts`
- Create: `src/games/number-match/definition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/games/number-match/definition.test.ts
import { describe, expect, it } from 'vitest';
import { numberMatchDefinition } from './definition';

describe('numberMatchDefinition', () => {
  it('declares the id and interaction mode', () => {
    expect(numberMatchDefinition.id).toBe('number-match');
    expect(numberMatchDefinition.interaction).toBe('drag-to-slot');
  });

  it('has a buildRound function', () => {
    expect(typeof numberMatchDefinition.buildRound).toBe('function');
  });

  it('has the required tts entries', () => {
    const tts = numberMatchDefinition.tts ?? {};
    expect(tts['game.start']).toBeDefined();
    expect(tts['round.correct']).toBeDefined();
    expect(tts['round.error']).toBeDefined();
    expect(tts['game.over']).toBeDefined();
  });

  it('declares the required machine states', () => {
    const states =
      (
        numberMatchDefinition.machine.config as {
          states?: Record<string, unknown>;
        }
      ).states ?? {};
    expect(states.playing).toBeDefined();
    expect(states.roundComplete).toBeDefined();
    expect(states.waitingForNext).toBeDefined();
    expect(states.gameOver).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/games/number-match/definition.test.ts --reporter=verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the definition**

```ts
// src/games/number-match/definition.ts
import { setup } from 'xstate';
import type {
  GameDefinition,
  RoundOutput,
} from '@/lib/game-engine/definition-types';

export interface NumberMatchEngineContext {
  roundIndex: number;
  levelIndex: number;
  lastRoundOutput: RoundOutput;
  phaseContext: {
    roundIndex: number;
    levelIndex: number;
    totalRounds: number;
    isLastRound: boolean;
    gameId: string;
    previousPhase: string | null;
    currentPhase: string;
  };
}

type NumberMatchEvent =
  | { type: 'ROUND_CORRECT' }
  | { type: 'ROUND_ERROR' }
  | { type: 'NEXT' }
  | { type: 'CELEBRATION_DONE'; skipMethod?: 'play-again' | 'go-home' }
  | { type: 'GAME_OVER' };

const numberMatchMachine = setup({
  types: {} as {
    context: NumberMatchEngineContext;
    events: NumberMatchEvent;
  },
  guards: {
    isMidLevelRound: () => false,
    isLastRoundOfLevel: () => false,
    isLastRound: () => false,
  },
  actors: {
    celebrationActor: undefined as never,
    gameOverActor: undefined as never,
  },
  actions: {
    speak: () => {},
    buildRound: () => {},
    advanceRound: () => {},
    completeGame: () => {},
  },
}).createMachine({
  id: 'number-match',
  initial: 'playing',
  context: {
    roundIndex: 0,
    levelIndex: 0,
    lastRoundOutput: {} as RoundOutput,
    phaseContext: {
      roundIndex: 0,
      levelIndex: 0,
      totalRounds: 0,
      isLastRound: false,
      gameId: 'number-match',
      previousPhase: null,
      currentPhase: 'playing',
    },
  },
  // Root-level handler: the phase bridge can fire GAME_OVER from any state
  // (e.g., reducer hits game-over while engine is in roundComplete). The
  // round-advance effect normally drives the transition through
  // `CELEBRATION_DONE` → `NEXT` with the `isLastRound` guard; this is
  // defense-in-depth so the engine never gets stuck.
  on: {
    GAME_OVER: '.gameOver',
  },
  states: {
    playing: {
      entry: [
        { type: 'speak', params: { lifecycleEvent: 'game.start' } },
      ],
      on: {
        ROUND_CORRECT: {
          target: 'roundComplete',
          actions: [
            {
              type: 'speak',
              params: { lifecycleEvent: 'round.correct' },
            },
          ],
        },
        ROUND_ERROR: {
          actions: [
            {
              type: 'speak',
              params: { lifecycleEvent: 'round.error' },
            },
          ],
        },
      },
    },
    roundComplete: {
      invoke: {
        src: 'celebrationActor',
        input: () => ({
          renderProps: { maxDuration: 60_000 },
        }),
        onDone: 'waitingForNext',
      },
      on: {
        CELEBRATION_DONE: 'waitingForNext',
      },
    },
    waitingForNext: {
      on: {
        NEXT: [
          {
            target: 'playing',
            guard: 'isMidLevelRound',
            actions: ['buildRound', 'advanceRound'],
          },
          {
            target: 'gameOver',
            guard: 'isLastRound',
          },
        ],
      },
    },
    gameOver: {
      type: 'final',
      invoke: {
        src: 'gameOverActor',
        input: () => ({
          renderProps: { maxDuration: 60_000 },
        }),
        onDone: {
          actions: [
            { type: 'speak', params: { lifecycleEvent: 'game.over' } },
            'completeGame',
          ],
        },
      },
    },
  },
});

export const numberMatchDefinition: GameDefinition = {
  id: 'number-match',
  interaction: 'drag-to-slot',
  slotInteraction: 'free-swap',
  machine: numberMatchMachine,
  /**
   * NumberMatch's render component (`NumberMatch.tsx`) holds the round
   * factory closure. PR 1a's `buildRound` is a passthrough — the component
   * passes the resolved round into machine context via `INIT_ROUND`-style
   * events that we route through `engine.send` in Task 9. PR 1b will move
   * the round-construction logic into the definition once WordSpell +
   * SortNumbers migrate (they need the same closure shape).
   */
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  tts: {
    'game.prepare': {
      tts: { brief: 'Number Match', full: 'Number Match' },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'brief',
    },
    'game.start': {
      tts: {
        brief: 'Match the numbers!',
        full: "Let's match the numbers!",
      },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'full',
        'year5-6': 'full',
      },
      default: 'brief',
    },
    'round.correct': {
      tts: { brief: 'Well done!', full: 'Well done!' },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'full',
        'year5-6': 'full',
      },
      default: 'brief',
    },
    'round.error': {
      tts: { brief: 'Try again!', full: 'Try again!' },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'full',
        'year5-6': 'full',
      },
      default: 'brief',
    },
    'game.over': {
      tts: { brief: 'Game over!', full: 'Fantastic! Game over!' },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'full',
        'year5-6': 'full',
      },
      default: 'brief',
    },
  },
};
```

The `setup({ guards / actors / actions })` declarations use placeholder implementations because `useGameEngine` injects the real ones via `definition.machine.provide({...})` at runtime. The placeholders satisfy `setup()`'s typecheck — XState v5 requires every named handler to be declared in `setup()` so the machine config typechecks references.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/games/number-match/definition.test.ts --reporter=verbose
yarn typecheck
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/number-match/definition.ts src/games/number-match/definition.test.ts
git commit -m "feat(number-match): add GameDefinition for engine integration"
```

---

## Task 9: Migrate `NumberMatch.tsx` To Engine-Driven Phases

Replace `phase` reads from `useAnswerGameContext()` with `engine.phase` everywhere outside the phase bridge. Keep the existing `buildNumeralRound` factory in the React component (PR 1a punts the closure-shape generalization to PR 1b — Spec Delta 4 / Task 8 note). Remove the `confettiReady`/`gameOverReady` reads in this file; they're replaced by direct `engine.phase` checks. Existing `useRoundTTS` is **kept unchanged**.

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx:91-352` (the `NumberMatchSession` inner component)
- Modify: `src/games/number-match/NumberMatch/NumberMatch.test.tsx` (assertions on overlay rendering)

- [ ] **Step 1: Write the failing test (regression — no double-mount)**

Append to `src/games/number-match/NumberMatch/NumberMatch.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
// ... existing imports ...

describe('NumberMatch — engine integration (PR 1a)', () => {
  it('renders the game without error and reads phase from useGameEngine', () => {
    // This test verifies the migration didn't regress — the game still
    // mounts, and phase-driven UI (round-complete overlay) shows up via
    // engine.phase rather than confettiReady.
    render(<NumberMatch config={makeBasicConfig()} />);

    // Drive a round to completion via the existing test harness;
    // confirm the round-complete overlay renders exactly once
    // (no double-mount race from the removed gate).
    // ... use existing helper (e.g. completeRound(...)) ...
    completeRound();

    const overlays = screen.queryAllByTestId('round-complete-effect');
    expect(overlays).toHaveLength(1);
  });
});
```

If the existing test file has no `completeRound` helper, replicate the round-completion sequence using the existing test harness from `NumberMatch.test.tsx` — find the test that drives a round to completion and reuse its setup. The key assertion is single-mount of the overlay.

- [ ] **Step 2: Run the test to verify it fails (or to confirm baseline before migrating)**

```bash
npx vitest run src/games/number-match/NumberMatch/NumberMatch.test.tsx --reporter=verbose
```

Expected at this point: PASS or FAIL depending on whether `data-testid="round-complete-effect"` exists; if not, add it to the `RoundCompleteEffect` skin slot rendering path so the test can locate the overlay.

- [ ] **Step 3: Wire `useGameEngine` into the session component**

In `src/games/number-match/NumberMatch/NumberMatch.tsx`, modify `NumberMatchSession`:

Replace the imports section (around lines 27–36) to add:

```ts
import { useGameEngine } from '@/lib/game-engine/useGameEngine';
import { answerGameAdapter } from '@/lib/game-engine/interaction-adapter';
import { numberMatchDefinition } from '../definition';
```

Inside `NumberMatchSession`, replace lines 102–110 (the `useAnswerGameContext` + `useGameSounds` block) with:

```tsx
const {
  phase: reducerPhase,
  roundIndex,
  retryCount,
  zones,
} = useAnswerGameContext();
const dispatch = useAnswerGameDispatch();

const engine = useGameEngine(
  numberMatchDefinition,
  answerGameAdapter,
  dispatch,
  {
    totalRounds: roundOrder.length,
    levelSize: roundOrder.length,
    envelope: { roundIndex },
  },
);
```

Add the phase bridge effect immediately after the existing `useRoundTTS(...)` call (around line 118):

```tsx
useEffect(() => {
  if (reducerPhase === 'round-complete') {
    engine.send({ type: 'ROUND_CORRECT' });
  } else if (reducerPhase === 'game-over') {
    engine.send({ type: 'GAME_OVER' });
  }
}, [reducerPhase, engine]);
```

Replace the round-advance effect (lines 151–207) — the engine drives advancement by sequencing `CELEBRATION_DONE` (roundComplete → waitingForNext) then `NEXT` (waitingForNext → playing or gameOver, by guard). Keep the existing 750 ms delay; gate on `engine.phase === 'roundComplete'`:

```tsx
useEffect(() => {
  if (engine.phase !== 'roundComplete') return;

  const token = ++completionToken.current;
  const delayMs = 750;
  const timer = globalThis.setTimeout(() => {
    if (completionToken.current !== token) return;

    const isLastRound = roundIndex >= roundOrder.length - 1;
    const nextConfigIndex = roundOrder[roundIndex + 1];
    const nextRound =
      nextConfigIndex === undefined
        ? undefined
        : numberMatchConfig.rounds[nextConfigIndex];
    const value = nextRound?.value;

    if (isLastRound || value === undefined) {
      // Reducer transitions to game-over; engine traverses
      // roundComplete → waitingForNext → gameOver via the isLastRound guard.
      dispatch({ type: 'COMPLETE_GAME' });
      engine.send({ type: 'CELEBRATION_DONE' });
      engine.send({ type: 'NEXT' });
      return;
    }

    const { tiles: nextTiles, zones: nextZones } = buildNumeralRound(
      value,
      {
        tileBankMode: numberMatchConfig.tileBankMode,
        distractorCount: numberMatchConfig.distractorCount,
        range: numberMatchConfig.range,
        mode: numberMatchConfig.mode,
        locale: numberWordsLocale,
      },
    );
    // Reducer advances to the next round (resets tiles/zones for `playing`);
    // engine traverses roundComplete → waitingForNext → playing via
    // `isMidLevelRound`. XState v5 processes the two `send` calls
    // synchronously in order — the guard sees the same `roundIndex` for
    // routing.
    answerGameAdapter.advanceRound(
      { tiles: nextTiles, zones: nextZones },
      dispatch,
    );
    engine.send({ type: 'CELEBRATION_DONE' });
    engine.send({ type: 'NEXT' });
  }, delayMs);

  return () => {
    globalThis.clearTimeout(timer);
  };
}, [
  engine,
  roundIndex,
  dispatch,
  roundOrder,
  numberMatchConfig.rounds,
  numberMatchConfig.tileBankMode,
  numberMatchConfig.distractorCount,
  numberMatchConfig.range,
  numberMatchConfig.mode,
  numberWordsLocale,
]);
```

Replace the overlay rendering block (lines 330–350) to gate on `engine.phase`:

```tsx
{
  skin.RoundCompleteEffect ? (
    <skin.RoundCompleteEffect
      visible={engine.phase === 'roundComplete'}
      data-testid="round-complete-effect"
    />
  ) : (
    <ScoreAnimation
      visible={engine.phase === 'roundComplete'}
      data-testid="round-complete-effect"
    />
  );
}
{
  engine.phase === 'gameOver' ? (
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

If `RoundCompleteEffect` and `ScoreAnimation` don't accept `data-testid`, add the prop in their definitions (small change — add to the destructured props and forward to the root element).

Replace the existing `useEffect` that emits `game:end` (lines 128–149) — gate it on `engine.phase === 'gameOver'` instead of `reducerPhase === 'game-over'`:

```tsx
useEffect(() => {
  if (engine.phase !== 'gameOver') return;
  getGameEventBus().emit({
    type: 'game:end',
    gameId: numberMatchConfig.gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex,
    finalScore: 0,
    totalRounds: roundOrder.length,
    correctCount: 0,
    durationMs: 0,
    retryCount,
  });
}, [
  engine.phase,
  numberMatchConfig.gameId,
  roundIndex,
  roundOrder.length,
  retryCount,
]);
```

Remove the `useGameSounds` import and the `confettiReady`/`gameOverReady` destructuring entirely.

- [ ] **Step 4: Run the new + existing test suite**

```bash
npx vitest run src/games/number-match/NumberMatch/NumberMatch.test.tsx --reporter=verbose
```

Expected: PASS — single-mount overlay confirmed; existing tests pass with engine-driven phase reads.

- [ ] **Step 5: Manual smoke check**

```bash
yarn dev
```

Open `http://localhost:3000`, start a NumberMatch session, complete one round.

Verify:

- The round-complete overlay renders once (no flicker / double-mount).
- The 750 ms delay still feels right.
- Game-over overlay shows after the last round.
- Restart works.

- [ ] **Step 6: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx \
        src/games/number-match/NumberMatch/NumberMatch.test.tsx
git commit -m "feat(number-match): drive phases through useGameEngine"
```

---

## Task 10: Remove `useGameSounds` Celebration Gate

The hook still plays sounds on phase transitions, but the `confettiReady` / `levelCompleteReady` / `gameOverReady` booleans are removed (Spec Delta 1). Sound playback stays — the Promise-resolved booleans were the gate that caused the double-mount race.

**Files:**

- Modify: `src/components/answer-game/useGameSounds.ts`
- Modify: `src/components/answer-game/useGameSounds.test.tsx`

- [ ] **Step 1: Update the test**

Open `src/components/answer-game/useGameSounds.test.tsx`. Remove or replace any test asserting on `confettiReady`, `levelCompleteReady`, or `gameOverReady` return values. Add a single test that asserts the hook still triggers `playSound` on the relevant phase transitions:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameSounds } from './useGameSounds';
import * as audio from '@/lib/audio/AudioFeedback';

vi.mock('./useAnswerGameContext');

describe('useGameSounds', () => {
  beforeEach(() =>
    vi.spyOn(audio, 'playSound').mockImplementation(() => {}),
  );

  it('plays the round-complete sound on entry to round-complete phase', () => {
    // Arrange the mocked useAnswerGameContext to return phase: 'round-complete'.
    // (Use the existing mock-helper pattern in this test file.)

    const { rerender } = renderHook(() => useGameSounds());
    // ... drive phase from 'playing' → 'round-complete' via the mock ...
    rerender();

    expect(audio.playSound).toHaveBeenCalledWith('round-complete');
  });
});
```

Adapt the mock-helper pattern to match the existing test file (the previous test already mocked `useAnswerGameContext` — reuse that approach).

- [ ] **Step 2: Run the test to verify it fails (only if you assert on the removed booleans)**

```bash
npx vitest run src/components/answer-game/useGameSounds.test.tsx --reporter=verbose
```

If the existing test file still asserts on the removed booleans, the suite fails — that's the failing test signal.

- [ ] **Step 3: Strip the booleans from the hook**

Replace the entire `useGameSounds` body:

```ts
// src/components/answer-game/useGameSounds.ts
import { useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import type { AnswerGamePhase } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

export const useGameSounds = (): void => {
  const { phase } = useAnswerGameContext();
  const prevPhaseRef = useRef<AnswerGamePhase>(phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === prev) return;

    switch (phase) {
      case 'round-complete': {
        playSound('round-complete');
        break;
      }
      case 'level-complete': {
        playSound('level-complete');
        break;
      }
      case 'game-over': {
        playSound('game-complete');
        break;
      }
    }
  }, [phase]);
};
```

The hook now returns `void`. NumberMatch already removed its consumer in Task 9. Search for other consumers and remove their destructuring:

```bash
grep -rn "useGameSounds()" src/
```

If the search finds any other call site (e.g. `WordSpell.tsx` or `SortNumbers.tsx`) that destructures the booleans, update it to either drop the destructuring (preferred) or replace those reads with `engine.phase` once those games migrate in PR 1b. **Do not** leave dangling destructuring of removed properties — TypeScript will fail.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/answer-game/useGameSounds.test.tsx --reporter=verbose
yarn typecheck
yarn test --run
```

Expected: all PASS. If `yarn typecheck` flags WordSpell or SortNumbers consumers, fix the destructuring there (drop the booleans). PR 1b will fully migrate those games — for PR 1a we just stop reading the removed properties.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/useGameSounds.ts \
        src/components/answer-game/useGameSounds.test.tsx \
        src/games/word-spell/WordSpell/WordSpell.tsx \
        src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "refactor(useGameSounds): drop confettiReady/gameOverReady gate"
```

(Only stage the files that actually changed — if WordSpell / SortNumbers don't destructure the booleans, drop them from the `git add`.)

---

## Task 11: Architecture MDX Docs

Per `CLAUDE.md` "Architecture Documentation", any change to game-state logic must update co-located `.mdx` docs in the same PR. The design doc lists three new files for PR 1a (lines 130). Run `/update-architecture-docs` first so the docs follow the project template, then write content using the section guides below.

**Files:**

- Create: `src/lib/game-engine/GameEngine.flows.mdx`
- Create: `src/lib/game-engine/GameEngine.reference.mdx`
- Create: `src/lib/game-engine/debugging.mdx`

- [ ] **Step 1: Invoke the `/update-architecture-docs` skill**

In the executor session, invoke the skill before writing any of the three files. It returns the canonical structure and writing guidelines for `*.flows.mdx`, `*.reference.mdx`, and `debugging.mdx` in this repo.

- [ ] **Step 2: Write `GameEngine.flows.mdx`**

Required sections (per the skill's template — adapt as the skill prescribes):

1. **Phase lifecycle diagram** — Mermaid statechart copied from the design doc lines 717–761, narrowed to the four states PR 1a ships (`playing`, `roundComplete`, `waitingForNext`, `gameOver`). Note inline that `levelComplete` and `announcing` land in PR 1b/1c (level boundaries) and Spec 1b (announcing).
2. **Phase bridge pattern** — explain that the answer-game reducer keeps `phase` in PR 1a; the per-game wrapper bridges `reducer.phase → engine.send(...)`. Diagram or pseudocode.
3. **Side-effect flow** — `XState entry/transition action → executeSideEffects → GameEventBus → (PR 1a: no subscriber for lifecycle:speak; TTS plan adds useLifecycleTTS later)`.
4. **Celebration semantics (PR 1a scope)** — engine emits no `celebration:*` events yet (Spec Delta 3 — actors are timer-based); NumberMatch's overlay renders on `engine.phase === 'roundComplete' | 'gameOver'`. Engine-emitted `celebration:start | complete | skip` lands in PR 1b.

- [ ] **Step 3: Write `GameEngine.reference.mdx`**

Required sections:

1. **`useGameEngine(definition, adapter, dispatch, options?)`** — full signature, parameter table, return shape (`UseGameEngineResult`), invariants (synchronous `buildRound`, machine must include `playing` + `gameOver` states).
2. **`GameEngineContext` + `useGameEngineContext()`** — usage pattern for child hooks (`useLifecycleTTS` will read `definition.tts`).
3. **`InteractionAdapter<TAction>`** — interface, `answerGameAdapter` example, runtime guard semantics.
4. **`GameDefinition<TRound>`** — every field, with `tts` table example pulled from `numberMatchDefinition`.
5. **Spec Deltas (PR 1a)** — short bullet list mirroring the deltas in this plan, so future readers see the partial-implementation boundaries clearly.

- [ ] **Step 4: Write `debugging.mdx`**

Required sections:

1. **"My phase isn't transitioning"** — checklist: phase bridge effect wired? `engine.send` called? Machine state list includes the target?
2. **"My TTS doesn't speak"** — PR 1a doesn't subscribe to `lifecycle:speak`; explain that prompt TTS goes through existing `useRoundTTS`.
3. **"Celebration overlay renders twice"** — confirms `useGameSounds` no longer returns the gate; confirm only one mount path (skin slot driven by `engine.phase`).
4. **"How do I add a new game?"** — minimal recipe pointing to the NumberMatch definition as the canonical example.
5. **XState devtools** — link to `@xstate/inspect` setup (or `useMachine` devtools options if that's how this project surfaces it). If devtools wiring isn't shipping in PR 1a, note "deferred to PR 1c".

- [ ] **Step 5: Lint and validate the MDX**

```bash
yarn fix:md
yarn lint:md
yarn typecheck
```

Expected: PASS — markdownlint and Prettier accept the three new files; typecheck remains green (MDX files don't affect TS).

- [ ] **Step 6: Commit**

```bash
git add src/lib/game-engine/GameEngine.flows.mdx \
        src/lib/game-engine/GameEngine.reference.mdx \
        src/lib/game-engine/debugging.mdx
git commit -m "docs(game-engine): add architecture docs for engine foundation"
```

---

## Task 12: Final Verification, Plan Markdown Lint, Push, And PR

- [ ] **Step 1: Run the full check suite (matching CI)**

```bash
yarn typecheck
yarn test --run
yarn lint
yarn lint:md
yarn lint:css
```

Expected: all PASS. If `yarn lint` flags `eslint-plugin-unicorn` or React rules (`react/function-component-definition`), fix in place — CLAUDE.md mandates `const` components.

- [ ] **Step 2: Run VR tests (Docker)**

NumberMatch has VR coverage. Confirm baselines still match.

```bash
yarn test:vr
```

If diffs are produced and they're intentional (overlay timing changed), update baselines:

```bash
yarn test:vr:update
```

If Docker isn't running, use `SKIP_VR=1` for the push but document the reason in the PR description.

- [ ] **Step 3: Run the markdown auto-fix on this plan file**

This plan was edited by an agent. Per `CLAUDE.md` Markdown Authoring rules:

```bash
yarn fix:md
yarn lint:md
npx prettier --check docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md
```

Expected: PASS for both. (Note: this step is run in the **plan-writing worktree** — `worktrees/docs-game-definition-design` — not the implementation worktree, since the plan file lives there.)

- [ ] **Step 4: Push the implementation branch**

```bash
git push -u origin feat/spec-1a-pr1a-game-engine
```

If pre-push hooks complain about specific buckets (e.g. VR), use the appropriate `SKIP_*` flag and document in the PR description.

- [ ] **Step 5: Open the PR against `master`**

PR title:

```text
feat(game-engine): PR 1a — engine foundation + NumberMatch migration
```

PR body should:

1. Link `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md`.
2. Link the design doc `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md`.
3. Quote the five Spec Deltas verbatim from this plan.
4. List the touched files (matches the File Structure section).
5. Manual smoke checklist: complete a NumberMatch session end-to-end, verify single-mount overlay, verify game-over overlay, restart works.
6. Note any `SKIP_*` flags used and why.

- [ ] **Step 6: Update PR #350 description (the design-doc PR)**

Add a one-line cross-link: "Implementation begins in #<new-PR-number> (PR 1a)."

---

## Self-Review Checklist (Before Marking This Plan Complete)

- [ ] Every Spec Delta is justified and shipping-friendly — none of them block PR 1b / 1c.
- [ ] The phase bridge `useEffect` is the only place the reducer's `phase` gets read by external code in PR 1a.
- [ ] `executeSideEffects` emits `lifecycle:speak` even though no subscriber exists — confirms the bus contract is the seam.
- [ ] `useGameEngine` returns the typed `UseGameEngineResult` shape from the design doc, with `celebrating: null` flagged as Spec Delta 2.
- [ ] `numberMatchDefinition` declares all required `tts.*` keys (`game.start`, `round.correct`, `round.error`, `game.over`, `game.prepare`).
- [ ] The MDX docs cover phase flow, API reference, and debugging — no spec section is missing a doc anchor.
- [ ] `useGameSounds` no longer returns the celebration gate booleans; sound playback still fires.
- [ ] All tests are TDD-aligned — failing test first, minimal implementation, passing test, commit.
- [ ] No file references a function or type that isn't introduced in an earlier task (forward references checked).
- [ ] The plan itself is markdownlint + Prettier clean (`yarn fix:md` was run after writing).
