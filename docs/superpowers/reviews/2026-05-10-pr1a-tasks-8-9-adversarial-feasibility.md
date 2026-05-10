# PR 1a Tasks 8 + 9 — Adversarial + Feasibility Review

**Date:** 2026-05-10
**Reviewed commit:** `5884a66dd` (after rebase + useGameRound composition sections added)
**Branch:** `docs/game-definition-design`
**PR:** #350
**Reviewers:** `compound-engineering:ce-adversarial-document-reviewer` + `compound-engineering:ce-feasibility-reviewer` (run in parallel as fallback for unavailable Codex CLI)

**Verdict:** **FAIL** — Tasks 8 + 9 are not implementation-ready as written.
Both reviewers independently surfaced four overlapping critical/blocker
findings plus six high-severity findings.

This document is the input to a follow-up `ce-plan` session that will
re-prescribe Tasks 8 + 9 from scratch with the findings folded in.

---

## Critical / blocker findings (cross-corroborated)

### C1 — Round-advance is structurally broken

**Severity:** Critical
**Sources:** Adversarial F1, Feasibility #10
**Locations:**

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1476-1479` (Task 8 guard placeholders)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1684-1696` (`waitingForNext.NEXT` actions)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1984-2013` (Task 9 dispatch sequence)
- `src/lib/game-engine/useGameEngine.ts:1155-1167` (`buildRound`/`advanceRound` actions)
- `src/lib/game-engine/interaction-adapter.ts:1268` (throws on missing tiles/zones)

**What breaks:**

1. `setup({ guards: { isMidLevelRound: () => false, isLastRoundOfLevel: () => false, isLastRound: () => false } })` declares all guards as no-op placeholders. The plan claims `useGameEngine` injects real guards via `provide()` at runtime, but Task 7 doesn't show this wiring with bodies that read context. Both `NEXT` transitions in `waitingForNext` are guarded — if both guards return `false`, `NEXT` is silently dropped. Round 2 never starts.

2. Even if guards work, `waitingForNext.NEXT` calls `['incrementRoundIndex', 'buildRound', 'advanceRound']`. `buildRound` is a no-op (Spec Delta #6) that doesn't `assign` to `lastRoundOutput`. `advanceRound` reads `context.lastRoundOutput`, which is never populated. The adapter's runtime guard throws "missing { tiles, zones }". Round advancement fails at runtime on every round.

**Why it matters:** Executor ships PR 1a → user completes round 1 → celebration overlay closes → screen stuck on round 1's answered board with no next round. Manual smoke test catches this; CI tests likely don't.

**Resolution direction:**

- Either inject real guard bodies (`({ context }) => context.roundIndex < context.totalRounds - 1` etc.) in Task 7 with explicit prescription, AND document the assign-back of `lastRoundOutput` somewhere in the dispatch chain, OR
- Drop `'buildRound'`/`'advanceRound'` from the `waitingForNext.NEXT` actions array entirely for NumberMatch (component drives `ADVANCE_ROUND` directly with computed tiles/zones — Spec Delta #6's premise), keep only `'incrementRoundIndex'`.

---

### C2 — `gameOver` broken three ways

**Severity:** Critical
**Sources:** Adversarial F2, Feasibility #5 + #11
**Locations:**

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1704-1718` (Task 8 `gameOver` state)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1980-1987` (Task 9 last-round branch)
- `src/lib/game-engine/useGameEngine.ts:1044-1054` (`gameOverActor` 60s timer)

**What breaks:**

1. `gameOver` is `type: 'final'` and `invoke`s `gameOverActor` (60s `fromPromise` timer). `onDone` fires `speak game.over` and `completeGame` only after the actor resolves. User sees game-over screen, but the engine's `completeGame` action runs 60 seconds later. `answerGameAdapter.completeGame` dispatches `COMPLETE_GAME` to the reducer — but NumberMatch isn't using the reducer.
2. `gameOver` has no `CELEBRATION_DONE` handler, so user dismissing via "Play Again" / "Go Home" doesn't short-circuit the timer.
3. Component sends a redundant `engine.send({ type: 'GAME_OVER' })` after `NEXT` already routes to `gameOver` via the `isLastRound` guard. If guards work, this is dead code; if guards don't work (per C1), `GAME_OVER` is the only path that drives `gameOver` at all — the plan picks both modes simultaneously.

**Resolution direction:**

- Decide: explicit `engine.send({ type: 'GAME_OVER' })` from component, OR guard-driven `NEXT → gameOver`. Don't ship both.
- Add `on: { CELEBRATION_DONE: { actions: ['completeGame'] } }` to `gameOver` (or split into `gameOver` → `complete` final), so dismiss short-circuits.
- Decide whether `gameOver` should be `type: 'final'` or a regular state. Final blocks transitions (re-entry undefined) which conflicts with re-entry from `RESUME_ROUND`.

---

### C3 — 22 stub assign actions block implementation

**Severity:** Critical / Blocker
**Sources:** Adversarial F4, Feasibility #4
**Locations:**

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1517-1566` (Task 8 stub assigns)
- `src/components/answer-game/answer-game-reducer.ts` (the reducer being mirrored)

