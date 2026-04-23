# Handoff: Tier 3 Storybook audit — dispatch Wave 1

**Date:** 2026-04-23
**Branch:** docs/handoff-next-tier
**Worktree:** worktrees/docs-handoff-next-tier
**Status of prior handoff:** `.claude/handoffs/2026-04-22-tier3-storybook-audit-execution.md` (PR #166, merged) remains the canonical plan-level handoff. This doc is a thin "start here next session" pointer built after Tier 2 fully shipped.

## Resume command

```bash
/resync
cat docs/superpowers/plans/2026-04-22-storybook-audit-tier3-plan.md
cat .claude/handoffs/2026-04-22-tier3-storybook-audit-execution.md
# Then dispatch Wave 1 (3 parallel worktrees, 1 per file):
#   stories/game-grid-audit      → worktrees/stories-tier3-game-grid
#   stories/game-card-audit      → worktrees/stories-tier3-game-card
#   stories/game-name-chip-audit → worktrees/stories-tier3-game-name-chip
```

## Current state

**Task:** Tier 3 Storybook audit (5 files). Plan PR #150 merged 2026-04-22. Execution not started.
**Phase:** ready to dispatch Wave 1.
**Tier 2 (questions):** fully shipped — #159 TextQuestion, #160 ImageQuestion, #161 AudioButton, #162 DotGroupQuestion, #163 WordLibraryExplorer (Misc bucket). Issue #125 checkboxes for all five ticked.
**Tier 3 (this batch):** zero commits to the 5 target files on master. All 5 checkboxes on #125 still empty.

## Decision still open

- [ ] **Execution mode:** subagent-driven-development (fresh subagent per task + review between) **vs** inline executing-plans (batch with checkpoints). Plan supports either.
- [ ] **Wave cadence:** 2 waves with checkpoint (plan default — Wave 1 = 3 parallel, Wave 2 = 2 parallel) **vs** full 5-way parallel (mechanically safe, no shared files). User hadn't chosen when PR #150 merged.

## Files for Wave 1

- `src/components/GameGrid.stories.tsx` — Task 1
- `src/components/GameCard.stories.tsx` — Task 2 (needs `w-64` wrapper + `layout: centered` per plan)
- `src/components/GameNameChip.stories.tsx` — Task 3 (keep `AllColors` auxiliary; everything else collapses to single `Default`)

## Files for Wave 2

- `src/components/ConfigFormFields.stories.tsx` — Task 4 (generic fixtures: primitive-types, nested-types, nested-select-or-number, visible-when-hidden, visible-when-shown)
- `src/stories/ThemeShowcase.stories.tsx` — Task 5

## Canonical references

- Plan: `docs/superpowers/plans/2026-04-22-storybook-audit-tier3-plan.md`
- Pattern docs: `.claude/skills/write-storybook/SKILL.md` (Playground / single-`Default` pattern — #155)
- Shell-slim example: `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`
- Trigger-button example (for callbacks Controls can't invoke): `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx`
- Global skin decorator: `.storybook/decorators.tsx` → `withDefaultSkin` (#154) — **do not add per-file skin wrappers**, double-wraps
- Rollout tracker: #125

## Follow-up queued (not this session)

- Issue #153 — additive per-game `*.config-form.stories.tsx` (SortNumbers/NumberMatch/WordSpell), mirroring #143 InstructionsOverlay split. Start only after Tier 3 merges.

## Context to remember

- **Master advanced 40 commits since Tier 3 plan merged** (releases v0.13.0 → v0.14.1, WordLibraryExplorer mobile + PhonemeBlender, the five Tier 2 PRs). None touch Tier 3 files, so plan is still accurate — but always `/resync` before dispatching.
- **Worktree gate** for every file edit (including docs). `master` is protected.
- **Baby-step commits** preferred over single mega-commits (CLAUDE.md; #156, #164).
- **Force-pushing feature branches is fine; master is protected.** When plan-branch gets behind master and needs rebasing: `git rebase --onto origin/<branch> <old-base>` then `git push --force-with-lease`.
- **VR baselines:** none of the 5 Tier 3 files have VR snapshots; don't expect VR diffs on first push.
- **PR automation:** pushes may auto-open a PR; edit the auto-created PR rather than creating a new one.
- **Tier numbering is author's, not the repo's** — #125 doesn't label tiers explicitly. This "Tier 3" = the 5 files named above, per plan PR #150.
