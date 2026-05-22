# Handoffs

Dated handoff documents produced by the `handoff` skill (see [`.claude/skills/handoff/SKILL.md`](../../.claude/skills/handoff/SKILL.md)).

> **Path note:** these used to live at `.claude/handoffs/`. Migrated to `docs/handoff/` in PR ↗️ (see git log for exact PR) so handoff documentation lives alongside other project docs (specs, plans, ADRs). Cross-references inside individual handoff files reflect the path at time of writing — not rewritten for historical accuracy.

Each file captures enough context — branch, worktree, PR status, next steps, key files — for a fresh Claude Code or Cursor session to resume work without re-explanation.

## Naming

`YYYY-MM-DD-<brief-slug>.md` — slug is the branch topic in 2–5 hyphenated lowercase words.

## Commit policy

Committed to the branch as `docs(handoff): …` baby-step commits. Reviewable in PRs, cherry-pickable, droppable independently, easy to squash on merge.

## How to resume

Paste the handoff's file path into a fresh session. The `Resume command` block at the top of each handoff is everything needed to get going.
