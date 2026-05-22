# Handoff: PR #350 — NumberMatch XState implementation plan complete

**Date:** 2026-05-11
**Branch:** `plan/pr1a-tasks-8-9-rewrite` (off `docs/game-definition-design`)
**Worktree:** `worktrees/plan-pr1a-tasks-8-9-rewrite`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/plan-pr1a-tasks-8-9-rewrite`
**Target PR:** #350 — absorb the changes from this branch into the PR by merging or force-pushing to `docs/game-definition-design`.

## What this session produced

A standalone, implementation-ready plan for the NumberMatch slice of PR 1a — extracted from the previous Tasks 8 + 9 (which the archived adversarial + feasibility review found unshippable). The engine-foundation work in the existing PR 1a plan (Tasks 0–7 + 10–12) is unchanged. A Spec Delta on the merged `useGameRound` spec resolves the seam between the hook and XState-first games.

The doc surface is intentionally smaller after this session: the review and handoff that scoped the replan are archived, and the new NumberMatch plan stands as a self-contained reference.

## Files changed in this branch

- **New:** `docs/superpowers/plans/2026-05-11-number-match-xstate-implementation-plan.md` — full NumberMatch slice (definition, machine-level tests, component refactor).
- **Edited:** `docs/superpowers/specs/2026-05-03-use-game-round-design.md` — appended Spec Delta (2026-05-11) for the optional `engine?: UseGameEngineResult` parameter.
- **Edited:** `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md` — Tasks 8 + 9 replaced by pointer to the new plan; Tasks 0–7 + 10–12 unchanged.
- **Moved:** `docs/superpowers/reviews/2026-05-10-pr1a-tasks-8-9-adversarial-feasibility.md` → `docs/superpowers/reviews/archive/...` (findings folded into the new plan).
- **Moved:** `.claude/handoffs/2026-05-10-pr350-tasks-8-9-replan.md` → `.claude/handoffs/archive/...` (session scoping for this work).
- **New:** `.claude/handoffs/2026-05-11-pr350-numbermatch-plan-handoff.md` — this file.

## Doc inventory going forward

**Active references (4 docs):**

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` — architecture authority (Phase authority, useGameRound composition)
- `docs/superpowers/specs/2026-05-03-use-game-round-design.md` — merged useGameRound spec + 2026-05-11 Spec Delta appended
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md` — engine foundation plan (Tasks 0–7 + 10–12)
- `docs/superpowers/plans/2026-05-11-number-match-xstate-implementation-plan.md` — NumberMatch slice (Tasks U1–U4)

**Historical (archived, accessible if needed):**

- `docs/superpowers/reviews/archive/2026-05-10-pr1a-tasks-8-9-adversarial-feasibility.md`
- `.claude/handoffs/archive/2026-05-10-pr350-tasks-8-9-replan.md`

## Key decisions captured this session

These resolve the C1–C4 critical findings + H1–H6 high-severity findings from the archived review. Each is documented in the new NumberMatch plan at the cited section.

- **`gameOver` state shape (C2):** regular state. Entry actions fire `playSound`, `speak`, `completeGame`. No `gameOverActor`. `CELEBRATION_DONE` handler not needed (no auto-transition out). Root-level `GAME_OVER` handler stays as defense-in-depth. Component does not send redundant `GAME_OVER`. _Documented in plan §Key Technical Decisions and §State machine (Mermaid diagram)._
- **Audio strategy (H6):** option (d) — `playSound` is a parameterised XState entry action implemented in `useGameEngine.provide({ actions })`. NumberMatch.tsx drops `useGameSounds()`. WordSpell + SortNumbers keep the hook until PR 1b. _Documented in plan §Key Technical Decisions and §U3 Approach._
- **Assign-action correctness strategy (C3):** option B — inline full assign bodies in `definition.ts` AND machine-level behavior tests in `definition.test.ts` (ported from `answer-game-reducer.test.ts`). Test scenarios gate the implementation step. _Documented in plan §U2 Test scenarios._
- **`useGameRound` × XState seam (C4):** Shape A — optional `engine?: UseGameEngineResult` parameter. Hook reads `roundIndex`/`levelIndex`/`phase` from `engine.context`. Hook still emits `round:resolved`. Backward compatible (SpotAll unaffected). _Documented in the Spec Delta inside `2026-05-03-use-game-round-design.md`._
- **Plan file location:** new standalone plan (Y). Existing PR 1a plan keeps Tasks 0–7 + 10–12 with a pointer at Tasks 8 + 9. _Documented in the plan and this handoff._
- **`wrongTileBehavior` / `totalRounds` / `maxLevels`:** added to `NumberMatchEngineContext`, populated via `setup({ types: { input } })` and `useMachine(machine, { input: { ... } })`. _Documented in plan §High-Level Technical Design (context shape)._
- **Correctness detection (H1):** `playing.always: [{ guard: 'allFilledCorrectly', target: 'roundComplete' }]` — eventless transition fires when an `assign` mutates context. No `useEffect`. _Documented in plan §High-Level Technical Design and §U1 Approach._
- **Round-advance timing (R2):** `roundComplete.after: { 750: [{ target: 'gameOver', guard: 'isLastRound' }, { target: 'waitingForNext' }] }`. No component `setTimeout`. _Documented in plan §High-Level Technical Design (Mermaid + Event flow)._
- **Drag-event scoping (H3):** moved to `playing` only. Drag during celebration / gameOver does not mutate context. _Documented in plan §U1 Approach and R9._
- **Actor placeholder typing (H4):** none needed (actors dropped entirely). Where placeholders are kept (guards, actions), they use typed signatures matching the real implementations. _Documented in plan §U1 Approach and R10._
- **`firstActionAt` / `selectedSlotIds` (H5):** added as no-op placeholders to context; `SELECT_SLOT` no-op event in the union. PR 1b populates behavior alongside `useGameRound` adoption. _Documented in plan R11 and §U1 Approach._

## What this session did NOT decide

The user's directive (captured in feedback below) was: optimise NumberMatch for ideal patterns; don't worry about PR size or duplication; willing to ditch and rewrite from scratch if the new plan doesn't read clearly enough. The session produced the plan accordingly. **The user has not yet read the final plan as written** — review feedback may surface revisions.

Open follow-ups for the next session:

1. The user reads `docs/superpowers/plans/2026-05-11-number-match-xstate-implementation-plan.md` end-to-end and decides whether it meets the "standalone-readable" bar. If yes: proceed to implementation (PR #350 absorbs the plan, executor follows the engine-foundation plan + this plan in sequence). If no: revise.
2. Implementation of the plan (separate session via `/ce-work` or similar): a new worktree off `master` (e.g., `worktrees/feat-numbermatch-xstate`), follows Tasks 0–7 of the engine-foundation plan, then U1–U4 of the NumberMatch plan, then Tasks 10–12 of the engine-foundation plan.
3. The Spec Delta on `useGameRound` is a contract change that PR 1b will consume — no implementation in PR 1a beyond ensuring NumberMatch's machine context exposes the fields the hook will read.

## How the next session resumes

```text
1. Open a fresh Claude Code session at the project root:
   cd /Users/leocaseiro/Sites/base-skill

