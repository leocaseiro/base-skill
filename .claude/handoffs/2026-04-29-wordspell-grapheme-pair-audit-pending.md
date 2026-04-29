# Handoff: WordSpell pair-contract done; GRAPHEMES_BY_LEVEL audit + Tasks 11-13 pending

**Date:** 2026-04-29
**Branch:** feat/issue-216
**Worktree:** `~/.worktrees/base-skill/bs-4` (AO default — keep using; do not relocate)
**Worktree path:** `/Users/leocaseiro/.worktrees/base-skill/bs-4`
**Git status:** clean (2 untracked `.claude/` artifacts — `metadata-updater.sh`, `scheduled_tasks.lock` — local tooling, ignore)
**Last commit:** `e2af7f7f test(word-spell): use (g,p) pairs in remaining test fixtures`
**Unpushed:** 49 commits ahead of `origin/feat/issue-216` (everything on the local branch since the prior handoff has not been pushed yet)
**PR:** #219 — open — <https://github.com/leocaseiro/base-skill/pull/219> (continue using; do NOT open a new PR)

## Resume command

```bash
/resync
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
# Then: review the audit findings below, propose a unit-test for the
# audit, fix GRAPHEMES_BY_LEVEL, finish Tasks 11/12/13, push.
```

## Current state

**Task:** Finish PR #219 — close out the cumulative tile pool + Y phoneme filter implementation.
**Phase:** implementation 90% done; one curriculum-data alignment fix and 2.5 plan tasks remain.
**Progress:** 12 of 14 tasks done (Tasks 1-10 + Task 11.5 from the plan + AdvancedConfigModal collateral fix). Task 11 paused, 12 + 13 not started, plus an emergent `GRAPHEMES_BY_LEVEL` audit fix is the gating work.

## What we did

Executed 10 of the 13 plan tasks via subagent-driven development with two-stage spec + quality reviews per task. Mid-execution, the user added a project-wide rule (Task 11.5) that `WordFilter.graphemesAllowed`/`graphemesRequired` must check both `g` AND `p` together — refactored 15 files across 5 commits to migrate from `string[]` to `(g, p)` pair arrays. The pair-contract refactor surfaced a deeper issue: `GRAPHEMES_BY_LEVEL` does not match the actual `(g, p)` pairs used in the curriculum JSON files. Audit findings captured below; the user wants `levels.ts` reconciled with the JSON before continuing.

## Decisions made

- **WordFilter contract:** `graphemesAllowed`/`graphemesRequired` are `(g, p)` pair arrays. `phonemesAllowed`/`phonemesRequired` stay as `string[]`. Saved as memory `feedback_word_filter_pair_contract.md`.
- **`GRAPHEMES_BY_LEVEL` is reconciled with the JSON data.** When a chip exists at level N, at least one level-N word should use it; when a level-N word uses a `(g, p)`, that pair must be in cumulative declared L1..N. Saved as memory `project_graphemes_by_level_invariant.md`.
- **L3's "j" chip is `(j, dʒ)` (jet/job/jug), not `(y, j)`.** User clarified this when reviewing the audit. `(y, j)` should move to L8 where `yawn`/`young` exist.
- **Same PR #219, same branch.** All commits stay on `feat/issue-216`.
- **`--no-verify` is fine for checkpoint commits when only the known `y /j/ at L3` invariant cases are red.** Documented in commit messages.
- **Filter test fixtures use `[...(GRAPHEMES_BY_LEVEL[N] ?? [])]` or `cumulativeGraphemes(N)`** — never hand-rolled grapheme strings. Already applied in commits `5867d9bb` and `e2af7f7f`.

## Spec / Plan

- **Spec (current):** `docs/superpowers/specs/2026-04-29-wordspell-cumulative-y-filter-design.md`
- **Plan (current, partly executed):** `docs/superpowers/plans/2026-04-29-wordspell-cumulative-y-filter.md`
- **Superseded specs/plans** (prior multi-level disjoint design): same dir, dated 2026-04-28, marked SUPERSEDED.

## Key files

### Modified by the pair-contract refactor (Task 11.5)

- `src/data/words/types.ts` — `WordFilter.graphemesAllowed/Required` typed as `LevelGraphemeUnit[]`
- `src/data/words/filter.ts` — `entryMatches` checks `(g, p)` pair membership via `${g}|${p}` Set keys
- `src/data/words/filter.test.ts` — fixtures use pairs
- `src/data/words/curriculum-invariant.test.ts` — pair-shape; new Y-filter invariants from Task 11
- `src/data/words/seen-words.ts`, `src/data/words/WordLibraryExplorer.tsx`, `src/games/config-chips.ts` — adapted callers
- `src/games/word-spell/resolve-simple-config.ts` — emits pairs
- `src/games/word-spell/resolve-simple-config.test.ts` — pair-shape assertions
- `src/games/word-spell/useFilteredWords.test.tsx`, `WordPreviewBar/WordPreviewBar.test.tsx`, `useLibraryRounds.test.tsx` — pair-shape fixtures
- `src/routes/$locale/_app/game/$gameId.tsx` — `DEFAULT_RECALL_CONFIG.source.filter.graphemesAllowed` uses pairs
- `src/routes/$locale/_app/game/mode-default-invariant.test.ts`, `resolveWordSpellConfig.test.ts` — pair-shape

