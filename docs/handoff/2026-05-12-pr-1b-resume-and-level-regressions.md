# Handoff: PR 1b regressions — WordSpell resume + SortNumbers next-level

**Date:** 2026-05-12
**Branch:** feat/spec-1a-pr1b-wordspell-sortnumbers
**Worktree:** worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
**Git status:** clean (one untracked harmless file: `.cursorindexingignore`)
**Last commit:** 37b96af15 test(vr): pin ?seed= for WordSpell + Slot drag preview routes
**PR:** #357 — open (CI all green, but DO NOT MERGE — two real-user regressions found)

## Resume command

```bash
/resync
cd worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers
# Then continue from "Next steps" below
```

## Current state

**Task:** Investigate and fix two PR 1b regressions reported during manual smoke
**Phase:** debugging (Phase 1 — root cause investigation)
**Progress:** Initial code scan done; root causes NOT yet identified. Both regressions affect real users; merge is BLOCKED until both are fixed with TDD regression tests per CLAUDE.md TDD policy.

## What we did

Manual-tested the PR 1b preview build and surfaced two regressions the unit + VR
test suites do not catch. Did an initial scan of the relevant code paths to
seed the next session's investigation — code paths nominally exist for both
flows, so the bug is in the wiring or in an interaction PR 1b introduced.

## Two regressions

### Regression A — WordSpell does not resume after refresh

**Symptom (reported):** Played 2 turns in a 5-letter round of WordSpell, refreshed the page, was forced to restart the game instead of resuming with 2 tiles already placed.

**What exists on paper (initial scan):**

- Machine RESUME_ROUND event is declared and handled:
  - `src/games/word-spell/definition.ts:37` — event type declared
  - `src/games/word-spell/definition.ts:134` — `resumeRound` assign action implementation
  - `src/games/word-spell/definition.ts:546` — `RESUME_ROUND: { actions: 'resumeRound' }` transition
- AnswerGameProvider dispatches RESUME_ROUND when an `initialState` prop is present:
  - `src/components/answer-game/AnswerGameProvider.tsx:131` — `dispatch({ type: 'RESUME_ROUND', draft: initialState });`
  - Same provider mirrors that dispatch to `engineDispatch` (lines 60–114) so the XState machine also receives it
- WordSpell.tsx has a pre-existing `staleDraft` check at lines 470–495 that DISCARDS the draft when `draft.allTiles` don't match the resolved round's word. If a refresh re-samples a different word, draft is rejected → INIT_ROUND → user restarts.
- Pre-existing test that simulates this scenario: `e2e/wordspell-resume-desync.spec.ts` (the "pre-#130 drift" fixture). Worth running first to see if it still passes.

**Likely root-cause candidates (ranked):**

1. **`sampleSeed` rederivation interacting with the persisted-content path.** Commit `7f23fee48` changed `sampleSeed = nanoid()` → `${seed}-epoch-${sessionEpoch}`. On fresh load, `seed` comes from `initialLog?.seed` so sampleSeed is stable across refresh — IF the route loader is correctly threading `initialLog.seed`. Investigation: log the seed + sampleSeed values from the route loader and from WordSpell.tsx on both initial load and refresh; verify they match.
2. **WordSpell refactor may have dropped the `initialContent` persistence write.** Before PR 1b, WordSpell wrote `roundOrder + resolved rounds` into `session_history_index.initialContent` on first mount so that on resume, `persistedContent` bypasses the sampler entirely. The agent's WordSpell refactor (commit `94d24659f`) moved state reads from `useAnswerGameContext` to `engine.context` — verify the initialContent write (search WordSpell.tsx for the comment block around line 408–410 "For new sessions (no persisted content yet), write the real roundOrder + resolved rounds into session_history_index.initialContent") still happens AND still happens at the right lifecycle moment.
3. **Task 1a celebration-phase filter incorrectly suppressing playing-phase drafts.** Re-check `useAnswerGameDraftSync.ts` — the filter (`game-over` / `round-complete` / `level-complete`) should NOT match `'playing'`. If the reducer phase is ever briefly something else during gameplay (e.g., a `'loading'` between rounds), drafts may be silently dropped. Add a console log around `buildDraft` invocations during gameplay to verify.
4. **The XState-driven dispatch bridge may double-fire INIT_ROUND on mount and overwrite the RESUME_ROUND-restored state.** Check the order of mount effects in `WordSpellInstance` (the inner component keyed by `sessionEpoch`).

**Key files (full worktree paths, line-anchored):**

- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/word-spell/WordSpell/WordSpell.tsx:470-495` — `staleDraft` validation logic
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/word-spell/WordSpell/WordSpell.tsx:340-410` — `WordSpellInstance` setup including `sampleSeed`, `persisted`, `sourceConfig`
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/word-spell/definition.ts:130-150,540-550` — `resumeRound` assign + transition
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/components/answer-game/AnswerGameProvider.tsx:55-135` — `engineDispatch` bridge + RESUME_ROUND dispatch
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/lib/game-engine/useAnswerGameDraftSync.ts` — Task 1a celebration-phase filter
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/routes/$locale/_app/game/$gameId.tsx:1296-1320` — route loader builds `meta.seed` + `initialContent`
- **Reference (working):** `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/number-match/NumberMatch/NumberMatch.tsx` and `.../number-match/definition.ts:130-150,545-555` — NumberMatch resume must be tested too; if NumberMatch ALSO regresses, the bug is in shared infra (likely candidate #3 above)

**Existing test to lean on:**

- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/e2e/wordspell-resume-desync.spec.ts` — covers the "drifted draft" path. Run first; if it passes, the bug is OUTSIDE the staleDraft check.

### Regression B — SortNumbers does not advance to next level

**Symptom (reported):** After finishing a level in SortNumbers, the "Next level" button does not progress to the new level rounds.

**What exists on paper (initial scan):**

- Machine ADVANCE_LEVEL event is declared and handled:
  - `src/games/sort-numbers/definition.ts:63` — event type declared
  - `src/games/sort-numbers/definition.ts:538` — `advanceLevelState` assign action
  - `src/games/sort-numbers/definition.ts:606,613` — `roundComplete` → `levelComplete` guards
  - `src/games/sort-numbers/definition.ts:618-630` — `levelComplete` state with `ADVANCE_LEVEL` transition
- Component-side wiring exists:
  - `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:71` — `const showLevelComplete = phase === 'levelComplete';` (note: which `phase`? engine or reducer?)
  - `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:95-108` — `handleNextLevel` dispatches `{ type: 'ADVANCE_LEVEL', tiles, zones }` via the reducer
  - `src/games/sort-numbers/SortNumbers/SortNumbers.tsx:219-228` — `<LevelCompleteOverlay onNextLevel={handleNextLevel} nextLevelEnabled={showLevelComplete} />`
- `LevelCompleteOverlay` honors the gating:
  - `src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx:18` — prop declared
  - `:25` — defaults to `true`
  - `:58` — `disabled={!nextLevelEnabled}`

**Likely root-cause candidates (ranked):**

1. **`phase` at SortNumbers.tsx:71 may be reading the REDUCER phase (`'level-complete'` kebab) instead of the engine phase (`'levelComplete'` camelCase).** The compare is `phase === 'levelComplete'`, which only matches the engine. If `phase` here is `engine.phase` it works; if `phase` is from `useAnswerGameContext().phase` (reducer) it never matches → button always disabled → user can't advance. CHECK what `phase` is bound to at the top of `SortNumbers.tsx`. This is the single most likely culprit given the codebase intentionally keeps kebab/camel phases separate (Spec Delta 6).
2. **`engineDispatch` not mirroring ADVANCE_LEVEL to the engine.** Verify in AnswerGameProvider.tsx that all reducer actions (including ADVANCE_LEVEL) propagate to `engineDispatch`. If only some action types are forwarded, ADVANCE_LEVEL might be dropped → engine stays in `levelComplete` even after the dispatch.
3. **The `advanceLevelState` assign was modified during the plan-deviation discussion** (roundIndex now accumulates across levels per the SortNumbers agent's notes). Confirm it correctly resets per-level state (`zones`, `bankTileIds`, `activeSlotIndex`) on ADVANCE_LEVEL — not just `levelIndex`.
4. **The reducer's own ADVANCE_LEVEL handling.** The reducer mirror also handles ADVANCE_LEVEL (used for HUD). If the reducer's handler is missing/wrong, the reducer phase stays `'level-complete'` and `LevelCompleteOverlay` keeps rendering forever.

**Key files (full worktree paths, line-anchored):**

- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/sort-numbers/SortNumbers/SortNumbers.tsx:65-110,215-235` — phase derivation, handleNextLevel, LevelCompleteOverlay wiring
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/games/sort-numbers/definition.ts:530-635` — advanceLevelState + level transitions
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.tsx` — gating prop
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/components/answer-game/AnswerGameProvider.tsx:55-135` — engineDispatch bridge action coverage
- `/Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers/src/components/answer-game/answer-game-reducer.ts` — reducer's ADVANCE_LEVEL handler (still authoritative for HUD per Spec Delta 6)

## Decisions made

- **Do not merge PR #357 with regressions present.** Per CLAUDE.md TDD policy ("Never open a bug-fix PR without a regression test"), both fixes must land WITH new failing-test-first regression coverage before merge. The PR remains green on CI because the existing test suites do not exercise these flows.
- **Investigate, do not patch.** Both bugs are in the wiring layer between reducer ↔ engine ↔ component, where many candidates exist. Follow `superpowers:systematic-debugging` Phase 1 (root cause first); refuse the temptation to "just add a falsy fix" before reproducing locally.
- **Reproduce locally before adding logs to production code.** Run `yarn dev` (port 3000), open `/en/game/word-spell` and `/en/game/sort-numbers?...` configured for level mode in the browser, observe via React DevTools + IndexedDB inspector before sprinkling `console.log`.

## Spec / Plan

- Plan: `docs/superpowers/plans/2026-05-11-spec-1a-pr1b-wordspell-sortnumbers.md`
- Architecture context: `src/lib/game-engine/GameEngine.flows.mdx` (Spec Delta 6 explains the deliberate kebab/camel split)

## Open questions / blockers

- [ ] Does NumberMatch also regress on resume? If yes → bug is in shared infra (Task 1a filter, AnswerGameProvider bridge, or route loader). If no → bug is in WordSpell-specific code paths.
- [ ] Does SortNumbers single-level (no level mode) still work? The plan deviation about `roundIndex` accumulation only manifests in level mode. If single-level breaks too, root cause is broader.
- [ ] Is the `phase` variable at `SortNumbers.tsx:71` bound to engine.phase or reducer phase? (Single most actionable check for Regression B.)

## Next steps

1. [ ] **Reproduce both regressions locally.**
   - `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-spec-1a-pr1b-wordspell-sortnumbers && yarn dev`
   - WordSpell: open `http://localhost:3000/en/game/word-spell`, play 2 turns of a 4–5 letter round, refresh, expect resume (currently restarts).
   - SortNumbers: open `http://localhost:3000/en/game/sort-numbers`, configure level mode, finish a level, click "Next level", expect new level rounds (currently nothing happens / button disabled).
2. [ ] **Quick check (Regression B):** `grep -B5 -A2 "const showLevelComplete" src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — confirm what `phase` is bound to. If it's reducer phase, change to `engine.phase`. Single-line fix candidate; verify root cause before patching.
3. [ ] **Smoke NumberMatch resume** to bisect Regression A's blast radius (shared-infra vs WordSpell-specific).
4. [ ] **Write failing tests first** per `superpowers:test-driven-development`:
   - WordSpell: extend `e2e/wordspell-resume-desync.spec.ts` (or new file) with a fresh-session resume test (not the legacy-drift fixture).
   - SortNumbers: new test `e2e/sortnumbers-level-advance.spec.ts` OR component-level test in `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx` that asserts `ADVANCE_LEVEL` advances `levelIndex` AND yields new tiles.
5. [ ] **Apply minimal fixes per root cause.** Two separate commits (one per regression). Conventional commit prefix `fix(word-spell):` / `fix(sort-numbers):`.
6. [ ] **Re-run** `yarn test`, `yarn typecheck`, `yarn test:vr` (should stay green — VR baselines unaffected).
7. [ ] **Push and re-request review.** PR description will need a final update noting the two follow-up fixes.

## Context to remember

- **TDD is non-negotiable for these fixes** per CLAUDE.md: red → green → refactor; the bug-fix PR must include a regression test that fails before the fix and passes after.
- **Reducer phase = kebab-case, engine phase = camelCase** — Spec Delta 6 keeps these intentionally separate until PR 1c. Mixing them is a real source of bugs and the single most likely cause of Regression B.
- **engineDispatch is intentionally `as never` cast** at the bridge — TypeScript cannot catch reducer/machine event drift until PR 1c. Manual review needed when changing dispatched actions.
- **Sub-worktrees `worktrees/pr1b-wordspell-track` + `worktrees/pr1b-sortnumbers-track`** are still on disk as safety nets per the user's earlier preference. Their branches `feat/pr1b-wordspell-track` and `feat/pr1b-sortnumbers-track` may help diff against the original parallel-track work if the bug was introduced during the cherry-pick into the main branch (unlikely — cherry-pick was clean — but available).
- **CI is green** on the current HEAD `37b96af15`. The unit + VR test suites do not exercise these resume / level-advance flows end-to-end. The bug fixes will need new coverage that does.
- **PR description was just updated** to claim the VR flake is "fixed" — if these regressions push the PR into a broader scope, consider noting them in the body so reviewers know the timeline.
- **The user prefers per-commit review checkpoints.** When the fix lands, commit the failing test FIRST (separate commit), then the production fix, so the user can see the proof-of-bug independently.