**What breaks:**

The bodies for `placeTile`, `typeTile`, `removeTile`, `swapTiles`, `ejectTile`, `swapSlotBank`, `rejectTap` are `// Mirror reducer 'X' case` followed by `return context;` (XState v5 `assign(() => context)` is a no-op). An executor following the plan ships Task 8 with no-op assigns and a green test suite — Step 4 only checks state-name presence, not assign behavior.

Three concrete subtle bugs even if the executor _does_ port line-for-line:

1. **`placeTile` retry counting + `dragActiveTileId` clearing** — reducer's wrong-placement branch reads `state.dragActiveTileId === action.tileId` to clear drag (lines 121–124). A naive `assign({ retryCount: ({ context }) => context.retryCount + 1 })` forgets the conditional drag-clear → drag state leaks across placements, ghost-dragged tiles.
2. **`swapTiles` `allFilledCorrectly` side effect** — reducer computes `allFilledCorrectly` and sets `phase` (lines 393–404). Under XState-first, "set phase" must be a state transition, not an assign. An executor mirroring line-for-line writes `assign({ phase: 'roundComplete' })` — but the machine doesn't have a `phase` field in context (Task 8 line 1398 omits it). Either silent no-op or phantom `phase: string` drifting from state-node name.
3. **`ejectTile` early-return guard** — reducer line 412: `if (!zone.isWrong && !zone.isLocked) return state;`. In XState an assign returning `{}` doesn't block the transition. Need to express as a `guard` on the transition: `EJECT_TILE: { guard: 'canEject', actions: 'ejectTile' }`.

**Why it matters:** Plan Step 4 ("Run tests to verify") only checks state names. None of the 22 reducer cases get machine-level test coverage in PR 1a.

**Resolution direction:**

- Inline the full assign bodies in Task 8 (verbose but explicit), OR
- Add a Task 8.5 that ports `answer-game-reducer.test.ts` cases relevant to NumberMatch into `definition.test.ts` machine-level tests **before** Step 4 declares pass.

---

### C4 — `useGameRound` × XState seam asserted, not designed

**Severity:** Critical (advisory for PR 1a, blocker for PR 1b)
**Sources:** Adversarial F7, Feasibility #6
**Locations:**

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md:361-381` (composition section)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:63-75` (composition note)
- `docs/superpowers/specs/2026-05-03-use-game-round-design.md:85-127` (merged spec)

**What breaks:**

The merged `useGameRound` spec exposes `markResolved(outcome)` as the only public mutation API. Hook owns `roundIndex` and `phase` (spec line 124). Internal logic dispatches `ADVANCE_ROUND` / `COMPLETE_GAME` to a hardcoded reducer (line 127).

The composition section claims for migrated games:

- Hook's callbacks "call `engine.send({ type: 'NEXT' })`" — but the hook signature has no dispatch parameter, no engine handle, and the merged spec couples to a reducer.
- "Hook reads from the machine, not the other way round" — but the hook owns `roundIndex` and `phase` per the spec.
- "No dual source of truth" — but `phase` is kebab-case in the spec (`'round-complete'`) and camelCase in the machine (`'roundComplete'`).

