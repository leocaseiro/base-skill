# Handoff: PR 1c — Reducer Removal & Cleanup kickoff

**Date:** 2026-05-13
**Status:** Ready to start
**Predecessors merged on master:**

- **PR #354** (`2026-05-13`) — PR 1a + NumberMatch implementation plan + Spec Delta on `useGameRound` + archived review/handoff.
- **PR #355** (`2026-05-11`) — PR 1a implementation: XState v5 install, GameDefinition types, `useGameEngine`, side-effects, `interaction-adapter`, NumberMatch full XState migration.
- **PR #357** (`2026-05-13`) — PR 1b implementation: WordSpell + SortNumbers full XState migrations; `useGameSounds` deleted.
- **PR #360** (`2026-05-13`) — PR 1b review fixes layered on top of #357.

All three answer-game children (NumberMatch, WordSpell, SortNumbers) are now XState-driven. The legacy `answer-game-reducer.ts` and `useAnswerGameContext` have no remaining game consumers but still exist on disk. PR 1c removes them.

## Goal

Pure code-only cleanup PR. No new features. The test suite should pass at every commit. PR 1c executes the "Reducer Removal & Cleanup" task list from the design doc on master at `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` (search for the section starting `**PR 1c — Reducer Removal & Cleanup:**`).

## Read first (full paths from project root)

1. `CLAUDE.md` — project conventions: worktree rules, markdown authoring, TDD, gating, branch protection, MCP / gstack pointers.
2. `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` — architecture authority. Search for `PR 1c` for the explicit task list (lines around 107–127). Also see the "Architecture docs to update per PR" subsection and the "New files" / "Phase 1 narrows this union" subsections for what consolidates into the canonical `types.ts`.
3. `docs/superpowers/plans/2026-05-11-spec-1a-pr1b-wordspell-sortnumbers.md` — the PR 1b plan just shipped. Useful for understanding the migration patterns immediately preceding PR 1c.
4. `docs/superpowers/plans/2026-05-11-number-match-xstate-implementation-plan.md` — the NumberMatch implementation plan. Canonical reference for the engine-driven pattern.
5. `src/components/answer-game/answer-game-reducer.ts` — the legacy reducer being deleted.
6. `src/components/answer-game/answer-game-reducer.test.ts` — the reducer test file. Removed alongside the reducer.
7. `src/components/answer-game/useAnswerGameContext.ts` and `AnswerGameProvider.tsx` — the Context provider. Either deleted entirely or shimmed; prefer deletion unless audit reveals a non-game consumer.
8. `src/components/answer-game/useAnswerGameDispatch.ts` — the dispatch hook. Same disposition as the context.
9. `src/lib/game-engine/lifecycle.ts` — `useGameLifecycle` and `createReducer` legacy module.
10. `src/lib/game-engine/index.tsx` — `GameEngineProvider` still imports `useGameLifecycle` and `createReducer` from `lifecycle.ts`. Must be migrated before `lifecycle.ts` can be deleted.
11. `src/lib/game-engine/session-recorder.ts` and tests — `SessionRecorderGate` currently reads `state.phase` from `useGameLifecycle`. PR 1c migrates it to read from `useGameEngineContext()`.
12. `src/components/answer-game/types.ts` — shared types (`AnswerZone`, `TileItem`, `AnswerGameDraftState`, `AnswerGameAction`). Audit for SpotAll consumers before deletion (M1 risk surfaced in the archived adversarial review). Split into a leaf module that survives reducer deletion if needed.
13. `src/lib/game-engine/definition-types.ts` and `types.ts` — `definition-types.ts` content folds into the canonical `types.ts` per the design doc, then `definition-types.ts` is deleted.

## Task list (from the design doc, expanded)

