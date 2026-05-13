# Handoff: PR 1b plan reviewed, applied, ready for ce-work execution

**Date:** 2026-05-12
**Branch:** feat/spec-1a-pr1b-wordspell-sortnumbers
**Worktree:** worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
**Git status:** clean
**Last commit:** 3d346b595 docs(plan): apply ce-doc-review findings to PR 1b plan
**PR:** none yet (Task 13 of the plan opens it)

## Resume command

```bash
/resync
cd worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
# Then either:
/ce-work docs/superpowers/plans/2026-05-11-spec-1a-pr1b-wordspell-sortnumbers.md
# Or paste this handoff path to the new session and pick a scope below.
```

## Current state

**Task:** Execute the PR 1b plan — migrate WordSpell + SortNumbers to XState-first per the canonical NumberMatch PR 1a pattern.
**Phase:** implementation (about to start — plan is settled)
**Progress:** 0 of 14 tasks complete. Baseline verified (yarn install + 33 NumberMatch tests + typecheck all green). Plan revised + committed + pushed to origin.

## What we did

Ran `/ce-doc-review` on the plan, dispatched four reviewers (coherence, feasibility, scope-guardian, adversarial), and walked through 9 findings. All 9 were accepted as Apply; 2 safe-auto fixes were also applied. The revised plan landed as commit `3d346b595` and the branch was pushed to `origin/feat/spec-1a-pr1b-wordspell-sortnumbers`. We started `/ce-work`, ran the Task 0 baseline check (green), and stopped at the execution-scope question to hand off cleanly.

## Decisions made — 11 review fixes applied to the plan

1. **Spec Delta 8 (new) — `roundAdvanceDelay` overrides silently dropped.** The XState machine hardcodes `after: 750`; both skin-token (`GameSkin.timing.roundAdvanceDelay`) and per-config (`AnswerGameConfig.timing.roundAdvanceDelay`) override paths stop working. Task 9 Step 1 audit was widened to grep both `src/lib/skin` AND all `timing:` references across `src`. Machine code gets a `// TODO(PR 1c): wire from useGameEngine options` comment. PR 1c restores the overrides. _(scope-guardian + feasibility, anchor 100 after cross-persona promotion)_
2. **Spec Delta 3 rewritten — `firstActionAt` / `selectedSlotIds` removed from PR 1b.** WordSpell and SortNumbers do **not** add the placeholder fields. PR 1b-bis introduces them alongside the real timestamp write and Set toggle. NumberMatch's PR 1a placeholders may stay or be removed at PR 1b-bis's discretion. Rationale: the definition files are net-new in PR 1b — there's no migration-cost benefit to "shape parity" without consumers, but there IS cost (TypeScript surface, four assign-action branches, three test assertions become a contract). The interfaces, context factories, initRound assign actions, advanceLevelState assign (SortNumbers), Task 2/Task 7 port instructions, and the related test assertions were all stripped. _(scope-guardian, P2)_
3. **Spec Delta 6 extended — reducer-phase consumers fully enumerated.** Beyond the original `Slot` / `LetterTileBank` / `SortNumbersTileBank` / `useTouchKeyboardInput`, the Spec Delta now lists: `ProgressHUDRoot.tsx` (reads `phase` + `roundIndex` + `levelIndex`), `HiddenKeyboardInput.tsx` (reads `phase` to gate auto-focus), `useRoundTTS.ts`, `useGameTTS.ts`, `useTileEvaluation.ts`, `useAutoNextSlot.ts`, `useSlotTileDrag.ts`, `useDraggableTile.ts`, `useFreeSwap.ts`, `useKeyboardInput.ts`, `useSlotBehavior.ts`, `AudioButton.tsx`, `NumeralTileBank.tsx`. Added explicit casing note: reducer phase strings stay kebab-case (`'round-complete'` / `'game-over'`); engine-phase strings are camelCase (`'roundComplete'` / `'gameOver'`). Anyone removing the reducer phase mirror before PR 1c will silently break HUD + hidden-keyboard auto-focus during celebration windows. _(adversarial, P1)_
4. **Task 1a (new) — celebration-phase draft filter.** A new task between Task 1 and Task 2 updates `useAnswerGameDraftSync` to skip persisting drafts during `'round-complete'` and `'level-complete'`, symmetric with the existing `'game-over'` exclusion. Prevents the XState-specific UX regression where a tab-close-then-resume during the 750 ms celebration window replays the celebration. ⚠️ **Inflight path correction:** plan says `src/components/answer-game/useAnswerGameDraftSync.ts` — the **actual file is at `src/lib/game-engine/useAnswerGameDraftSync.ts`** with a co-located test at `src/lib/game-engine/useAnswerGameDraftSync.test.ts`. The existing `buildDraft` function returns `null` when `phase === 'game-over'`; extend that condition. _(adversarial, P2)_
5. **Task 4 + Task 5 collapsed into one commit.** Original Task 4 Step 4 instructed `git commit (allowing failures in WordSpell.test.tsx)`. Now Task 4 Step 4 says "Do NOT commit yet — proceed to Task 5", and Task 5 Step 5 commits both bodies in one green commit. Honors CLAUDE.md's red-green-refactor mandate. _(scope-guardian, P1)_
6. **Task 9 Step 4a (new) — gate `LevelCompleteOverlay`'s `Next level` button.** The button accepts a new `nextLevelEnabled` prop wired to `engine.phase === 'levelComplete'`. Prevents the reducer-mirror UI race where clicking "Next level" during the 750 ms after-timer advances reducer state while the engine remains in `roundComplete`. Task 8 also gets a new machine test asserting `ADVANCE_LEVEL` from `roundComplete` is a no-op. _(adversarial, P2)_
7. **Task 10 `baseConfig` — pinned required SortNumbers fields.** Added `quantity: 3`, `skip: { mode: 'consecutive' }`, `distractors: { source: 'random', count: 0 }` to the test `baseConfig`. Without these, `yarn typecheck` fails on Task 10. _(feasibility, P1)_
8. **Task 13 Step 2 — per-image VR review checklist.** Replaced blanket `yarn test:vr:update` with an explicit per-PNG audit: list changed screenshots, Read each diff, cross-reference against U4 + NumberMatch PR 1a baselines, capture per-image rationale in the commit message. Prevents bulk-baseline-updates from masking real visual bugs that land in the same diff window as legitimate ~150ms overlay-timing shifts. _(adversarial, P1)_
9. **Task 5 + Task 10 U4 tests — coverage-scope comments added.** Both U4 single-mount regression tests get a `// U4 coverage scope:` comment explaining they verify the engine-driven overlay invariant **under physical-keyboard input only** (touch-keyboard goes through `useTouchKeyboardInput` on the hidden input element). Task 13 manual-smoke list adds a touch-input single-mount check. _(adversarial, P2)_
10. **Task 0 Step 3 (safe-auto) — fixed stale test count.** Plan claimed "29 tests in the canonical reference file"; actual is 33. _(coherence, anchor 100)_
11. **Task 11 Step 1 (safe-auto) — widened `grep` for `useGameSounds` consumers.** Now includes `--include="*.mdx" --include="*.md"` so dead references in `src/games/word-spell/WordSpell/WordSpell.flows.mdx` and `src/lib/game-engine/debugging.mdx` surface and can be cleaned. _(adversarial, anchor 100)_

