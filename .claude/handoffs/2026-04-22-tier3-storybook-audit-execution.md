# Handoff: Tier 3 Storybook audit — plan merged, execution pending

**Date:** 2026-04-22
**Branch:** docs/handoff-tier3
**Worktree:** worktrees/docs-handoff-tier3
**Plan PR:** #150 — **MERGED** (2026-04-22). Plan doc on master at `docs/superpowers/plans/2026-04-22-storybook-audit-tier3-plan.md`.
**Follow-up issues:** #153 (per-game `*.config-form.stories.tsx` — additive). #152 (global default skin) — **closed/done**, implemented by #154.

## Resume command

```bash
/resync
# Read the plan:
cat docs/superpowers/plans/2026-04-22-storybook-audit-tier3-plan.md
# Execute Wave 1 (3 parallel tasks) using the subagent-driven-development skill.
# Each task creates its own worktree: worktrees/stories-tier3-<slug>, branch stories/<slug>-audit.
```

## Current state

**Task:** Tier 3 Storybook audit for 5 files — plan shipped, execution not started.
**Phase:** planning-complete — ready for subagent-driven execution.
**Upstream dependencies:** all landed — `withDefaultSkin` global decorator (#154) and the single-Default Playground pattern docs in the skill (#155). The plan was amended for both before merge.

## What we did this session

1. Wrote the Tier 3 plan (PR #150): 5 tasks across 2 waves, one worktree + branch + PR per file, exact code blocks.
2. Iteratively tightened the plan based on user feedback:
   - Collapsed every Task to a single `Default` story (Playground pattern). Auxiliaries kept only for scenarios Controls/toolbar can't reach — only `AllColors` in GameNameChip survives.
   - Renamed `Playground` → `Default` and `Showcase` → `Default` per #155.
   - Dropped all "no skin wrapper" language per #154 (global decorator handles it).
   - Added a `w-64` wrapper + `layout: centered` to Task 2 (GameCard) after user shared a screenshot showing the card stretched to full canvas.
3. Task 4 (ConfigFormFields) genericised: replaced SortNumbers-specific `sortFields` fixture with 5 generic fixtures (`primitive-types`, `nested-types`, `nested-select-or-number`, `visible-when-hidden`, `visible-when-shown`) — one per rendering branch of the component.
4. Opened #153 (additive, per-game `*.config-form.stories.tsx` — mirrors #143 per-game InstructionsOverlay move).
5. Opened + closed #152 in the same cycle (implemented by #154).

## Decisions made

- **Execution is two waves, not five-way parallel.** Wave 1 = GameGrid, GameCard, GameNameChip (3 parallel). Checkpoint. Wave 2 = ConfigFormFields, ThemeShowcase (2 parallel). Reason: serialising limits reviewer load and catches pattern drift before committing Wave 2. No shared files are touched, so the 5 tasks are mechanically safe to run fully parallel if the user wants to compress.
- **Story name is `Default`, not `Playground`.** The skill (#155) uses `Default` as the identifier; "Playground" is the conceptual label.
- **No per-file skin wrappers.** The global `withDefaultSkin` decorator applies `classicSkin` to every story. A per-file wrapper in a Tier 3 PR would double-wrap and is a bug.
- **`AllColors` in GameNameChip is a legitimate auxiliary.** A 12-colour palette survey is NOT reachable from Controls in one click, so it stays per the skill's "When to Add Auxiliary Stories" criteria. Every other Task collapses to `Default` only.
- **Task 4 is generic, not SortNumbers-flavoured.** Per-game ConfigForm previews (SortNumbers/NumberMatch/WordSpell) belong in co-located game stories under `src/games/<game>/` per #153 — mirroring the #143 `InstructionsOverlay` split.

## Spec / Plan

- Plan: `docs/superpowers/plans/2026-04-22-storybook-audit-tier3-plan.md` (on master post-#150)

## Key files the plan will modify

- `src/components/GameGrid.stories.tsx` — Task 1 (Wave 1)
- `src/components/GameCard.stories.tsx` — Task 2 (Wave 1)
- `src/components/GameNameChip.stories.tsx` — Task 3 (Wave 1)
- `src/components/ConfigFormFields.stories.tsx` — Task 4 (Wave 2)
- `src/stories/ThemeShowcase.stories.tsx` — Task 5 (Wave 2)

## Canonical references for execution

- Playground pattern: `.claude/skills/write-storybook/SKILL.md` (added/rewritten in #155)
- Shell-slim `Default` example: `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`
- Trigger-button pattern (for callbacks Controls can't invoke): `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx`
- Global skin decorator: `.storybook/decorators.tsx` → `withDefaultSkin` (from #154)
- Rollout tracker: #125

## Open questions / blockers

- [ ] Should Tier 3 execution use subagent-driven-development (fresh subagent per task with review between) or inline executing-plans (batch with checkpoints)? Plan is written to support either; the user hadn't chosen when the plan merged.
- [ ] Task 2 (GameCard) uses `useTranslation('common')` — if Storybook's i18n init from `.storybook/preview.tsx` is missing a key, the stories may render translation keys instead of strings. Verify visually on first execution.

## Next steps

1. [ ] `/resync` and confirm on `master`, clean tree.
2. [ ] Decide execution mode (subagent-driven vs inline) — see open questions.
3. [ ] Dispatch Wave 1 as 3 parallel subagents / worktrees:
   - `worktrees/stories-tier3-game-grid` (branch `stories/game-grid-audit`)
   - `worktrees/stories-tier3-game-card` (branch `stories/game-card-audit`)
   - `worktrees/stories-tier3-game-name-chip` (branch `stories/game-name-chip-audit`)
4. [ ] Review Wave 1 PRs — watch for drift in `StoryArgs` shape, `fn()` wiring inside render, and accidental skin wrappers.
5. [ ] Dispatch Wave 2 as 2 parallel subagents:
   - `worktrees/stories-tier3-config-form-fields` (branch `stories/config-form-fields-audit`)
   - `worktrees/stories-tier3-theme-showcase` (branch `stories/theme-showcase-audit`)
6. [ ] After all 5 PRs merge: tick 5 boxes in issue #125; spawn #153 work next session.

## Context to remember

- **Worktree gate is mandatory** for all file edits, including `.md` plans/specs/docs. `master` is protected.
- **Baby-step commits are preferred** — multiple focused commits per PR are better than one mega-commit (per CLAUDE.md and #156/#164).
- **User is comfortable with parallel worktrees and force-pushes on feature branches.** Remote rebases the plan branch onto new master when a new master commit lands while the PR is open; handle with `git rebase --onto origin/<branch> <old-base>` then `git push --force-with-lease`.
- **User prefers direct style: propose, get LGTM, execute, commit, proceed.** No preamble, no excessive summaries. Single-letter replies like "y" or "2" are confirmations of specific items in numbered offers.
- **PR #157 covered a DIFFERENT set of 5 root files** (Footer, Header, OfflineIndicator, ThemeToggle, UpdateBanner — Tier 5). Don't confuse with this plan's 5 files.
- **VR baselines:** none of the 5 Tier 3 files have existing VR baselines; execution shouldn't trigger VR snapshot updates. If a Wave 1 PR's VR suite fails unexpectedly, treat as out-of-scope and log (it's likely a pre-existing issue from an unrelated route).
- **PR automation:** pushes may auto-open a PR. Edit the auto-created PR's title/body rather than creating a new one.
- **The plan's "Upstream work already merged" section at the end** explicitly lists #154 and #155 as context — re-read those before execution to understand why the plan doesn't mention skin wrappers and uses `Default` everywhere.
