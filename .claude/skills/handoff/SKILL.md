---
name: handoff
description:
  Create a session handoff document so work can continue in a new session or
  with another agent. Use when just saved a plan or spec, just raised or
  merged a PR, ending a work session, context-switching, or explicitly told
  to hand off / continue later. Triggers on phrases like "hand this off",
  "continue in a new session", "pick this up later", "end of session",
  "wrap up".
---

# Handoff

Adapted from the [Cult of Claude handoff skill](https://cultofclaude.com/skills/handoff/) ([source](https://github.com/robertguss/claude-code-toolkit/blob/main/skills/handoff/SKILL.md)), tailored for BaseSkill's worktree + `/resync` + baby-step commit workflow.

## When to use

- Just saved a plan or spec (→ next session executes it)
- Just raised or merged a PR (→ next session starts follow-up work)
- Ending a work session or context-switching
- User says "hand this off", "continue in a new session", "pick this up later"

Explicit invocation: `/handoff` or `/continue`.

## Worktree rule

Handoffs are written inside the **active worktree**, never on `master`. The
worktree must live at `<project-root>/worktrees/<name>/` — **not** inside
`.claude/worktrees/`.

### Why this matters

`.claude/` is a hardcoded sensitive directory in Claude Code. Every file
write inside it (including `.claude/worktrees/<anything>/...`) triggers a
permission prompt that **no `permissions.allow` rule can override**. A
handoff written inside `.claude/worktrees/<name>/.claude/handoffs/` will
prompt on every write — `mkdir`, the Markdown file itself, and the commit.

### Before writing the handoff, check `pwd`

| Current directory                  | Action                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `<root>/worktrees/<name>/`         | ✅ proceed                                                                                 |
| `<root>` (master)                  | ❌ stop; ask user to create a worktree (see below)                                         |
| `<root>/.claude/worktrees/<name>/` | ❌ stop; tell the user this path is broken (see "Recovering" below) and ask how to proceed |

### Creating a worktree

Use Bash — **never the `EnterWorktree` tool**:

```bash
git worktree add ./worktrees/<branch-name> -b <branch-name>
cd ./worktrees/<branch-name>
```

`EnterWorktree` hardcodes the base path to `.claude/worktrees/<random-slug>/`
and is blocked by a `PreToolUse` hook in `.claude/settings.json`. If the hook
ever misfires, refuse the tool anyway and use the Bash recipe above.

The `using-git-worktrees` skill follows this convention automatically.

### Recovering from a `.claude/worktrees/` worktree

If `pwd` is already inside `.claude/worktrees/<name>/`, do **not** write the
handoff there. Surface this to the user:

> "I'm in `.claude/worktrees/<name>/`, which triggers a permission prompt on
> every file write. Two options: (a) move it with
> `git worktree move .claude/worktrees/<name> worktrees/<branch>` then `cd`
> over and continue, or (b) leave the existing worktree alone and create a
> fresh one at `worktrees/<branch>` for the new work. Which do you prefer?"

Wait for the user's choice before writing.

## Process

### Step 1 — Auto-detect context

Run these commands and keep the output for the template:

```bash
git branch --show-current
git worktree list | grep "$(pwd)"
git status --porcelain | wc -l
git rev-list --count @{u}..HEAD 2>/dev/null || echo 0
git log -1 --pretty=format:"%h %s"
gh pr view --json number,state,url 2>/dev/null || true
```

Also scan `docs/superpowers/specs/` and `docs/superpowers/plans/` for recently-modified files whose slug matches the current branch or task (optional — include only if clearly relevant).

### Step 2 — Ask one question

> "Anything specific you want captured? (key decisions, gotchas, things you'll forget)"

Single prompt, no follow-up loop. The user can answer briefly or skip.

### Step 3 — Generate the document

Fill in this template. **Omit any section with no content** — keep the document scannable.

````markdown
# Handoff: <brief description>

**Date:** YYYY-MM-DD
**Branch:** <branch-name>
**Worktree:** worktrees/<name>
**Worktree path:** <absolute path>
**Git status:** clean | N uncommitted | N unpushed commits ahead of origin
**Last commit:** <sha> <subject>
**PR:** #NNN — open|merged|closed (omit if none)

## Resume command

```
/resync
cd worktrees/<name>
<next action — e.g., execute plan docs/…md, open PR, resume debugging>
```

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
- docs/superpowers/plans/YYYY-MM-DD-<topic>.md

## Key files

- src/…/foo.ts:42 — <what and why>

## Open questions / blockers

- [ ] <question>

## Next steps

1. [ ] <first action>
2. [ ] <second>

## Context to remember

<constraints, user preferences, domain knowledge not obvious from the code>
````

### Step 4 — Write the file

Save to `.claude/handoffs/YYYY-MM-DD-<brief-slug>.md`. Slug is 2–5 lowercase words joined by hyphens, matching the branch topic.

### Step 5 — Commit as a baby step

```bash
git add .claude/handoffs/YYYY-MM-DD-<slug>.md
git commit -m "docs(handoff): <brief description>"
```

### Step 6 — Print the resume hint

Tell the user, using the **absolute path** (run `pwd` if needed and join with the handoff filename — never print the repo-relative form):

> Saved handoff: `/absolute/path/to/.claude/handoffs/YYYY-MM-DD-<slug>.md` — paste that path in a new session to resume.

## Quality check (before writing)

Mental pass — no validation script:

1. Could a fresh Claude (or Cursor) pick up from this?
2. Are decisions traceable (the "why", not just the "what")?
3. Are next steps actionable and specific?
4. Are file paths anchored (`foo.ts:42`, not "that function")?

If any answer is "no", tighten the relevant section before saving.

## What to capture

### Always

- Decisions with reasoning — the "why"
- File paths touched, with intent
- Current progress — where we stopped
- Actionable next steps
- User context — constraints, preferences, domain knowledge

### When relevant

- Errors hit and how they resolved (or didn't)
- Dead ends — approaches tried that didn't work (saves re-exploration)

### Skip

- Verbose tool output
- Intermediate reasoning that reached conclusions
- Information obvious from the code