### Pending audit fix

- `src/data/words/levels.ts:38-122` — `GRAPHEMES_BY_LEVEL` needs the changes listed under "Next steps" below.
- `src/data/words/curriculum-invariant.test.ts` — 4 tests still failing for `y /j/` at L3; should pass automatically after `levels.ts` fix.

## Open questions / blockers

- [ ] **Silent letters.** Curriculum JSON uses `(letter, '')` pairs for the silent half of doubled letters (`kiss = (k,k)+(i,ɪ)+(s,s)+(s,'')`). These are USED at L2/L4/L6/L7/L8 but never DECLARED in `GRAPHEMES_BY_LEVEL`. Two options on the table:
  - **B1 (preferred by Claude):** declare `(letter, '')` units at the level where they first appear, hide `p === ''` chips in the picker UI.
  - **B2:** add a free-pass for `(g, '')` pairs in `entryMatches` — silent letters always match regardless of `graphemesAllowed`.
  - User has not picked yet. Pick before fixing `levels.ts`.

## Next steps

1. [ ] **Add a regression test for the audit invariants.** Create `src/data/words/levels-vs-data-invariant.test.ts` that parses the JSON and asserts the two invariants (every `(g, p)` used at level N is in cumulative declared L1..N; every `(g, p)` newly declared at level N has ≥ 1 word at level N). The audit script in `/tmp/audit2.py` is the algorithm — port it to TypeScript using the same `filterWords` / direct JSON read approach as `curriculum-invariant.test.ts`.
2. [ ] **Decide silent-letter approach (B1 or B2).** Ask the user before editing `levels.ts`.
3. [ ] **Fix `GRAPHEMES_BY_LEVEL`** in `src/data/words/levels.ts`:
   - **L3:** remove `{ g: 'v', p: 'v' }` and `{ g: 'y', p: 'j' }`.
   - **L6:** add `{ g: 'v', p: 'v' }` (first L6 use: nerve/serve/swerve/verb).
   - **L7:** add `{ g: 'y', p: 'aɪ' }` (sky/cry/fly), `{ g: 'y', p: 'iː' }` (happy/baby).
   - **L8:** add `{ g: 'y', p: 'j' }` (yawn/young), `{ g: 'ou', p: 'ʌ' }` (young/cousin/double).
   - **L8:** fix `{ g: 'air', p: 'eə' }` → `{ g: 'air', p: 'ɛə' }` (unicode mismatch with JSON — the data uses `ɛə` not `eə`; verify before committing).
   - Plus silent-letter additions if B1 is chosen.
4. [ ] **Run the suite.** Expect all 4 `y /j/ at L3` invariants to pass after step 3 (the chip moves to L8 where `yawn`/`young` are reachable). New audit test should also pass.
5. [ ] **Finish Task 12 — remove deprecated `triStateForLevel`** from `src/games/word-spell/level-unit-selection.ts` + its test block. Pure cleanup.
6. [ ] **Finish Task 13 — Storybook + dev-server smoke test.** VR baselines (Docker required), 5 manual scenarios from spec Task 13. Push branch when done.
7. [ ] **Update PR #219 description** to reference the new spec/plan, the supersede markers on prior ones, and the pair-contract change. Request human review.

## Context to remember

- **PR #219 stays open.** Every commit lands on `feat/issue-216`. No new PR.
- **Worktree is at `~/.worktrees/base-skill/bs-4`** despite the project rule preferring `<project-root>/worktrees/<branch>`. We're staying because the work is mid-flight and the user explicitly approved this AO default location for this branch only.
- **Push policy on this branch:** push freely (it's feature work, not a bug fix). User's standing preference per memory.
- **Pre-commit hook runs `yarn test` unconditionally** (no `SKIP_UNIT` honoring at pre-commit phase). When the only red tests are the known `y /j/ at L3` cases, `--no-verify` with documented reason in the commit body is acceptable. After step 3 above, this is no longer needed.
- **Suite status at handoff:** 1508 passed / 4 failed (all 4 are `y /j/ at L3` — fixed by step 3).
- **Subagent caveat:** the Task 11.5 refactor was 90% completed by a subagent that hit the org's monthly limit. Last 4 test files were committed manually as `e2af7f7f`.
- **`yarn test` flips word data lazily.** Some tests need `__resetChunkCacheForTests()` in `afterEach` — already applied in the modified tests; mention if a new test file needs it.
- **Curriculum design intent (per user):** L3 introduces `(j, dʒ)` (the J consonant — jet/job/jug). The letter `y` exists at L3 but its phonemes (`/j/`, `/aɪ/`, `/iː/`) are taught at L7-L8 where the words actually live. The fix codifies this.
- **`GRAPHEMES_BY_LEVEL` and the curriculum JSON are the source-of-truth pair.** Memory `project_graphemes_by_level_invariant.md` codifies this rule for future work.
