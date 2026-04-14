# Smart pipelines — change-aware hooks and CI

**Date:** 2026-04-14
**Status:** Draft

## Problem

Every commit, push, and PR runs the full quality gate (lint, typecheck, unit, storybook, VR, e2e, build) regardless of what changed. A README typo triggers the same 6-check gauntlet as a `src/components` refactor. This wastes developer time locally and CI minutes in GitHub Actions.

## Goal

Run only the checks that a given change can possibly affect. Keep a safety net at merge and deploy time so nothing slips through.

## Non-goals

- Removing any existing check.
- Changing what the individual checks do (eslint rules, VR thresholds, etc.).
- Rewriting `.lintstagedrc.mjs` — its per-file behaviour is already change-aware and correct.

## Design

### 1. Atomic checks, each with its own trigger globs

Rather than bucketing files into coarse categories ("docs", "src"), every check has its own glob. A check runs iff some changed file matches its glob **and** the current phase allows it.

| Check            | Trigger globs                                                                         |
| ---------------- | ------------------------------------------------------------------------------------- |
| **prettier**     | `**/*.{md,mdx,json,ts,tsx,js,css,yml,yaml}`                                           |
| **eslint**       | `**/*.{ts,tsx,js,mjs,cjs}`                                                            |
| **stylelint**    | `src/**/*.css`                                                                        |
| **markdownlint** | `**/*.md` (not `.mdx` — the parser misreads JSX as MD037)                             |
| **actionlint**   | `.github/workflows/**`                                                                |
| **shellcheck**   | `**/*.sh`, `.husky/pre-commit`, `.husky/pre-push`, `.husky/post-merge`                |
| **knip**         | `**/*.{ts,tsx,js,mjs,cjs}`, `package.json`                                            |
| **typecheck**    | `**/*.{ts,tsx}`, `tsconfig*.json`                                                     |
| **unit**         | `src/**`, `**/*.{test,spec}.*`, `vitest.config.*`, `package.json`, `tsconfig*.json`   |
| **storybook**    | `**/*.stories.*`, `src/**/*.{ts,tsx,css}`, `.storybook/**`, `package.json`            |
| **VR**           | `**/*.stories.*`, `src/**/*.{ts,tsx,css}`, `public/**`, `e2e/**`                      |
| **e2e**          | `e2e/**`, `src/**`, `public/**`, `playwright.config.*`                                |
| **build**        | `src/**`, `public/**`, `vite.config.*`, `tsconfig*.json`, `package.json`, `yarn.lock` |

Union semantics: a PR touching multiple file types runs the union of the triggered checks.

### 2. Phase progression

Each phase runs a subset of the triggered checks. Later phases add to earlier phases.

| Check        | pre-commit (staged) |   pre-push    |         PR CI          | master push |
| ------------ | :-----------------: | :-----------: | :--------------------: | :---------: |
| prettier     |       ✓ (fix)       |   ✓ (check)   |           ✓            |      ✓      |
| eslint       |       ✓ (fix)       |       ✓       |           ✓            |      ✓      |
| stylelint    |       ✓ (fix)       |       ✓       |           ✓            |      ✓      |
| markdownlint |       ✓ (fix)       |       ✓       |           ✓            |      ✓      |
| actionlint   |          —          |       ✓       |           ✓            |      ✓      |
| shellcheck   |          —          |       ✓       |           ✓            |      ✓      |
| knip         |          —          |       ✓       |           ✓            |      ✓      |
| typecheck    |          ✓          |       ✓       |           ✓            |      ✓      |
| unit         |          —          | ✓ (`related`) |        ✓ (full)        |      ✓      |
| storybook    |          —          |       —       |           ✓            |      ✓      |
| VR           |          —          |       —       |           ✓            |      ✓      |
| e2e          |          —          |       —       | ✓ (required for merge) |      —      |
| build        |          —          |       —       |           ✓            |      ✓      |

**master push** column ignores the trigger globs — it always runs everything in its column as a safety net before deploy. **e2e is PR-only**: once a PR passes e2e and merges, re-running on master is redundant (the head is the same).

#### Reading the matrix — worked examples

