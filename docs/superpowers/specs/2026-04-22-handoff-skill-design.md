# Handoff Skill — Design

**Date:** 2026-04-22
**Status:** Draft for review
**Adapted from:** [Cult of Claude `handoff` skill](https://cultofclaude.com/skills/handoff/)
(source: [robertguss/claude-code-toolkit](https://github.com/robertguss/claude-code-toolkit/blob/main/skills/handoff/SKILL.md))

## Problem

Sessions don't persist. After saving a plan, saving a spec, or raising/merging
a PR, the next session starts cold — re-explaining branch, worktree, PR state,
next steps, and key files costs tokens and attention.

`/compact` merges history into the same session. What we need is the opposite:
a clean handoff artifact that lets us start a **fresh** session with minimal
prompt, preserving only what matters.

## Goal

A project-scoped skill that, on demand or when it detects handoff cues,
generates a short structured document at
`.claude/handoffs/YYYY-MM-DD-<slug>.md` with everything a fresh session needs to
resume work — git state, spec/plan paths, PR status, next steps.

## Non-goals

- Not a conversation summarizer (that's `/compact`).
- No Python scripts, validators, quality scoring, chaining, or staleness
  detection. Keep the surface area small.
- No automatic trigger on context thresholds. Trigger is explicit (`/handoff`,
  `/continue`) or description-cue based only.
- No generalized publish-to-skill.fish version. That's a future fork.

## Installation footprint

- `.claude/skills/handoff/SKILL.md` — the canonical skill definition
  (instructions, template, process). Single source of truth.
- `.claude/commands/continue.md` — one-line alias that invokes the `handoff`
  skill so `/continue` is also discoverable via `/` fuzzy search in Claude Code
- `.cursor/rules/handoff.mdc` — Cursor rule that mirrors the auto-invoke
  description cues and points Cursor at
  `.claude/skills/handoff/SKILL.md` as the source of truth (same pattern as
  the existing `.cursor/rules/git-workflow.mdc` → `CLAUDE.md`)
- `AGENTS.md` — add a one-line pointer under "Where to look next" so
  tool-agnostic agents discover the skill
- `.claude/handoffs/` — directory where generated handoffs land (created on
  first use)

## Cross-agent support (Claude Code + Cursor)

The project already supports both agents via a shared-source-of-truth pattern
(see `.cursor/rules/git-workflow.mdc` mirroring `CLAUDE.md`). We follow the
same convention:

- **Claude Code** reads `.claude/skills/handoff/SKILL.md` directly. Invoked
  via the `Skill` tool, `/handoff`, or `/continue`.
- **Cursor** reads `.cursor/rules/handoff.mdc`, which contains the same
  auto-invoke cues in its `description` field and a short pointer:
  > "Follow the handoff workflow defined in
  > `.claude/skills/handoff/SKILL.md`. Same document template, same commit
  > policy, same worktree rule."

Cursor's `.mdc` frontmatter:

```yaml
---
description: >-
  Create a session handoff document so work can continue in a new session or
  with another agent. Use when just saved a plan or spec, just raised or
  merged a PR, ending a session, context-switching, or told to hand off /
  continue later.
globs: []
alwaysApply: false
---
```

This keeps the skill body in one file (no duplication, no drift) while both
tools detect the same cues through their native mechanisms.

Other agents (Copilot, Gemini, generic) pick it up via `AGENTS.md` pointer,
which is the project's cross-agent entrypoint.

## Skill metadata

```yaml
name: handoff
description:
  Create a session handoff document so work can continue in a new session. Use
  when just saved a plan or spec, just raised or merged a PR, ending a session,
  context-switching, or explicitly told to hand off / continue later.
```

The description carries the auto-invoke cues. Explicit invocation is
`/handoff` or `/continue`.

## Process

When invoked, the skill instructs Claude to:

1. **Auto-detect context** via shell/`gh`:
   - `git branch --show-current` — branch name
   - `git worktree list` — current worktree path
   - `git status --porcelain` — count uncommitted files
   - `git rev-list --count @{u}..HEAD` — unpushed commit count
   - `git log -1 --pretty=format:"%h %s"` — last commit sha + subject
   - `gh pr view --json number,state,url` — open PR for current branch (skip
     silently if none)
   - Recently-saved specs/plans in `docs/superpowers/specs/` and
     `docs/superpowers/plans/` (optional — include if a recent one matches the
     current branch's topic)
2. **Ask one question:** "Anything specific you want captured? (key decisions,
   gotchas, things you'll forget)". Single prompt, no follow-up loop.
3. **Generate the document** from the template below, pre-filled with detected
   values.
4. **Write to** `.claude/handoffs/YYYY-MM-DD-<brief-slug>.md` in the **active
   worktree** (never master — enforced by the project's worktree gate).
5. **Commit the handoff** as its own baby-step commit, message
   `docs(handoff): <brief description>`.
6. **Print** the file path and a one-line resume hint:
   `Saved handoff: .claude/handoffs/…md — paste that path in a new session to resume.`

## Document template

```markdown
# Handoff: <brief description>

**Date:** YYYY-MM-DD
**Branch:** <branch-name>
**Worktree:** worktrees/<name>
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/<name>
**Git status:** clean | N uncommitted | N unpushed commits ahead of origin
**Last commit:** <sha> <subject>
**PR:** #NNN — open/merged/closed (omit line if none)

## Resume command

\`\`\`
/resync
cd worktrees/<name>
<next action — e.g., execute plan docs/…md, open PR, resume debugging, etc.>
\`\`\`

## Current state

**Task:** <what we're working on>
**Phase:** exploration | planning | implementation | debugging | review | shipped
**Progress:** <milestone or %>

## What we did

<2–3 sentences>

## Decisions made

- **<decision>** — <why>

## Spec / Plan

- docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
- docs/superpowers/plans/YYYY-MM-DD-<topic>.md (if exists)

## Key files

- src/…/foo.ts:42 — <what and why>

## Open questions / blockers

- [ ] <question>

## Next steps

1. [ ] <first action>
2. [ ] <second>

## Context to remember

<constraints, user preferences, domain knowledge not obvious from code>
```

Sections with no content are **omitted**, not left empty — keeps the document
scannable.

## Commit policy

Handoffs are committed to the branch in their own baby-step commits
(`docs(handoff): <description>`). This matches the project's baby-step commit
workflow:

- Reviewable as part of the PR.
- Cherry-pickable or droppable independently.
- Easy to squash on merge if noisy.
- Survives memory resets and worktree removal.

Alternative considered: gitignore. Rejected because handoffs are genuinely
useful history — future you, teammates, and future Claude sessions all benefit
from reading past handoffs to understand how a branch got to its current state.

## Worktree rule

Handoffs are always written inside the active worktree. Never on master. The
SKILL.md states this explicitly and the project's existing worktree gate in
CLAUDE.md enforces it.

## Quality check (self-check before writing)

Before saving, the skill checks:

1. Could a fresh Claude pick up from this?
2. Are decisions traceable (the "why")?
3. Are next steps actionable?
4. Are file paths anchored (no vague "that function")?

No quality score, no validation script — just a mental pass.

## Trigger cues (auto-invoke description)

The description includes these natural-language cues so Claude offers the skill
proactively:

- "just saved a plan"
- "just saved a spec"
- "just raised a PR"
- "just merged a PR"
- "continue in a new session"
- "hand this off"
- "end of session" / "wrap up"
- "pick this up later"

## Alias command

`.claude/commands/continue.md` contains a thin slash-command wrapper that
invokes the `handoff` skill. This lets both `/handoff` and `/continue` work as
explicit triggers in the `/` fuzzy-search menu.

Content is minimal — it just references the skill so Claude knows to run it.

## Existing skills surveyed (and why not adopt directly)

| Skill                                                                                          | Why not a direct fit                                                                                     |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [ykdojo/handoff](https://github.com/ykdojo/claude-code-tips/blob/main/skills/handoff/SKILL.md) | Writes single `HANDOFF.md` at repo root, not dated archive. No git metadata, no PR, no worktree support. |
| [softaworks/session-handoff](https://github.com/softaworks/agent-toolkit)                      | Requires Python scripts, 10 sections, quality scoring, chaining — heavy for our needs.                   |
| [Cult of Claude handoff](https://cultofclaude.com/skills/handoff/) **(chosen base)**           | Good template and process. Missing worktree/PR/resync awareness — added here.                            |

## Out of scope (future work)

- Generalized publishable version for skill.fish (strip BaseSkill-specific bits,
  parameterize worktree/resync references).
- RESUME workflow skill (read a handoff, verify staleness, begin work) — may
  not be needed; pasting the path into a new session is usually enough.
- Handoff chaining (linking sequential handoffs) — add if the handoff volume
  justifies it.
- Auto-invoke on context thresholds.

## Acceptance criteria

- `/handoff` (Claude Code) invoked from any branch worktree produces a dated
  handoff at `.claude/handoffs/YYYY-MM-DD-<slug>.md` with git state,
  worktree, PR (if any), spec/plan references, and a resume command block.
- `/continue` produces the same result as `/handoff` in Claude Code.
- Cursor detects the same cues via `.cursor/rules/handoff.mdc` and performs
  the same workflow by reading `.claude/skills/handoff/SKILL.md`.
- Description cues cause both Claude Code and Cursor to proactively offer the
  skill after a plan, spec, or PR event.
- The handoff is committed as a `docs(handoff): …` commit in the active
  worktree.
- Pasting the handoff's file path into a fresh session (in either agent) is
  enough to resume work without further context from the user.
- `AGENTS.md` has a pointer so tool-agnostic agents discover the skill.

```

```
