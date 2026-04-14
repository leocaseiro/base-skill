# Claude Code Rules for BaseSkill

## React Best Practices

Analyse the [eslint.config.js](./eslint.config.js) to decide what approach to write the code. For example we don't use functions, but const(react/function-component-definition)

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
- Every task starts with `git worktree add ./worktrees/<name>` from the project root — **this includes writing docs, specs, and plans**
- PRs merge into `master`; worktrees are removed after merge

> **Why this matters for docs/specs/plans:** Planning files committed directly to master bypass the PR review process. Even non-code changes belong on a branch so they can be reviewed, revised, and merged cleanly.

## Markdown Authoring

Any `.md` file written or edited by an agent (plans, specs, docs, READMEs) **must pass
both markdownlint and Prettier** before committing. The project enforces this in CI via
`npx prettier --check .` and `yarn lint:md`.

### Fix command

After writing or editing a markdown file, run:

```bash
yarn fix:md
```

This runs `markdownlint-cli2 --fix` followed by `prettier --write` and corrects the
most common issues automatically.

### Rules in effect

Config lives in `.markdownlint.yaml`. Most default rules are active; key disabled ones:

- `MD013` (line length) — disabled, Prettier handles wrapping
- `MD033` (inline HTML) — disabled
- `MD041` (first line heading) — disabled

### Common issues to avoid

- Blank line required before and after fenced code blocks
- Blank line required before and after lists
- Blank line required before and after headings
- No trailing spaces
- No multiple consecutive blank lines

### Workflow

1. Write the markdown file
2. Run `yarn fix:md` — auto-fixes most issues
3. If any violations remain, fix them manually
4. Commit

**Never commit a markdown file that fails `yarn lint:md` or `npx prettier --check`.**

## Test-Driven Development

Every bug fix and every new feature **must** follow the red-green-refactor cycle.

### Bug fixes

1. Write a failing test that reproduces the bug **before** touching production code
2. Confirm the test fails for the right reason (missing behaviour, not a syntax error)
3. Apply the minimal fix
4. Confirm the test goes green and no other tests regress
5. **Never open a bug-fix PR without a regression test** — a fix without a test gives no
   proof it caught the bug and no protection against future regressions

### Features

Use the `superpowers:test-driven-development` skill at the start of every feature
branch. Write tests first; implement only enough code to make them pass.

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

## Architecture Documentation

When modifying game state logic — any file in `src/components/answer-game/`,
`src/lib/game-engine/`, or any file matching `*reducer*`, `*dispatch*`,
`*Behavior*`, `*Drag*` — update the co-located `.mdx` docs in the same PR.

Run `/update-architecture-docs` to get guided prompts for what sections need updating.
