# Handoff: WordSpell cumulative + Y-filter plan ready to execute

**Date:** 2026-04-29
**Branch:** feat/issue-216
**Worktree:** `~/.worktrees/base-skill/bs-4` (AO default location — keep using this one, do NOT relocate or recreate)
**Worktree path:** `/Users/leocaseiro/.worktrees/base-skill/bs-4`
**Git status:** clean (2 untracked `.claude/` artifacts — `metadata-updater.sh`, `scheduled_tasks.lock` — local tooling, ignore)
**Last commit:** `a08cf87a docs: implementation plan for cumulative tile pool + Y filter`
**PR:** #219 — open — <https://github.com/leocaseiro/base-skill/pull/219> (use this same PR, do NOT open a new one)

## Resume command

```bash
/resync
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
# Then start executing the plan:
#   docs/superpowers/plans/2026-04-29-wordspell-cumulative-y-filter.md
# Recommended: use superpowers:subagent-driven-development to dispatch
# one fresh subagent per task with review between tasks.
```

## Current state

**Task:** Add cumulative tile pool + Y phoneme filter, mode-driven default, group-click UI, and live word preview to the WordSpell picker (extends PR #219 work)
**Phase:** planning complete → ready for implementation
**Progress:** Spec + plan committed and pushed to PR #219. Code not yet touched.

## What we did

Brainstormed and shipped a new design that supersedes the previously-approved disjoint multi-level model. Confirmed the cumulative tile pool + Y phoneme filter approach via a visual companion walkthrough (3 scenarios: only `sh`, L3 review, L3+L4 mix, plus the targeted `d/g/b/v` struggle drill). Wrote the new spec and the 13-task TDD implementation plan, both committed to `feat/issue-216`. Marked the prior 2026-04-28 spec and plan as SUPERSEDED with strikethrough headers and inline pointers to the new spec.

## Decisions made

- **Cumulative `graphemesAllowed` derived from `max(level of selected unit)`** — guarantees every word in the pool is spellable from tiles the kid already has. Picking only `sh` no longer yields zero results.
- **Y filter via `phonemesRequired` (some-semantics)** — a word plays iff it contains at least one ticked phoneme. Drops "easy" pure-prior-level words (e.g. `sit, mad, red`) automatically when focused on a higher level.
- **`phonemesAllowed` dropped from the simple form's filter** — would over-constrain (would block `ship` because `/ɪ/` isn't in the selection). The two filters do different jobs.
- **Group-click level header replaces the native `<input type="checkbox">`** — clickable `<button>` with `aria-pressed='true' | 'mixed' | 'false'`. Same pattern in Simple form and Advanced modal.
- **Single rendering for Simple + Advanced** — drops the `chips`/`checkbox-tree` variant prop from PR #219.
- **Mode-driven default split** — `DEFAULT_RECALL_CONFIG` (library, no rounds) and `DEFAULT_PICTURE_CONFIG` (emoji rounds, no source). `resolveWordSpellConfig` enforces invariant. Fixes "saved=null still shows cat/dog/sun emoji words" bug.
- **Live word preview** — `WordPreviewBar` below the chip rows, mirroring SortNumbers' `bg-muted` pattern. Async via `useFilteredWords`.
- **Migration from PR #219 spec is unchanged** — `migrateWordSpellConfig`, `saved_game_configs` v3, `custom_games` v1 all keep their existing implementation. The `selectedUnits` data shape is preserved.
- **Same PR #219 + same worktree** — every commit from the plan goes onto `feat/issue-216`, no new PR.

## Spec / Plan

- **New spec** (current): `docs/superpowers/specs/2026-04-29-wordspell-cumulative-y-filter-design.md`
- **New plan** (current, ready to execute): `docs/superpowers/plans/2026-04-29-wordspell-cumulative-y-filter.md`
- **Superseded spec** (do not implement): `docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md` — has SUPERSEDED callout pointing to the new spec
- **Superseded plan** (do not execute): `docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md` — has SUPERSEDED callout

## Key files

The plan's "File structure" section maps everything; quick orientation:

- `src/games/word-spell/level-unit-selection.ts` — add `unitLevel`, `headerStateForLevel`, drop `triStateForLevel` (Phase 1 + Phase 7)
- `src/games/word-spell/resolve-simple-config.ts` — switch to cumulative `graphemesAllowed` + `phonemesRequired` (Phase 2)
- `src/games/word-spell/useFilteredWords.ts` (new) + `WordPreviewBar/WordPreviewBar.tsx` (new) — preview infra (Phase 3)
- `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx` — full UI rewrite (Phase 4)
- `src/games/config-fields-registry.tsx:62` — drop `variant="checkbox-tree"` (Phase 4)
- `src/routes/$locale/_app/game/$gameId.tsx:96-250` — split default + rewrite resolver (Phase 5)
- `src/routes/$locale/_app/game/mode-default-invariant.test.ts` (new) — invariant gate (Phase 5)
- `src/data/words/curriculum-invariant.test.ts` — extend with Y-filter invariants (Phase 6)
- `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx` — rewrite for new contract (Phase 6)

## Open questions / blockers

None. The spec, plan, and design decisions are settled.

## Next steps

1. [ ] `cd /Users/leocaseiro/.worktrees/base-skill/bs-4` and `/resync`
2. [ ] Decide execution mode — subagent-driven (recommended; one fresh subagent per task with review between) vs inline executing-plans
3. [ ] Start Phase 1 / Task 1 (`unitLevel` helper) — TDD red/green
4. [ ] Continue through 13 tasks; commit per task per CLAUDE.md baby-step rule
5. [ ] Phase 8 / Task 13 manual QA — VR baselines + dev-server smoke test (5 scenarios in spec)
6. [ ] Update PR #219 description to reference new spec/plan and the supersede markers; request human review

## Context to remember

- **Same PR #219, same branch** — every commit from the plan piles onto `feat/issue-216`. No new PR. PR description should be updated to reference the new spec/plan.
- **Same worktree** — `~/.worktrees/base-skill/bs-4` (AO default; user explicitly wants to keep using this one despite the standing preference for project-local `worktrees/<name>`)
- **Strict TDD per CLAUDE.md** — every feature/fix follows red-green-refactor. The plan's tasks are already structured this way.
- **Baby-step commits preferred** — one commit per task, multiple commits per PR is the project norm.
- **Push freely on this branch** — feature work, not a bug fix; no need to confirm pushes (per user's standing preference).
- **Project-rule worktree caveat** — even though the user's standing rule is "worktrees live at project-root/worktrees/", this branch was checked out by AO into `~/.worktrees/base-skill/bs-4` and we're staying there because the work is mid-flight. Don't `git worktree remove` or migrate.
- **The plan doc is comprehensive (≈ 2000 lines)** — full code in every step, exact commands, exact file paths. No placeholders. Self-reviewed for spec coverage, type consistency, and ambiguity.
- **The 5 manual QA scenarios in Task 13 are load-bearing** — they're the only signal that the new picker behaves correctly in a real browser.
- **Visual companion artifacts** — kept in `.superpowers/brainstorm/17029-1777410792/` (gitignored) for reference if you need to re-show the design walkthrough; server is stopped.
