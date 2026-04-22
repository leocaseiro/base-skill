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

## Commits (baby steps)

- After each **coherent** chunk of work (feature slice, bugfix + test, doc section, rule tweak), **commit** with a clear message. Do not wait until the end of a large task to make one giant commit.
- **Multiple commits in one PR are expected and preferred.** Reviewers can follow the story; you or the user can **cherry-pick** or **revert** a single commit without unpicking everything.
- If the user asks for “baby step” commits, treat that as the default for the rest of the branch.

## Where to look next

- [CLAUDE.md](./CLAUDE.md) — React/ESLint expectations, TDD, markdown, CI buckets, VR tests.
- `.cursor/rules/` — Cursor-specific always-on rules.
