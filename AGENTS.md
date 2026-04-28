# Agent instructions (BaseSkill)

This file is for **any** coding agent (Cursor, Claude Code, Copilot, etc.). Prefer it as the first stop for **process**; implementation detail lives in [CLAUDE.md](./CLAUDE.md).

## Git and worktrees (mandatory)

- Do **not** edit the codebase from the main repo checkout unless the user explicitly asks to work in the root tree (e.g. “skip worktree”, “patch main directly”).
- **Before the first file change in a session**, confirm the workspace path is under `worktrees/<task-name>/`. If it is not, create a worktree from `origin/master` and continue there:

  ```bash
  git fetch origin master
  git worktree add ./worktrees/<task-name> -b feat/<task-name> origin/master
  cd ./worktrees/<task-name>
  yarn install
  ```

- Never commit to `master`. Branch → PR → merge.
- Project rules also live in `.cursor/rules/` (see `git-workflow.mdc`); this file and those rules should agree.

## Before writing a plan

Plans are binding source of truth for executor agents. If a plan will create or modify any of the following, **invoke the corresponding project skill before prescribing code**, and let the skill override plan boilerplate:

| Plan touches                                 | Required skill                                       |
| -------------------------------------------- | ---------------------------------------------------- |
| `*.stories.tsx`                              | `write-storybook`                                    |
| `tests-vr/**`, `tests-e2e/**`, `*.e2e.ts`    | `write-e2e-vr-tests`                                 |
| `*.md` authored by an agent                  | Markdown Authoring rules in [CLAUDE.md](./CLAUDE.md) |
| Architecture docs (`*.mdx` under game state) | `update-architecture-docs`                           |

If a plan's code sample conflicts with a skill, flag it as a **Spec Delta** at the top of the plan and justify the deviation — don't silently ship boilerplate that contradicts project convention. Executors must load the corresponding skill into context when the plan prescribes matching files; if the plan and skill disagree and there is no Spec Delta, treat the skill as authoritative and flag the conflict before coding.

See [CLAUDE.md → Before writing a plan](./CLAUDE.md#before-writing-a-plan) for the canonical version.

## Commits (baby steps)

- After each **coherent** chunk of work (feature slice, bugfix + test, doc section, rule tweak), **commit** with a clear message. Do not wait until the end of a large task to make one giant commit.
- **Multiple commits in one PR are expected and preferred.** Reviewers can follow the story; you or the user can **cherry-pick** or **revert** a single commit without unpicking everything.
- If the user asks for “baby step” commits, treat that as the default for the rest of the branch.

## Where to look next

- [CLAUDE.md](./CLAUDE.md) — React/ESLint expectations, TDD, markdown, CI buckets, VR tests.
- `.cursor/rules/` — Cursor-specific always-on rules.
- [.claude/skills/handoff/SKILL.md](./.claude/skills/handoff/SKILL.md) — session handoff workflow (also available as `/handoff` or `/continue` in Claude Code, mirrored as `.cursor/rules/handoff.mdc` for Cursor).