1. **Migrate `GameEngineProvider` off `useGameLifecycle` and `createReducer`** in `src/lib/game-engine/index.tsx`. Replace the `useGameLifecycle` call site with engine-driven equivalents. This is the prerequisite for deleting `lifecycle.ts`.
2. **Migrate `SessionRecorderGate`** in `src/lib/game-engine/session-recorder.ts` to read from `useGameEngineContext()` instead of `useGameLifecycle`'s `state.phase`. Update `src/lib/game-engine/session-recorder.test.tsx` accordingly.
3. **Delete `src/lib/game-engine/lifecycle.ts` and `lifecycle.test.ts`** once all imports are removed. If the migration in step 1 cannot complete in PR 1c, defer deletion to Phase 2 and flag the deferral explicitly in the PR description.
4. **Audit shared types in `src/components/answer-game/types.ts`** for SpotAll consumers. Run `grep -rn "AnswerZone\|TileItem\|AnswerGameDraftState\|AnswerGameAction" src/games/spot-all src/components --include="*.ts" --include="*.tsx"`. If SpotAll imports any of them, split shared types into a leaf module (e.g., `src/components/answer-game/shared-types.ts`) and update imports.
5. **Delete `src/components/answer-game/answer-game-reducer.ts` and `answer-game-reducer.test.ts`**. Confirm with `grep -rn "answer-game-reducer\|answerGameReducer\|AnswerGameAction" src/ --include="*.ts" --include="*.tsx"` that no `import` references remain.
6. **Delete or shim `useAnswerGameContext.ts`, `useAnswerGameDispatch.ts`, and `AnswerGameProvider.tsx`**. Audit consumers with `grep -rn "useAnswerGameContext\|useAnswerGameDispatch\|AnswerGameProvider" src/ --include="*.ts" --include="*.tsx"`. Delete if no consumers remain (preferred). Shim with a no-op or thin wrapper only if a non-game consumer is found and migration is out of scope.
7. **Fold `src/lib/game-engine/definition-types.ts` content into `src/lib/game-engine/types.ts`**, then delete `definition-types.ts`. Update all imports across the codebase.
8. **Optional — introduce `CelebrationHost`** to take over celebration overlay mounting (engine-mounted equivalent of what NumberMatch / WordSpell / SortNumbers currently render component-side per Spec Delta #1 of PR 1a). If this expands scope significantly, defer to a follow-up PR and document the deferral with a `TODO(PR 1c-follow-up)` or open a tracking issue.
9. **Update architecture MDX docs** per `CLAUDE.md` and the design doc's "Architecture docs to update per PR" subsection. Run `/update-architecture-docs` for guided prompts. Cross-reference cleanup across:
   - `src/lib/game-engine/GameEngine.flows.mdx`
   - `src/lib/game-engine/GameEngine.reference.mdx`
   - `src/lib/game-engine/debugging.mdx`
   - `src/components/answer-game/AnswerGame/AnswerGame.reference.mdx`

## Project conventions to honor (from CLAUDE.md)

- **Worktree first.** From the project root:

  ```bash
  cd /Users/leocaseiro/Sites/base-skill
  git worktree add ./worktrees/feat-spec-1a-pr1c-reducer-removal -b feat/spec-1a-pr1c-reducer-removal origin/master
  cd ./worktrees/feat-spec-1a-pr1c-reducer-removal
  yarn install
  ```

- **TDD for every change.** For pure-deletion work, the equivalent is "run the existing test suite, confirm all tests still pass after each deletion step." Don't batch deletions — one focused commit per logical removal, so reviewers can follow the history and bisect cleanly.
- **Baby-step commits.** Suggested grouping:
  1. `GameEngineProvider` lifecycle.ts migration (task 1)
  2. `SessionRecorderGate` migration (task 2)
  3. `lifecycle.ts` deletion (task 3) — or deferral note if step 1 cannot complete
  4. Shared types audit + leaf-module split if needed (task 4)
  5. `answer-game-reducer.ts` deletion + grep proof (task 5)
  6. Provider / context / dispatch hook deletion or shim (task 6)
  7. `definition-types.ts` fold into `types.ts` (task 7)
  8. Architecture MDX updates (task 9)
  9. Optional `CelebrationHost` (task 8) — separate commit, easy to revert

- **Markdown authoring.** Any `.md` file you author or edit must pass `yarn fix:md` before commit. Project enforces `yarn lint:md` and `npx prettier --check` in CI.
- **PR base: master.** Always. Project memory `feedback_pr_base_master.md` confirms.
- **Pre-push gating.** The smart-pipelines pre-push hook runs only the atomic checks affected by changed files. Don't `SKIP_*` unless documented in the commit message (per memory `feedback_skip_hooks_minor.md`).
- **Architecture docs in same PR.** When modifying game-state logic (any file under `src/components/answer-game/` or `src/lib/game-engine/`), update co-located `.mdx` docs in the same PR. Run `/update-architecture-docs`.

## How to start the new session

Once you're at the project root in a fresh Claude Code session:

1. Read this handoff in full (you're reading it now if you're following the prompt).
2. Read `CLAUDE.md` and the design doc's PR 1c section.
3. Produce a brief gap analysis: which files exist that the design doc names, which don't, which can be deleted cleanly without breaking master. Surface anything surprising before writing code.
4. Once the gap analysis is confirmed, propose a task breakdown using the 9-step list above as a starting point and start with task 1.
5. Create the implementation worktree as shown above and proceed task-by-task.

## After PR 1c lands

The natural follow-up is **PR 1d — SpotAll engine integration**. SpotAll's reducer (`spot-all-reducer.ts`) survives PR 1c — it's a separate adoption track that lands once XState + GameDefinition are stable across the three answer games. PR 1d is the first-time engine integration for SpotAll (not a strict migration), and **Phase 2** (reducer unification, which unblocks SRS v1) depends on PR 1d. The design doc has the PR 1d engine-boundary specifics; a separate handoff or plan should be written when PR 1c lands.

## Verdict

PR 1c is well-scoped: a fixed list of deletions + two migrations + an optional addition (`CelebrationHost`). All prerequisites are on master. The test suite covers the existing game behaviour and will catch regressions if a deletion is premature. The audit-before-delete steps (4 and 6) are the only places where deeper investigation is needed.
