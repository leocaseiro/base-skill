# Handoff: WordSpell levels-and-defaults plan ready for subagent-driven execution

**Date:** 2026-04-28
**Branch:** feat/wordspell-levels-defaults
**Worktree:** worktrees/feat-wordspell-levels-defaults
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-wordspell-levels-defaults
**Git status:** clean
**Last commit:** a1757b3e docs: add WordSpell levels-and-defaults implementation plan
**PR:** #212 — open (<https://github.com/leocaseiro/base-skill/pull/212>)

## Resume command

```
# Continue in this same worktree — do NOT create a new one.
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-wordspell-levels-defaults
/resync
# Then dispatch subagent-driven execution of the plan:
# Use superpowers:subagent-driven-development on
# docs/superpowers/plans/2026-04-28-wordspell-levels-defaults.md
```

## Current state

**Task:** WordSpell — fix Level 3+, bring Advanced to parity with Simple, switch defaults to recall + random, remove scramble, add regression tests
**Phase:** implementation (plan written, code not started)
**Progress:** Spec + plan committed and pushed to PR #212. Tasks 1–11 ready to execute. **Next session: subagent-driven execution.**

## What we did

Brainstormed the WordSpell config overhaul from a "Levels in advanced + recall default" idea into a full design. Discovered the Level 3+ regression mid-brainstorm: the Simple form was populating `phonemesAllowed` with only the chosen level's phonemes, but `filterWords` requires every grapheme of a candidate word to map into the allowed set, so words using prerequisite-level phonemes were silently filtered out. Wrote the spec, then the implementation plan with a TDD red/green sequence and a parameterized curriculum-invariant test that locks the bug class out going forward.

## Decisions made

- **Default mode = `recall`** — picture mode silently degrades for library-sourced rounds (`adapters.ts:4-6` only sets `word`, no emoji/image). Recall is the synthetic-phonics target.
- **Random rounds by default** — `roundsInOrder: false`. No VR work needed: stories that need stability already opt in (`roundsInOrder: true` or `seed="storybook"`); the default flip only affects the no-config route launch path which isn't VR-tested.
- **Remove `scramble` mode entirely** — never used in any user-facing flow. No migration for old saved configs (pre-launch / dev-only data).
- **Advanced gains Level + Phonemes via shared sub-component** — extract `WordSpellLibrarySource`, expose to Advanced through a new `getAdvancedHeaderRenderer` registry hook. Other games unaffected.
- **Advanced also gains `distractorCount`** — was missing from WordSpell despite distractor mode being supported (NumberMatch already had it).
- **Three-layer regression strategy** — (1) curriculum invariant test parameterized over every (region, level) with `MIN_PLAYABLE_HITS = 4`; (2) form-emits-playable test that fails for Level 3+ before the fix; (3) cumulativeGraphemes helper unit test. Skipped E2E "play through every level" — too slow, redundant.

## Spec / Plan

- docs/superpowers/specs/2026-04-28-wordspell-levels-defaults-design.md
- docs/superpowers/plans/2026-04-28-wordspell-levels-defaults.md

## Key files (no edits yet — listed for the next session)

- src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx:39-52,60-75 — bug site; switch `GRAPHEMES_BY_LEVEL[level]` → `cumulativeGraphemes(level)`
- src/data/words/levels.ts:130-144 — `cumulativeGraphemes` helper (already correct; lock with test in Task 1)
- src/data/words/filter.ts:70-73 — the `every` predicate that defines the playable contract
- src/games/word-spell/types.ts:38,88-94 — drop `'scramble'`; add `distractorCount` field with `visibleWhen`
- src/games/word-spell/resolve-simple-config.ts:9 — flip `mode: 'scramble'` → `'recall'`
- src/routes/$locale/_app/game/$gameId.tsx:96-112 — flip `DEFAULT_WORD_SPELL_CONFIG.mode` → `'recall'` and `roundsInOrder` → `false`
- src/games/word-spell/WordSpell/WordSpell.tsx:505-509 — slot-interaction simplifies after scramble removal
- src/games/config-fields-registry.ts — add `getAdvancedHeaderRenderer` hook
- src/components/AdvancedConfigModal.tsx:236 — render header above `ConfigFormFields`
- src/games/build-round-order.ts — already accepts `seed` parameter; no engine change needed

## Next steps

1. [ ] In a fresh session, run `/resync` and `cd worktrees/feat-wordspell-levels-defaults`
2. [ ] Invoke `superpowers:subagent-driven-development` with the plan path: `docs/superpowers/plans/2026-04-28-wordspell-levels-defaults.md`
3. [ ] Execute Tasks 1 → 11 with one subagent per task and review between tasks
4. [ ] Push commits to PR #212; flip PR description from "spec only" to "spec + implementation"
5. [ ] When the dev-server smoke test in Task 11 passes, request review on PR #212

## Context to remember

- **Worktree gate is mandatory** — every task starts in `worktrees/<name>/`, including doc edits. Never edit on master.
- **TDD for bug fixes is required** — Task 3 must run and **fail** before Task 4's fix is applied. Don't skip the red phase.
- **Markdown gate** — any `.md` edit must pass `yarn lint:md` and `npx prettier --check`. Use `yarn fix:md` to auto-fix.
- **Named exports only** in React components (`react/function-component-definition`). The plan already follows this.
- **Baby-step commits** — multiple commits per PR are preferred. The plan splits work into focused commits per task.
- **VR baselines: not affected by this work.** `DEFAULT_WORD_SPELL_CONFIG` flipping to `roundsInOrder: false` does not break Storybook stories because each story explicitly sets its own config. If a VR run drifts unexpectedly, that's a real regression — investigate, don't auto-update baselines.
- **`MIN_PLAYABLE_HITS = 4`** in the curriculum-invariant test is load-bearing. Don't lower it. If a non-AUS region under-shoots, narrow the test to AUS and treat the others as deferred (Task 2 says this explicitly).
- **The user prefers `/resync` at session start** to surface any new commits on master — pause for their go-ahead before running.