The "leave room (no exhaustive `as const` union locks)" instruction in PR 1a's note is unenforceable. PR 1b will hit a wall when integrating.

**Trace one round:** User completes → `markResolved('correct')` → ???

- If hook still owns timing → 750ms wait → dispatches `ADVANCE_ROUND` to a non-existent reducer. Drops on floor.
- If hook routes to `engine.send` → who emits `round:resolved`? Hook (per spec line 113)? Machine assign action (per design line 378)? Both → duplicate event.

**Resolution direction:**

Add a "useGameRound × XState adapter" subsection to the design doc prescribing:

- A `dispatchTarget: 'reducer' | 'engine'` parameter (or equivalent injection)
- Explicit kebab→camel phase translation
- Which side (hook vs machine) emits `round:resolved`
- What `currentRound` returns when `engine.context.lastRoundOutput` is `{}` (PR 1a state)

This is a **Spec Delta on the merged useGameRound spec** — not just a PR 1b plan addition. The new ce-plan should explicitly write this delta as part of its output, even though `useGameRound` isn't imported in PR 1a.

---

## High-severity findings (must fix before merge)

### H1 — `useEffect` ROUND_CORRECT detection race

**Severity:** High
**Source:** Adversarial F3
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1942-1958`

`useEffect` deps `[zones, allTiles, engine]` infer correctness post-render. Reducer used to dispatch ROUND_CORRECT atomically inside `PLACE_TILE`. Information regression: cannot distinguish "user just made it correct" from "was already correct." One-frame flicker between `engine.phase === 'playing'` (effect hasn't run) and `engine.phase === 'roundComplete'` (after dispatch). User input during the 750ms transition window can be lost (e.g., `EJECT_TILE` from a wrong-locked zone arrives in `roundComplete` where it's not handled).

**Resolution:** Move correctness detection into the `placeTile`/`typeTile`/`swapTiles` assign actions themselves — compute `allFilledCorrectly` inside the assign and use XState `raise` / `always` transitions to fire ROUND_CORRECT. Delete the useEffect.

---

### H2 — Machine context drops `config` access

**Severity:** High
**Source:** Adversarial F5
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1395-1422`

Task 8's context comment says "config stays out of machine context." But guards (`isLastRound`, `isMidLevelRound`, `isLastRoundOfLevel`) need `totalRounds`, `levelIndex`, and `maxLevels` in **context** to compute — they only see `context` and `event`, not `useGameEngine` options. Plan lines 1882–1884 pass `{ totalRounds, levelSize }` to `useGameEngine` but Task 7 doesn't show how these reach machine context.

**Resolution:** Add `totalRounds: number` (and `maxLevels: number | null` for level-aware games) to `NumberMatchEngineContext`. Prescribe Task 7 (or Task 8 itself) populating them via `input` to `setup()` or initial-context override in `useGameEngine`.

---

### H3 — Root-level drag handlers race celebration overlay

**Severity:** High
**Source:** Adversarial F6
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1626-1633`

`SET_DRAG_ACTIVE`, `SET_DRAG_HOVER`, `SET_DRAG_HOVER_BANK` at machine root → fire in `roundComplete` and `gameOver` too. Celebration overlay is a sibling render, not a portal — dnd-kit pointer events bubble through. Drag during celebration mutates `dragActiveTileId` → bank tile re-renders with a "hole" behind transparent overlay. After `gameOver` (final), drag context mutates indefinitely.

**Resolution:** Move drag handlers into `playing` only. Keep `INIT_ROUND`/`RESUME_ROUND` at root (idempotent re-init).

---

### H4 — `setup({ actors: undefined as never })` typecheck landmine

**Severity:** High
**Source:** Feasibility #2
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1480-1483`

XState v5's `setup()` overload requires concrete `ActorLogic` for input/output type inference. `never` produces `unknown` input and breaks `onDone` payload typing for `roundComplete.invoke.src: 'celebrationActor'` (line 1672) and `gameOver.invoke.src: 'gameOverActor'` (line 1707).

