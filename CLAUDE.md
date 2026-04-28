# Claude Code Rules for BaseSkill

Agents using Cursor or other tools: read [AGENTS.md](./AGENTS.md) first for the mandatory worktree gate; this file is the full project handbook.

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
- **Baby-step commits:** When a slice of work is in good shape, commit it. **Multiple commits per PR are preferred** so reviewers can follow the history and you can cherry-pick or revert one change without undoing the rest. See [AGENTS.md](./AGENTS.md).
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

## Hook and CI Gating

Hooks and CI run **only the checks that the changed files can possibly affect**,
driven by `scripts/detect-buckets.mjs`. Full documentation:
`docs/superpowers/specs/2026-04-14-smart-pipelines-design.md`.

### Pre-commit (`.husky/pre-commit`)

1. `lint-staged` (per-file formatters/linters).
2. `yarn typecheck` — only if any staged file triggers the `typecheck` atomic
   check.

### Pre-push (`.husky/pre-push`)

Runs the pre-push phase of every atomic check whose globs match files changed
between `origin/master` and `HEAD`. Output begins with a `Triggered checks:`
summary.

| Phase       | Atomic checks that may run                                                    |
| ----------- | ----------------------------------------------------------------------------- |
| pre-commit  | prettier, eslint, stylelint, markdownlint (via lint-staged), typecheck        |
| pre-push    | + actionlint, shellcheck, knip, unit (`vitest related`)                       |
| PR CI       | + storybook, VR, e2e, build                                                   |
| master push | full suite (every check, ignoring the glob filter) — safety net before deploy |

### Skip Flags (unchanged API)

- `SKIP_PREPUSH=1` — bypass pre-commit **and** pre-push entirely
- `SKIP_LINT=1` — skip prettier/eslint/stylelint/markdownlint/actionlint/shellcheck/knip
- `SKIP_TYPECHECK=1` — skip TypeScript typecheck
- `SKIP_UNIT=1` — skip Vitest unit tests
- `SKIP_STORYBOOK=1` — skip Storybook (not run by default on pre-push)
- `SKIP_VR=1` — skip visual regression (not run by default on pre-push)
- `SKIP_E2E=1` — skip Playwright e2e (not run by default on pre-push)

Example: `SKIP_E2E=1 SKIP_VR=1 git push`

When skipping a check, **always document the reason** in the commit message or
PR description (e.g. "SKIP_E2E=1 — E2E requires a running server, verified
manually").

### Branch Protection

Required status checks on `master`: `Lint`, `Type Check`, `Unit Tests`,
`Storybook Tests`, `Build`, `E2E — chromium`. The consolidated `Lint` job
runs prettier, eslint, stylelint, markdownlint, actionlint, shellcheck,
and knip as internal steps — each step is individually gated by its
detect-changes bucket, so unaffected linters are skipped while still
sharing one install. Conditionally-skipped jobs exit 0 early → GitHub
shows them green.

### Visual Regression Tests

VR tests use Docker to ensure screenshots match CI exactly (Linux/Chromium).

**Review workflow when UI changes:**

1. `yarn test:vr` — detects diffs, prints image paths on failure
2. Review diff images (Claude can read PNGs with the Read tool)
3. If change is intentional: `yarn test:vr:update` — updates baselines, then
   push
4. If change is unintentional: fix the bug, then push

**Requires Docker running.** If Docker is not available, the VR check is skipped
with a warning.

## MCP Servers

The committed `.mcp.json` only includes servers that work out of the box. Extras
that depend on a local service live in `.mcp.local.json` (gitignored) so each
developer can opt in.

### Storybook MCP (optional)

The Storybook MCP connects to `http://localhost:6006/mcp` and only works while
`yarn storybook` is running. If you want it, create `.mcp.local.json` in the
repo root:

```json
{
  "mcpServers": {
    "storybook": {
      "url": "http://localhost:6006/mcp"
    }
  }
}
```

Then start Storybook in a separate terminal before your Claude session:

```bash
yarn storybook
```

Without the dev server running the MCP will fail to connect on session start —
this is why it is not in the committed config.

## Architecture Documentation

When modifying game state logic — any file in `src/components/answer-game/`,
`src/lib/game-engine/`, or any file matching `*reducer*`, `*dispatch*`,
`*Behavior*`, `*Drag*` — update the co-located `.mdx` docs in the same PR.

Run `/update-architecture-docs` to get guided prompts for what sections need updating.
