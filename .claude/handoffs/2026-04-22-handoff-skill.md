# Handoff: handoff skill

**Date:** 2026-04-22
**Branch:** claude/priceless-faraday-54ad0d
**Worktree:** worktrees/priceless-faraday-54ad0d
**Worktree path:** /Users/leocaseiro/Sites/base-skill/.claude/worktrees/priceless-faraday-54ad0d
**Git status:** 1 uncommitted (`.claude/settings.local.json` — unrelated, gitignored-ish churn)
**Last commit:** 505c58e2 docs(agents): point agents at the handoff skill
**PR:** [#164](https://github.com/leocaseiro/base-skill/pull/164) — open

## Resume command

```text
/resync
cd .claude/worktrees/priceless-faraday-54ad0d
gh pr view 164 --web   # review feedback; address and push, or approve + merge
```

## Current state

**Task:** Ship the `handoff` skill (session-continuity skill) + `/continue` alias + Cursor mirror.
**Phase:** review
**Progress:** ~95% — implementation done, PR open, awaiting review / merge.

## What we did

Brainstormed the skill from scratch (surveyed Cult of Claude, softaworks, ykdojo variants), wrote the spec, then implemented directly from it (skipped the plan since scope was small). Produced five files — canonical SKILL.md, `/continue` alias, Cursor rule, handoffs README, AGENTS.md pointer — each as its own baby-step commit. Opened [PR #164](https://github.com/leocaseiro/base-skill/pull/164). This file is the dogfood test: running the skill on its own branch.

## Decisions made

- **Copyable markdown _and_ saved file** — earlier I thought copyable-only, but the path reference is useful (you can paste it back into a new session). Lands in `.claude/handoffs/YYYY-MM-DD-<slug>.md`.
- **Committed, not gitignored** — baby-step `docs(handoff): …` commits. Matches project workflow; cherry-pickable; survives worktree removal.
- **Shared source of truth for cross-agent** — `.claude/skills/handoff/SKILL.md` is canonical; Cursor rule is a thin pointer (same pattern as existing `git-workflow.mdc` → `CLAUDE.md`).
- **No plan file** — spec was prescriptive enough for five markdown files. Skipped the writing-plans step.
- **No Python scripts / validators / chaining / quality scoring** — softaworks variant was too heavy. Kept surface minimal.

## Spec / Plan

- [docs/superpowers/specs/2026-04-22-handoff-skill-design.md](../../docs/superpowers/specs/2026-04-22-handoff-skill-design.md)
- _(no plan — skipped intentionally)_

## Key files

- `.claude/skills/handoff/SKILL.md` — canonical skill; auto-detect commands, template, quality check, commit step
- `.claude/commands/continue.md` — `/continue` alias
- `.cursor/rules/handoff.mdc` — Cursor mirror, points at canonical SKILL.md
- `.claude/handoffs/README.md` — directory intro + naming/commit conventions
- `AGENTS.md` — one-line pointer under "Where to look next"

## Next steps

1. [ ] Review feedback on [PR #164](https://github.com/leocaseiro/base-skill/pull/164); address any comments.
2. [ ] Merge PR; remove worktree: `git worktree remove .claude/worktrees/priceless-faraday-54ad0d`.
3. [ ] After some real-world usage, consider forking a generalised publishable version for [skill.fish](https://www.skill.fish/) (strip BaseSkill-specific bits, parameterise worktree/`/resync` references).

## Context to remember

- Auto-invoke triggers in the description: "just saved a plan/spec", "just raised/merged a PR", "hand this off", "continue in a new session", "pick this up later", "end of session", "wrap up".
- Future enhancement ideas (deliberately out of scope now): RESUME workflow skill, handoff chaining, staleness detection, auto-invoke on context threshold.
- Respect the worktree gate — skill never writes on `master`.