2. Read this handoff:
   .claude/handoffs/2026-05-11-pr350-numbermatch-plan-handoff.md

3. Read the new NumberMatch plan:
   docs/superpowers/plans/2026-05-11-number-match-xstate-implementation-plan.md

4. Read the Spec Delta (appended to the merged useGameRound spec):
   docs/superpowers/specs/2026-05-03-use-game-round-design.md (search "Spec Delta — XState engine handle (2026-05-11)")

5. Read the existing engine-foundation plan for Tasks 0–7 + 10–12 context:
   docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md

That is the full active doc surface. The two archived files preserve history but are not required reading.
```

## User feedback captured this session

Worth preserving as memory for future sessions:

- **Doc complexity threshold:** the user gets frustrated with multi-doc tangles. Prefer fewer, focused, standalone-readable docs. Archive things that have done their job. Mention in early framing what docs are in motion vs stable.
- **Ideal-pattern directive for greenfield slices:** when a slice is treated as a complete rewrite (NumberMatch under XState-first), optimise for read/maintain + canonical framework patterns. PR size, duplicated code, even rewriting a whole component instead of migrating are acceptable. Don't accumulate tech debt to make migration easier.
- **Prose dialogue over menus when walking through questions one by one:** AskUserQuestion menus felt heavyweight when the user wanted a conversational walk-through with context per question. Prose questions are preferred in those flows.
- **Doc pointers — full paths:** when discussing findings, name the doc, the line range, and the worktree path. The user couldn't find C2 because the doc map wasn't laid out explicitly upfront.

## Verdict

PR #350 is ready to absorb this branch. The plan stands as written; implementation begins in a fresh session per the "How the next session resumes" steps above. If the user reads the new plan and wants revisions, those land here in `plan/pr1a-tasks-8-9-rewrite` before merging.

## Build status when this handoff was written

- `yarn fix:md` run on all touched markdown files: see commit history.
- Confidence check + doc review: ran inside ce-plan workflow before this handoff.
- No source code touched in this branch — markdown only.
- Pre-push hooks: not yet run (will execute on the eventual push to remote).