- Edit only `README.md` → prettier + markdownlint at every phase. Nothing else.
- Edit only `Button.css` → pre-commit: prettier + stylelint. CI: + storybook + VR. Nothing else.
- Edit `.github/workflows/ci.yml` → prettier (pre-commit) + actionlint (pre-push/CI). No tests.
- Edit `Button.tsx` → pre-commit: prettier + eslint + typecheck. Pre-push: + vitest related + knip. CI: + unit (full) + storybook + VR + e2e + build.
- Edit `Button.test.tsx` → same as `Button.tsx` (globs union).

### 3. Single source of truth: `scripts/detect-buckets.mjs`

One file. Pure function plus CLI modes. Hooks and CI both consume it.

```js
export const TRIGGERS = {
  prettier: ['**/*.{md,mdx,json,ts,tsx,js,css,yml,yaml}'],
  eslint: ['**/*.{ts,tsx,js,mjs,cjs}'],
  stylelint: ['src/**/*.css'],
  markdownlint: ['**/*.md'],
  actionlint: ['.github/workflows/**'],
  shellcheck: [
    '**/*.sh',
    '.husky/pre-commit',
    '.husky/pre-push',
    '.husky/post-merge',
  ],
  knip: ['**/*.{ts,tsx,js,mjs,cjs}', 'package.json'],
  typecheck: ['**/*.{ts,tsx}', 'tsconfig*.json'],
  unit: ['src/**', '**/*.{test,spec}.*', 'vitest.config.*'],
  storybook: [
    '**/*.stories.*',
    'src/**/*.{ts,tsx,css}',
    '.storybook/**',
  ],
  vr: [
    '**/*.stories.*',
    'src/**/*.{ts,tsx,css}',
    'public/**',
    'e2e/**',
  ],
  e2e: ['e2e/**', 'src/**', 'public/**', 'playwright.config.*'],
  build: [
    'src/**',
    'public/**',
    'vite.config.*',
    'tsconfig*.json',
    'package.json',
    'yarn.lock',
  ],
};

// Pure — easily unit-tested
export const detectChecks = (files) => {
  /* globs → Set<check> */
};
```

#### CLI modes

```bash
# Hooks — space-separated check names to stdout
node scripts/detect-buckets.mjs --base=origin/master
# -> prettier eslint typecheck unit

node scripts/detect-buckets.mjs --staged
# -> prettier eslint stylelint typecheck

# CI — key=value to $GITHUB_OUTPUT
node scripts/detect-buckets.mjs --base=${{ github.event.pull_request.base.sha }} --github-output

# Force-all — master push safety net
node scripts/detect-buckets.mjs --force-all --github-output

# Debug
node scripts/detect-buckets.mjs --base=origin/master --verbose
```

**Phase gating lives in the caller, not the script.** The script answers "which checks are needed given these changes?". Each caller decides whether its phase is allowed to run them.

#### Fallbacks

- Can't resolve base ref → warn to stderr, output every check (safe default).
- No changed files but invoked anyway → empty output. Hooks treat as no-op; CI treats as "skip everything" (acceptable — nothing in the PR justifies any check).

### 4. Hooks

#### `.husky/pre-commit`

1. `npx lint-staged` (unchanged — per-file via `.lintstagedrc.mjs`).
2. `checks=$(node scripts/detect-buckets.mjs --staged)` — compute allowed checks for this phase.
3. If `typecheck` in `$checks`: `yarn typecheck`.
4. Existing `yarn test` line removed — unit tests move to pre-push (`vitest related`) per the matrix.

#### `.husky/pre-push`

1. Keep global `SKIP_PREPUSH=1` escape hatch (unchanged).
2. `checks=$(node scripts/detect-buckets.mjs --base=origin/master)`.
3. Print: `Changed checks: prettier eslint typecheck unit`.
4. For each check in `$checks` that's allowed in the pre-push phase, run its command (unless the matching `SKIP_*` flag is set).
5. Phase mapping (pre-push column of the matrix): prettier (check), eslint, stylelint, markdownlint, actionlint, shellcheck, knip, typecheck, unit (`vitest related` against the pushed diff).
6. Fallback: unresolved `origin/master` → warn and run every pre-push check.

### 5. CI workflows

All change-filtered workflows gain a top-level `detect-changes` job that emits one output per check. Each downstream job depends on it and exits early if its output is `false`.