**Resolution:** Declare actors with the `fromPromise(() => Promise.resolve())` placeholders used in `useGameEngine.ts:1022-1054`, or import them from a shared placeholder module. `provide()` overrides at runtime.

---

### H5 — `firstActionAt` / `selectedSlotIds` retrofit forces Task 8 re-prescription

**Severity:** High
**Source:** Adversarial F8
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:71-72`

The "leave room (no exhaustive `as const` union locks)" instruction is unenforceable. When PR 1b lands `useGameRound` for NumberMatch, all assign actions need `firstActionAt: context.firstActionAt` preserved (otherwise spread loses it). XState v5 prefers immutable context; `Set` mutation needs `new Set(context.selectedSlotIds).add(id)` pattern. PR 1b reviewer sees a "small change" diff that re-touches every assign.

**Resolution:** Add the two fields and the `SELECT_SLOT` event to PR 1a's Task 8 as no-op placeholders (`firstActionAt: null`, `selectedSlotIds: new Set()`, `SELECT_SLOT` event with empty assign), so PR 1b only fills in behavior, not structure.

---

### H6 — Silent audio regression: `useGameSounds` reads dead phase

**Severity:** High
**Source:** Adversarial F9
**Locations:**

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:73` ("existing useRoundLifecycle/useRoundComplete remain")
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1821, 2096` (useGameSounds gate-removal deferred to PR 1b)

NumberMatch under XState-first doesn't dispatch to the reducer. `useAnswerGameContext().phase` stays `'playing'` forever. `useGameSounds` reads phase from `useAnswerGameContext()` (kept until PR 1b per Spec Delta #1) — sound effects on round-complete never play in PR 1a.

**Resolution direction:**

- (a) Bridge `engine.phase` back to `useAnswerGameContext` for sound only (defeats no-bridge claim), OR
- (b) Port sound playback to listen on engine state directly in PR 1a (more scope), OR
- (c) Explicitly accept and document the audio regression as a Spec Delta and add a TODO for PR 1b.

---

## Medium-severity findings (track + decide later)

### M1 — Reducer deletion safety vs SpotAll/SortNumbers shared types

**Severity:** Medium
**Source:** Adversarial F10, Feasibility #7

`useAnswerGameContext` shim removal in PR 1c may break SpotAll if it imports `AnswerGameAction`/`AnswerZone`/`TileItem` from `src/components/answer-game/types.ts` — those types are tightly coupled to the reducer action union. `interaction-adapter.ts:1245-1249` already imports them.

**Resolution:** Before PR 1c, audit `src/components/answer-game/types.ts` and `useAnswerGameContext.ts` for SpotAll consumers; split shared types into a leaf module that survives reducer deletion.

---

### M2 — `buildRound` no-op convention copy-paste risk

**Severity:** Medium
**Source:** Adversarial F11

PR 1b executor migrating WordSpell sees `buildRound: (ctx) => ({ roundIndex: ctx.roundIndex })` in NumberMatch and copies. Spec Delta #6 explains _why_ it's a no-op but the inline comment doesn't. If PR 1b's `useGameEngine` removes the injection (round construction lifts into definition per design), the executor leaves the passthrough → `engine.currentRound` returns `{}` for WordSpell.

**Resolution:** Add explicit TODO comment in Task 8's `buildRound`: `// TODO(PR 1b): replace with real round factory; currently passthrough — engine wiring no-ops this. See Spec Delta #6.`

---

### M3 — `RESUME_ROUND` ignored from session draft

**Severity:** Medium
**Source:** Adversarial F12

Reducer's `RESUME_ROUND` restores `phase` from the draft (`AnswerGameDraftState.phase` can be `'round-complete'`). Machine's `resumeRound` assign restores all fields except phase (correct — phase is a state node), but the root-level handler has no `target`, so the machine stays in initial `playing` state regardless of draft phase. User who quit during round-complete returns to a fully-correct board in `playing` → H1's effect immediately re-fires ROUND_CORRECT → celebration plays again. Acceptable UX (re-celebrate)? Possibly. Undocumented.

**Resolution:** Add target transitions on `RESUME_ROUND` based on draft phase, or document explicitly that resume always re-enters `playing` and re-fires completion detection.

