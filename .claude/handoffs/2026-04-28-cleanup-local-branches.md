# Handoff: Local branch and worktree cleanup — 2026-04-28

**Date:** 2026-04-28
**Branch:** handoff-cleanup-local-branches-2026-04-28
**Worktree:** worktrees/handoff-cleanup-local-branches-2026-04-28
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/handoff-cleanup-local-branches-2026-04-28
**Git status:** clean
**Last commit:** 26fdfd38 chore(release): v0.17.2 (#197)

## Resume command

```bash
/resync
# Then work through the branch list below top-to-bottom
```

## Current state

**Task:** Audit all local branches and worktrees; identify what's merged, what needs a PR, and what's safe to delete.
**Phase:** In progress — major cleanup done, several branches still require action.
**Progress:** ~60% — merged docs via PR #196, fixed audit/storybook-controls via PR #200, identified remaining backlog.

## What we did

- Ran PR #196 (`chore/update-master-with-all-pending-branches`) to merge all pending doc/config branches into master.
- Diagnosed that many "ahead" branches are squash-merge ghosts (content already in master but commits not linked) — introduced `git diff --name-only merge-base branch` as the reliable check.
- Opened PR #200 (`audit/storybook-controls`) for the UI story controls audit + `write-storybook` SKILL.md update, resolving a duplicate-table / contradictory `argTypesRegex` conflict along the way.
- Created `docs/pending-consolidate` branch with the two word-authoring docs that were missing from master.
- Cleared stale memory entry for `fix/wordspell-resume-desync` (already merged).

## Key discovery: squash-merge ghost detection

`git branch --no-merged master` is **not reliable** in a squash-merge workflow. Always verify with:

```bash
base=$(git merge-base master <branch>)
git diff --name-only "$base" <branch> \
  | grep -vE '^\.specstory/|^\.claude/handoffs/|^e2e/__snapshots__/' \
  | while read f; do git diff --quiet master <branch> -- "$f" || echo "REAL DIFF: $f"; done
```

Zero output = branch is a ghost, safe to delete.

## Branch inventory — as of 2026-04-28

### Safe to delete (real diff = 0, content already in master)

All content squash-merged via earlier PRs. No worktrees reference these except where noted.

| Branch                                          | Worktree to remove                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `feat/phonics-word-library-task-11-filterWords` | `.claude/worktrees/gifted-bouman`                                                        |
| `ci/auto-merge-release`                         | —                                                                                        |
| `stories/instructions-overlay-audit`            | `worktrees/stories-instructions-overlay`                                                 |
| `stories/tier1-2-audit-plan`                    | —                                                                                        |
| `stories/text-question-audit`                   | —                                                                                        |
| `stories/image-question-audit`                  | —                                                                                        |
| `stories/audio-button-audit`                    | —                                                                                        |
| `stories/dot-group-question-audit`              | —                                                                                        |
| `chore/specstory-sync-2026-04-28_2`             | —                                                                                        |
| `docs/tdd-rule`                                 | `worktrees/docs/tdd-rule` (if still present)                                             |
| `feat/word-authoring`                           | `.claude/worktrees/suspicious-shaw-27a961` — docs captured in `docs/pending-consolidate` |
| `plan/storybook-coverage`                       | — (SKILL.md changes landed in PR #200)                                                   |

### PRs open — awaiting merge

| Branch                     | PR                                                        | Real diff files | Notes                              |
| -------------------------- | --------------------------------------------------------- | --------------- | ---------------------------------- |
| `audit/storybook-controls` | [#200](https://github.com/leocaseiro/base-skill/pull/200) | 1               | UI story controls audit + SKILL.md |
| `docs/pending-consolidate` | (not yet opened)                                          | 2               | Word-authoring spec + plan docs    |

### Active feature work — needs PR

These branches have real file differences vs master and should each become a PR.
Listed by estimated complexity (real diff file count):

| Branch                                    | Real diff | Worktree                                         | What it is                                                                                                                                                 |
| ----------------------------------------- | --------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat/answer-game-primitive`              | 37        | `worktrees/feat-answer-game-primitive`           | Answer game primitive + exit confirmation dialog                                                                                                           |
| `claude/musing-merkle`                    | 13        | `.claude/worktrees/musing-merkle`                | Birthday cake NumberMatch theme prototype                                                                                                                  |
| `feat/word-syllables`                     | 12        | `worktrees/feat-word-syllables`                  | Syllable codegen via hypher                                                                                                                                |
| `tools/phoneme-tuner`                     | 12        | `worktrees/tools-phoneme-tuner`                  | Per-IPA phoneme sustain config                                                                                                                             |
| `feat/phonics-word-library`               | 10        | (no worktree — gifted-bouman is on wrong branch) | Full phonics library integration into WordSpell                                                                                                            |
| `claude/bold-meitner-9c8ee4`              | 2         | `.claude/worktrees/bold-meitner-9c8ee4`          | Word-explorer prefix search + numbered pagination                                                                                                          |
| `claude/hardcore-driscoll-b81954`         | 2         | `.claude/worktrees/hardcore-driscoll-b81954`     | Phoneme-blender re-fire when re-entering zone                                                                                                              |
| `feat/phonics-word-library-task-01-types` | 2         | (no worktree)                                    | Phonics library type definitions                                                                                                                           |
| `stories/word-library-explorer-audit`     | 1         | (worktree removed)                               | `WordLibraryExplorer.stories.tsx` audit                                                                                                                    |
| `stories/word-library-explorer-audit_2`   | 1         | (no worktree)                                    | Duplicate/follow-up of above — check vs `_` variant                                                                                                        |
| `feat/bookmarks-phase-2`                  | 1         | (worktree removed)                               | `src/db/create-database.ts` only — confirm needed                                                                                                          |
| `claude/stupefied-satoshi_2`              | 1         | `.claude/worktrees/stupefied-satoshi`            | `SortNumbers.skin.stories.tsx` new skin story                                                                                                              |
| `feat/game-tile-auto-font-sizing`         | 6         | (worktree removed)                               | **Caution:** PR #199 is open but branch is behind master on 6 files — close PR #199 and delete branch unless those 6 files represent intentional additions |

### Needs investigation before deciding

| Branch                            | Real diff | Issue                                                                                                                                                                                              |
| --------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat/game-tile-auto-font-sizing` | 6         | PR #199 open — but the 6 differing files may be files where master has _evolved past_ the branch, meaning merging would revert master. Verify each file before acting. Close PR #199 if confirmed. |
| `feat/bookmarks-phase-2`          | 1         | Only `create-database.ts` differs. Verify this isn't a schema version bump that was superseded by the DM4 fix.                                                                                     |

## Next steps

1. [ ] Open PR for `docs/pending-consolidate` (word-authoring spec + plan)
2. [ ] Merge PR #200 (`audit/storybook-controls`) once CI passes
3. [ ] Delete safe-to-delete branches + worktrees (table above)
4. [ ] Close PR #199 (`feat/game-tile-auto-font-sizing`) — branch is behind master; verify the 6 files before deleting the branch
5. [ ] Decide order for feature PRs: recommended sequence by dependencies:
   - `claude/hardcore-driscoll-b81954` (phoneme fix, self-contained)
   - `feat/phonics-word-library-task-01-types` (types needed by phonics library)
   - `feat/phonics-word-library` (depends on types)
   - `feat/word-syllables` (standalone codegen)
   - `tools/phoneme-tuner` (standalone tool)
   - `feat/answer-game-primitive` (game engine work, largest)
   - `claude/musing-merkle` (theme prototype, lowest urgency)

## Context to remember

- **Squash-merge workflow** means `git branch --no-merged` is unreliable — always use the merge-base diff technique above.
- **PR #199** (`feat/game-tile-auto-font-sizing`) should be **closed**, not merged. PR #54 squash-merged the original work; the branch was not deleted and the open PR is a ghost for most files.
- **`stories/word-library-explorer-audit_2`** appeared during today's session — compare it against the original `stories/word-library-explorer-audit` before deciding which to use.
- **`.claude/worktrees/gifted-bouman`** is pointing at `feat/phonics-word-library-task-11-filterWords` (fully merged) but `feat/phonics-word-library` (10 real diffs) has no worktree — if resuming phonics library work, recreate a worktree for `feat/phonics-word-library`.
- All worktrees under `./worktrees/` (not `.claude/worktrees/`) follow CLAUDE.md convention; the `.claude/worktrees/` ones are AI-session worktrees from earlier sessions.