## Strategy not yet chosen

`/ce-work` paused at the execution-scope question. Four scope options were on the table:

- **Task 1a only, check in** — smallest commit, validates the path correction + tests pre-existing draft-sync test infrastructure.
- **WordSpell half (Tasks 1a + 1–5)** — ~5 commits, leaves SortNumbers for a follow-up session.
- **Full plan, sequential** — ~12 commits, ~4–5 hours of agent work.
- **Parallel subagents** — WordSpell (1–5) and SortNumbers (6–10) in parallel via worktree-isolated subagents; serial tail (1a, 11, 12, 13).

The next session should pick a scope from this list before dispatching work.

## Baseline verified (next session can skip Task 0)

- `yarn install` — clean
- `yarn test --run src/games/number-match/definition.test.ts` — **33 tests pass** (matches the corrected count in the plan)
- `yarn typecheck` — clean

## Spec / Plan

- Plan: `worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/docs/superpowers/plans/2026-05-11-spec-1a-pr1b-wordspell-sortnumbers.md`
- Upstream spec: `docs/superpowers/specs/2026-04-NN-spec-1a-xstate-game-engine-design.md` (reference; PR 1a #355 shipped the NumberMatch half)

## Key files

- Reference: `src/games/number-match/definition.ts` — 33-test machine, canonical port source
- Reference: `src/games/number-match/NumberMatch/NumberMatch.tsx` (lines 99–494) — canonical component refactor shape
- Reference: `src/components/answer-game/AnswerGameProvider.tsx` (lines 56–115) — `engineDispatch` bridge
- Task 1a target: `src/lib/game-engine/useAnswerGameDraftSync.ts` + `useAnswerGameDraftSync.test.ts` — **plan path is wrong; use this path**
- Will create: `src/games/word-spell/definition.ts` + `.test.ts`
- Will create: `src/games/sort-numbers/definition.ts` + `.test.ts`
- Will create: `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx` (new component test file)
- Will modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (large refactor, lift to `WordSpellInstance` keyed by `sessionEpoch`)
- Will modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` (large refactor, same shape + `levelComplete` overlay gating)
- Will modify: `src/games/word-spell/WordSpell/WordSpell.test.tsx` (port reducer-phase assertions to DOM)
- Will delete: `src/components/answer-game/useGameSounds.ts` + `useGameSounds.test.tsx`
- Will append: `src/lib/game-engine/GameEngine.flows.mdx`, `src/lib/game-engine/GameEngine.reference.mdx`
- Will replace: `src/games/word-spell/WordSpell/WordSpell.flows.mdx` (XState diagram)
- Will create: `src/games/sort-numbers/SortNumbers/SortNumbers.flows.mdx`

## Open questions / blockers

- [ ] Pick the ce-work execution scope (4 options above).
- [ ] **Verify before deleting `useGameSounds` (Task 11):** also check `src/lib/game-engine/debugging.mdx` and `src/games/word-spell/WordSpell/WordSpell.flows.mdx` — these have stale references that Task 12 should clean up. The plan's grep was widened to catch them but the cleanup itself is not enumerated explicitly.

## Next steps

1. [ ] Pick execution scope.
2. [ ] If Task 1a is in scope: open `src/lib/game-engine/useAnswerGameDraftSync.ts`, extend `buildDraft`'s null-return condition from `phase === 'game-over'` to `phase === 'game-over' || phase === 'round-complete' || phase === 'level-complete'`. Add tests at `useAnswerGameDraftSync.test.ts` that assert no `incrementalPatch` write fires when state.phase is `'round-complete'` or `'level-complete'`. Commit as `fix(answer-game): exclude celebration phases from draft persistence` (per Task 1a Step 4 message in the plan).
3. [ ] Follow the plan task-by-task. Each task has clear `git commit` instructions; honor TDD discipline (red→green→commit). Use NumberMatch's `definition.ts` (1:1 port source for Tasks 2 and 7), `NumberMatch.tsx` (lines 99–494 for component refactor shape), and the `engineDispatch` bridge at `AnswerGameProvider.tsx` lines 56–115.

## Context to remember

- **Worktree convention:** all work happens under `worktrees/<branch>/`, never inside `.claude/worktrees/` (permission-prompt trap). Always print full paths including `worktrees/<branch>/...`.
- **Commit cadence:** Leo treats commits as review checkpoints — commit each time the next reader should verify. Baby-step commits encouraged; multi-commit PRs preferred.
- **Skip-hook policy:** SKIP_LINT / SKIP_UNIT etc. acceptable on minor checkpoint commits, but PR 1b is substantive — let pre-commit hooks run.
- **PR base:** always `master`. Branch protection requires Lint / Type Check / Unit Tests / Storybook Tests / Build / E2E — chromium.
- **VR tests:** require Docker. If Docker isn't running locally, the VR check is skipped with a warning. Task 13 Step 2 (revised) demands per-image review if VR diffs appear — never blanket `yarn test:vr:update`.
- **TDD is non-negotiable for new behavior** — write failing test, watch it fail, implement, watch it pass, commit.
- **No-default-export rule:** project uses named exports only; `export default` only allowed in framework config files.
- **Storybook story `title:` uses PascalCase segments** (e.g., `'Games/SortNumbers/ConfigForm'`), never kebab-case mirroring of filesystem.
- **gstack `/browse`** for any web browsing — never `mcp__claude-in-chrome__*`.
- **engineDispatch type cast** uses `action as never` per the AnswerGameProvider bridge — TypeScript can't catch reducer/machine event drift until PR 1c removes the reducer (Residual concern from the review).
- **selectedSlotIds in NumberMatch** is currently `new Set<string>()` reset on every `ADVANCE_ROUND`. Reference-identity churn will become real in PR 1b-bis; consider an `EMPTY_SET` sentinel when that work lands (FYI observation from the review).
- **Cross-game reuse direction:** long-term goal is for any game to consume any data + distractor source via `useGameRound`. PR 1b-bis introduces that hook. Don't speculatively abstract in PR 1b.
- **`/resync`** brings the branch up to date with origin/master and surfaces open PRs.