```yaml
detect-changes:
  runs-on: ubuntu-latest
  outputs:
    prettier: ${{ steps.filter.outputs.prettier }}
    eslint: ${{ steps.filter.outputs.eslint }}
    # ... one per check
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with: { node-version-file: '.nvmrc', cache: yarn }
    - run: yarn install --frozen-lockfile
    - id: filter
      run: node scripts/detect-buckets.mjs --base=${{ github.event.pull_request.base.sha || github.event.before }} --github-output
```

On master push, `detect-buckets.mjs --force-all` is used instead, so every job runs.

#### `ci.yml` (single file — ~350–400 lines projected)

- Split the current monolithic `lint` job into 7 parallel jobs: `prettier`, `eslint`, `stylelint`, `markdownlint`, `actionlint`, `shellcheck`, `knip`. Each job:
  1. `needs: detect-changes`.
  2. First step: if `needs.detect-changes.outputs.<check> != 'true'` → echo "Skipped" + `exit 0`.
  3. Subsequent steps: checkout, setup-node, install, run the one check.
- Same pattern applied to `typecheck`, `unit-test`, `build`, `storybook-test` jobs (already separate).
- Add a master-push full-suite pathway inline (same file) — triggered by `push: branches: [master]` with `--force-all` feeding detect-changes. Reuses the same jobs.

#### `e2e.yml`

- Add `detect-changes`. Gate `e2e` job behind `outputs.e2e`.
- Remove `push: branches: [master]` trigger (PR-only per the matrix). Keep weekly cron + `workflow_dispatch`.

#### `visual-regression.yml`

- Add `detect-changes`. Gate `visual-regression` job behind `outputs.vr`.

#### `pr-preview.yml`

- Gate behind `outputs.build`. Docs/workflow-only PRs skip preview deployment.

#### `deploy.yml`

- Unchanged. Fires on PR merge to master; every required check already passed on the PR (including e2e).

### 6. Branch protection

Required status checks on `master` (names match CI job names):

- `prettier`, `eslint`, `stylelint`, `markdownlint`, `actionlint`, `shellcheck`, `knip`
- `typecheck`, `unit`, `storybook`, `vr`, `e2e`, `build`

Every required job always starts (satisfying branch protection) but exits 0 early if its detect-changes output is `false`. GitHub sees the check pass either way. No workflow-level `if:` on the whole job — that would show the check as "skipped" and could block merge depending on the branch protection config.

### 7. Testing

`scripts/detect-buckets.test.mjs` (vitest). TDD per CLAUDE.md — write the tests first.

Coverage:

- Positive case per check (matching file → check present).
- Negative case per check (non-matching file → check absent).
- mdx skips markdownlint but still triggers prettier.
- Union semantics across multiple triggers.
- `--force-all` returns every check regardless of input.
- Empty input → empty set.
- Git-diff integration: mock `child_process.execFileSync`.

## Rollout

Single PR. The work is self-contained: new script, new tests, hook edits, workflow edits. No data migration, no feature-flagging.

Rollback: revert the PR — hooks and workflows go back to running every check.

## Risks and mitigations

| Risk                                                                                       | Mitigation                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glob table drifts — a new file type lands without a matching entry and escapes all checks. | `build` trigger catches `src/**` and `public/**`; CI still runs build on any `src` change. New config files should be added to `config`-type globs. Include a "checklist item" in the repo's CONTRIBUTING. |
| `detect-changes` job itself breaks and emits nothing — all checks skip.                    | If `detect-buckets.mjs` exits non-zero, the detect job fails; GitHub blocks downstream jobs, which read as "not started" → branch protection blocks the merge. Fail-safe.                                  |
| Unrelated regressions merged because e2e didn't run on a narrow PR.                        | e2e's trigger glob is broad (`src/**`, `public/**`, `e2e/**`, `playwright.config.*`) — almost every behavioural change triggers it. Pure docs/config PRs skipping e2e is the intended behaviour.           |
| Local hooks run slower due to extra script invocation.                                     | `detect-buckets.mjs` is pure Node, reads `git diff --name-only` once. Total overhead <100 ms.                                                                                                              |
| Bugs in the glob logic misclassify files.                                                  | Unit tests per check cover positive + negative cases. The script is the linchpin — tests gate the PR.                                                                                                      |

## Open questions

None — all design decisions made during brainstorming.

## Out of scope

- Caching CI `node_modules` across jobs beyond what `actions/setup-node` already provides.
- Rewriting VR / e2e infra (Docker, Playwright projects).
- Changing deploy gating.
- Converting mdx to something markdownlint can parse.
