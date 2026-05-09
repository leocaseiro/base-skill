# Handoff: GameDefinition engine design review complete

**Date:** 2026-05-10
**Branch:** docs/game-definition-design
**Worktree:** worktrees/docs-game-definition-design
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/docs-game-definition-design
**Git status:** clean
**Last commit:** 711add6fe docs(game-definition): apply ce-doc-review walk-through findings (round 2)
**PR:** #350 — open

## Resume command

```
/resync
cd worktrees/docs-game-definition-design
# Write the PR 1a implementation plan:
# docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md
```

## Current state

**Task:** GameDefinition engine — design review complete, implementation plan pending
**Phase:** planning
**Progress:** Design docs reviewed and committed; PR 1a plan not yet written

## What we did

Ran a full `ce-doc-review` on both design docs (22 walk-through findings). Applied
17 fixes including: XState v5 API update throughout the design doc (`setup()`, `AnyStateMachine`,
`machine.provide()`, `xstate@5`), LOC gate made advisory, game:prepare XState-first
clarification, useLifecycleTTS coexistence note, PR 1c explicit migration tasks, and
buildRound sync contract. Pushed to PR #350.

## Decisions made

- **XState v5 (not v4)** — use `setup().createMachine()` + `AnyStateMachine`; `machine.provide()` is a v5 method, not a `useMachine` option. Pin `xstate@5` + `@xstate/react@5`.
- **game:prepare via XState** — `useLifecycleTTS` does NOT subscribe to `game:prepare` bus. XState machine's initial-state entry emits `lifecycle:speak` with `lifecycleEvent: 'game.prepare'` — same path as all other lifecycle events. Task 9 interim pattern is superseded by engine integration.
- **LOC gate = advisory** — "if missed by >2x, investigate qualitative bar" not "reconsider Phase 2".
- **buildRound is synchronous** — async callers (WordSpell resume) must resolve before starting the engine.
- **Type widening = additive** — new `InteractionMode` union members + optional fields; no breaking restructuring of existing definitions.
- **PR 1c explicit tasks** — migrate `GameEngineProvider` off `lifecycle.ts` imports as a numbered task (prerequisite for `lifecycle.ts` deletion).
- **useGameSounds gate removal** — added as an explicit task in PR 1a and PR 1b to prevent double-mount.

## Spec / Plan

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` — design doc (revised)
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — TTS lifecycle plan (revised)

## Next steps

1. [ ] Write the PR 1a implementation plan at `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md`
   - Use `/plan-eng-review` or write directly
   - PR 1a scope: `xstate@5` + `@xstate/react@5` install; `definition-types.ts`; `useGameEngine` hook; `executeSideEffects`; `GameEngineContext`/`useGameEngineContext`; NumberMatch migration; `lifecycle-tts/types.ts` contract pin; `useGameSounds` gate removal for NumberMatch
   - Reference: design doc lines 103-204 for file structure and PR breakdown
2. [ ] Open PR or update PR #350 description once plan is written
3. [ ] Implement PR 1a on a feature branch (after plan is approved)

## Context to remember

- The XState machine in each game definition uses `setup({ types }).createMachine()` — not bare `createMachine()`. TypeScript enforces context/event/guard/action/actor signatures via `setup()`.
- `useGameEngine(definition, adapter, dispatch)` — three params; `dispatch` is threaded to adapter calls, not closed over.
- `GameEngineContext` + `useGameEngineContext()` are named exports from `useGameEngine.ts`; child hooks (`useLifecycleTTS`) call `useGameEngineContext()` to read `definition.tts`.
- `InteractionAdapter<TAction>` methods receive `dispatch` as a parameter: `advanceRound(roundOutput, dispatch)`, `advanceLevel(roundOutput, dispatch)`, `completeGame(dispatch)`.
- EventTemplate shape (authoritative, from TTS plan Task 1): `{ tts: { brief: string; full: string }, byGradeBand: Record<GradeBand, Verbosity>, default: Verbosity }`.
- `useGameTTS` (raw-text speech) and `useLifecycleTTS` (lifecycle-event lookup) coexist in M1; `useGameTTS` deprecated in M2.
- SpotAll Phase 1.b: `buildRound` captures `state.rounds` via ref; dispatch `INIT_ROUNDS` before starting engine at mount.