---

### M4 — `renderHook(() => …).toThrow()` unreliable in React 19 / RTL 16

**Severity:** Medium
**Source:** Feasibility #3
**Location:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:955-959` (Task 6 Step 1)

RTL ≥ 13 stopped re-throwing inside `renderHook`. Tests must read `result.current` (which re-throws) or use an `ErrorBoundary` wrapper.

**Resolution:** Change assertion to read `result.current` after wrapped `renderHook`, OR wrap with `ErrorBoundary` and assert on captured error. Silence React error log via `vi.spyOn(console, 'error').mockImplementation(() => {})`.

---

### M5 — Tasks 4 + 7 missing test steps

**Severity:** Medium
**Source:** Feasibility #8
**Locations:**

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:470-633` (Task 4)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1233-1313` (Task 7)

Task 4 is type-only (acceptable test-light). Task 7's `interaction-adapter.ts` runtime guard `isAnswerGameRoundOutput` (1260-1264) and throw paths (1268, 1280) have no acceptance criteria — executor could ship a regression where the guard always returns `false` and tests pass.

**Resolution:** Add `src/lib/game-engine/interaction-adapter.test.ts` to Task 7 with happy/empty/nil cases. Task 4 can add `// @ts-expect-error` test (per existing `lifecycle-tts/types.test-d.ts` precedent at line 125) to confirm `GameDefinition` shape rejects misuse.

---

## Cross-model agreement

Both reviewers found C1, C2, C3, C4 independently — **100% agreement on critical findings**. Adversarial caught the round-advance/dispatch/dual-source-of-truth angle harder; feasibility caught the typecheck/test-pattern/peer-dep angle harder. They complement, not duplicate. This raises confidence that the failing verdict is real — not a single reviewer's idiosyncratic concern.

---

## Suppressed (non-findings)

- **XState v5 + React 19 peer-dep** — verified. `@xstate/react@5.0.3+` peers `^19.0.0`; `package.json:65` pins `react@^19.2.0`. Install OK.
- **Task 11 MDX append safety** — verified. `src/lib/game-engine/GameEngine.flows.mdx` exists; `## Legacy engine` vs `## XState engine` headings coexist cleanly.

---

## Input for next ce-plan session

The follow-up `ce-plan` session should re-prescribe **Tasks 8 + 9 of the PR 1a plan** with these inputs:

1. **This review document** as the primary failure-scenario input.
2. **`docs/superpowers/plans/2026-05-07-game-definition-engine-design.md`** as the binding source of truth for the architecture (XState-first end state, useGameRound composition).
3. **`docs/superpowers/specs/2026-05-03-use-game-round-design.md`** (merged spec) — to negotiate the `useGameRound × XState` adapter delta.
4. **`src/components/answer-game/answer-game-reducer.ts`** — the source of truth for the assign-action bodies. Plan should either inline the full bodies or prescribe machine-level test cases that force them.
5. **`src/lib/game-engine/useGameEngine.ts`** — current engine hook with placeholder actor logic and guard wiring.
6. **`src/lib/game-engine/interaction-adapter.ts`** — current adapter contract (and its runtime guard that's currently broken in C1).

**Recommended scope for the new plan:**

- Tasks 8 + 9 fully re-prescribed with no `// Mirror reducer` stubs (C3).
- Real guard bodies prescribed in Task 7 or Task 8 (C1).
- `gameOver` state shape redesigned (C2) — explicit decision on final vs non-final, dismiss handler, timer scope.
- New "useGameRound × XState adapter" subsection (C4) — likely a small Spec Delta on the merged spec.
- All H1–H6 fixes folded in.
- M1–M5 as Open Questions for the new plan to acknowledge but not necessarily resolve.

**Out of scope for the new plan:**

- Re-litigating the XState-first architectural commitment (that's settled — see `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md:333` Phase authority section).
- Rewriting Tasks 1–7, 10–12 (only Tasks 8 + 9 + necessary Task 7 guard prescription need rework).
- The PR 1b/1c/1d plans (those don't exist yet; out of scope until Tasks 8 + 9 land).
