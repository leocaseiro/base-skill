# Handoff: WordSpell multi-level units plan ready for implementation

**Date:** 2026-04-29
**Branch:** feat/issue-216
**Worktree:** /Users/leocaseiro/.worktrees/base-skill/bs-4 (AO-spawned, non-standard path — see "Context to remember")
**Git status:** clean — 1 uncommitted file is AO session machinery (`.claude/settings.json` hooks edit + untracked `.claude/metadata-updater.sh`); never stage with feature commits
**Last commit:** c065e311 docs(plan): WordSpell multi-select levels & per-unit phoneme toggles
**PR:** #219 — open (<https://github.com/leocaseiro/base-skill/pull/219>)

## Resume command

```
# Continue in this same worktree on this same branch — do NOT create a new one.
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
/resync
# Then dispatch subagent-driven execution of the plan:
# Use superpowers:subagent-driven-development on
# docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md
```

## Current state

**Task:** Multi-select levels + per-`(grapheme, phoneme)` unit toggles for WordSpell, with RxDB migration so existing saves don't break
**Phase:** implementation (spec + plan committed and pushed; code not started for the new direction)
**Progress:** Plan tasks 1–11 ready to execute. PR #219 currently holds 10 commits of the cumulative-phonemes direction (still open). The plan supersedes the cumulative-form internals on the same branch.

## What we did

