# Claude Code Rules for BaseSkill

## Git Workflow

**Never commit directly to `master`.** All changes must be made on a branch via a git worktree.

### Worktree Setup

Always use a git worktree inside `./worktrees/` (relative to project root):

```bash
# Create a worktree for a feature branch
git worktree add ./worktrees/<branch-name> -b <branch-name>

# Install dependencies (each worktree has its own node_modules for isolation)
cd ./worktrees/<branch-name> && yarn install

# Remove when done (after merging)
git worktree remove ./worktrees/<branch-name>
```

Name branches after the milestone or feature, e.g. `milestone-3-app-shell`, `feat/profile-picker`.

### Rules

- `master` is protected — no direct commits, no direct file edits
- Every task starts with `git worktree add ./worktrees/<name>` from the project root
- PRs merge into `master`; worktrees are removed after merge

## Pre-push Quality Gate

A `.husky/pre-push` hook runs automatically on every `git push`. It enforces the
following checks in order:

1. Lint (ESLint + Knip) — `yarn lint`
2. TypeScript — `yarn typecheck`
3. Unit tests — `yarn test`
4. Storybook tests — `yarn test:storybook`
5. Visual regression tests — `yarn test:vr`
6. End-to-end tests — `yarn test:e2e`

**Agents must not commit or push unless all relevant checks pass**, or a check is
explicitly skipped with documented justification (see skip flags below).

### Skip Flags

Individual checks (or all checks) can be bypassed via environment variables:

- `SKIP_PREPUSH=1` — bypass every check entirely
- `SKIP_LINT=1` — skip ESLint + Knip
- `SKIP_TYPECHECK=1` — skip TypeScript typecheck
- `SKIP_UNIT=1` — skip Vitest unit tests
- `SKIP_STORYBOOK=1` — skip Storybook interaction tests
- `SKIP_VR=1` — skip visual regression tests
- `SKIP_E2E=1` — skip Playwright end-to-end tests

Example: `SKIP_E2E=1 SKIP_VR=1 git push`

When skipping a check, **always document the reason** in the commit message or PR
description (e.g. "SKIP_E2E=1 — E2E requires a running server, verified manually").

### Storybook Tests

Storybook tests require the dev server to be running on port 6006 before pushing:

```bash
# Option A — start manually, then push in a second terminal
yarn storybook

# Option B — let the hook start/stop the server automatically
START_STORYBOOK=1 git push

# Option C — skip storybook tests entirely
SKIP_STORYBOOK=1 git push
```

### Visual Regression Tests

VR tests use Docker to ensure screenshots match CI exactly (Linux/Chromium).

**Review workflow when UI changes:**

1. `yarn test:vr` — detects diffs, prints image paths on failure
2. Review diff images (Claude can read PNGs with the Read tool)
3. If change is intentional: `yarn test:vr:update` — updates baselines, then push
4. If change is unintentional: fix the bug, then push

**First-time setup:** baselines are auto-generated on first push if missing.

**Requires Docker running.** If Docker is not available, the VR check is skipped with a warning.

**Agent checklist when VR fails:**

- Read the diff PNG paths printed by the hook
- Compare with recent code changes — is this expected?
- If yes: run `yarn test:vr:update`, commit updated baselines, then push
- If no: investigate and fix before pushing
