# Handoff: Issue #343 tracking update — Spec 1a M1 ship cluster

**Date:** 2026-05-13
**Status:** Ready to apply
**Type:** Admin / tracking-issue body edit. ~5 min task.
**Issue:** [#343 — Tracking: Spec 1a M1 ship cluster — #229 + #257 + SRS v1 + #300](https://github.com/leocaseiro/base-skill/issues/343)

## Why this update is needed

Issue #343 was last updated 2026-05-08 and is now stale on several fronts:

- References **PR #350** as "OPEN, ready to merge" — actually CLOSED since 2026-05-11 (superseded by #354).
- References **"Phase 1 implementation plan (to write — replaces useGameRound plan)"** — the plan was written and shipped via #354.
- The dependency graph lists PR 1a, PR 1b, PR 1c as pending — actually PR 1a (#355) and PR 1b (#357 + #360) have shipped on master.
- The recommended-sequence step 1 ("Merge PR #350") is obsolete. The rest of the sequence needs status update.
- Lists **PR #345** under "superseded; can be closed" — but #345 actually merged as the useGameRound spec (the spec then received a Spec Delta via #354).

## Verification before editing

Re-confirm state on master before applying the new body (these are fast `gh` commands):

```bash
gh pr view 350 --json state --jq .state            # expect "CLOSED"
gh pr view 354 --json state --jq .state            # expect "MERGED"
gh pr view 355 --json state --jq .state            # expect "MERGED"
gh pr view 357 --json state --jq .state            # expect "MERGED"
gh pr view 360 --json state --jq .state            # expect "MERGED"
gh pr view 345 --json state --jq .state            # expect "MERGED"
```

If any of these differ from expected, surface the divergence and update the proposed body before applying — don't ship outdated state into a tracking doc that's supposed to be authoritative.

## Proposed new body

The full proposed body content lives in a sibling file so the markdown renders cleanly without nested-fence issues:

**`worktrees/chore-handoff-pr1c-and-343-update/.claude/handoffs/2026-05-13-issue-343-body.md`**

Read it end-to-end before applying. It updates: foundation status, dependency graph, spec status, plan status, recommended sequence, and infra-fixes-shipped sections.

## Apply command

From the project root (or any directory with the body file accessible):

```bash
gh issue edit 343 --body-file .claude/handoffs/2026-05-13-issue-343-body.md
```

Replace the path if the handoff worktree has been merged and the file has moved to master (it will live at the same path either way, just on a different branch).

## Verification after editing

```bash
gh issue view 343 --json updatedAt --jq '.updatedAt'
```

The edit history is visible from GitHub's edit dropdown on the issue body, so the prior version is preserved for reference even after the edit.

## What this handoff does NOT change

- Does not close any issue. #343 stays open as the active tracking issue.
- Does not edit any labels, assignees, or milestones — body-only edit.
- Does not touch the other tracking issues (#229, #257, #300, #323) — only #343 is updated here. If those need similar status sweeps, they're separate handoffs.

## Verdict

Small, low-risk admin task. The proposed body content reflects the current state of master and PR landscape. Apply, verify, done.