Started the session by executing the original WordSpell levels-and-defaults plan
(PR #219). Mid-review the user pushed back: cumulative chips at Level 4 surface
every L1–L4 phoneme, eroding the level focus, and there's no way to pick
disjoint sets like `{L1, L2, L4}`. We brainstormed a multi-select redesign
(visual companion @ <http://localhost:60944>), settled on stacked tri-state
checkbox rows with inline chip pills (Simple) / nested checkbox lists
(Advanced), and `(grapheme, phoneme)` units as the selection identity. Wrote
spec + plan, fixed an E2E breakage caused by my Task 9 change
(`roundsInOrder: false` default — reverted), filed issue #220 for a separate
play-again repeating-sequence bug, and shipped the docs.

## Decisions made

- **Selection unit = `(grapheme, phoneme)` pair, not just phoneme** — Why: 11
  phonemes recur at multiple levels via different graphemes (e.g. `/s/` via
  `s` at L1 and `c` at L4); a player might know one spelling but not the
  other.
- **Filter is phoneme-only, no level gate** — Why: levels are presets / bulk-
  toggle UX; the curriculum's `level` tag is informational metadata. A word
  plays iff every grapheme maps to a `(g, p)` pair in `selectedUnits`.
- **Tri-state level checkbox is derived, not stored** — Why: keeps the data
  model simple (one source of truth: `selectedUnits`) and the UI honest about
  what's actually selected.
- **First-launch default = `{L1}` only** — Why: scoped pedagogy; subsequent
  launches restore last-used selection from `last-session-game-config` (RxDB).
- **IndexedDB migration in scope** (saved_game_configs v3, custom_games v2)
  — Why: user explicitly asked: "I don't want broken current games loading."
  Pre-launch but real saves exist on the dev DB.
- **Reverted Task 9 (`roundsInOrder: false` default)** — Why: broke the
  `wordspell-resume-desync` E2E test which assumes round 0 is `cat`. The route
  seed is `nanoid()` (crypto.getRandomValues), not pinnable via
  `seedMathRandom`. Random-rounds default is deferred to this redesign with
  E2E impact addressed up-front.
- **Continue on `feat/issue-216`** (not a fresh branch) — Why: most of PR
  #219's polish (recall default, scramble removal, distractorCount, registry
  hook, `WordSpellLibrarySource` shell) survives intact; only the form
  internals get rewritten. Less churn than cherry-picking the keepers.

## Spec / Plan

- docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md
- docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md
- docs/superpowers/specs/2026-04-28-wordspell-levels-defaults-design.md (the
  original PR #219 spec — superseded for the form layer; recall/scramble/
  distractorCount sections still reflect what shipped)

## Key files (executor's roadmap)

- src/games/word-spell/level-unit-selection.ts — Task 1 creates
  `triStateForLevel`, `toggleLevel`, `toggleUnit`, `defaultSelection`
- src/db/migrations/word-spell-multi-level.ts — Task 2 creates
  `migrateWordSpellConfig`
- src/db/schemas/saved_game_configs.ts:17 — Task 3 bumps `version: 2 → 3`
- src/db/schemas/custom_games.ts:15 — Task 3 bumps `version: 1 → 2`
- src/db/create-database.ts:63-72 — Task 3 wires
  `migrationStrategies[3] = migrateWordSpellConfig` and
  `migrationStrategies[2] = migrateWordSpellConfig` for `custom_games`
- src/games/word-spell/types.ts:5 — Task 4 replaces simple-config shape
- src/games/word-spell/resolve-simple-config.ts — Task 4 derives
  `phonemesAllowed + graphemesAllowed` from `selectedUnits`; legacy
  coercion fallback in `advancedToSimple`
- src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx —
  Task 5 rewrite: chips + checkbox-tree variants
- src/games/config-fields-registry.ts:60 — Task 6 wraps Advanced renderer
  with `variant="checkbox-tree"`
- src/data/words/curriculum-invariant.test.ts — Task 7 rewrites per-level
  invariant
- src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx
  — Task 8 drives the new widget
- e2e/wordspell-resume-desync.spec.ts:273 — assumes round 0 is `cat`; do not
  break this when revisiting `roundsInOrder` defaults

## Open questions / blockers

- [ ] How to land random rounds (`roundsInOrder: false`) without breaking the
      resume-desync E2E test. Options: pin via test-only IDB seed, deep-link
      param, or change the route seed source to `Math.random()` so
      `seedMathRandom` works. Address as part of this redesign or as a
      follow-up after the form rewrite ships.
- [ ] The remote rebases `feat/issue-216` onto master automatically (force-
      push observed twice this session). New SHAs on every fetch. If a push
      gets rejected, capture local commits via tags first, then
      `git reset --hard origin/feat/issue-216` and `cherry-pick`.

## Next steps

1. [ ] In a fresh session, `cd /Users/leocaseiro/.worktrees/base-skill/bs-4`
       and run `/resync`.
2. [ ] Invoke `superpowers:subagent-driven-development` with the plan path
       `docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md`.
3. [ ] Execute Tasks 1 → 11. Each task is one focused commit; the plan has
       red→green TDD pairs throughout.
4. [ ] After Task 11's manual smoke (incl. pre-seeded legacy doc round-trip),
       update PR #219's description to reflect the new direction
       (cumulative-phonemes path superseded by multi-level-units).
5. [ ] Once merged, file a follow-up issue (or include in #220's PR) to
       address `roundsInOrder: false` default + E2E pin.

## Context to remember

- **Worktree path is non-standard.** Project convention is
  `/Users/leocaseiro/Sites/base-skill/worktrees/<branch>`; AO put us at
  `/Users/leocaseiro/.worktrees/base-skill/bs-4`. The branch is correct;
  only the on-disk path is off. `git worktree move` can fix it later but
  not while you're inside it. See memory note `feedback_worktree_location.md`.
- **Stay on `feat/issue-216`.** Do not create a new worktree or branch.
  All commits — spec, plan, future implementation — land here. PR #219
  auto-updates.
- **AO injects two files** that must NEVER be staged:
  `.claude/settings.json` (modified to add a PostToolUse hook) and
  `.claude/metadata-updater.sh` (untracked). Always use
  `git add <specific-paths>`, never `git add .` or `-A`.
- **TDD is mandatory for every bug fix and feature** (CLAUDE.md). The plan
  enforces this with red→green pairs in each task.
- **Markdown gate runs on every `.md` edit.** `yarn fix:md` auto-fixes most
  things; `npx prettier --check` and `yarn lint:md` must pass before commit.
- **Stories audit only** in Task 10 — no new `.stories.tsx` files. If any
  existing story constructs `WordSpellSimpleConfig` directly, fix to use
  `defaultSelection()`. The `write-storybook` skill applies if you add new
  stories; the `write-e2e-vr-tests` skill applies if you change VR or e2e.
- **PR #219's revert of `roundsInOrder: false`** is on the branch; the
  `DEFAULT_WORD_SPELL_CONFIG` route default is back to `roundsInOrder: true`.
  Don't accidentally re-flip it during the multi-level rewrite.
- **Issue #220** (play-again replays exact same word sequence) is filed and
  out of scope for this PR; root cause is `WordSpell.tsx:364` using the
  prop seed instead of the regenerated `sampleSeed` for `buildRoundOrder`.
- **`require('@/data/words')` inside `advancedToSimple`** — the plan uses
  this to dodge an import cycle. If TS/ESM tooling rejects it, switch to a
  top-level import; the cycle is benign because both modules tree-shake.
