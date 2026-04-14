# Smart Pipelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route hooks and CI to only run the checks the changed files can possibly affect, with a master-push safety net.

**Architecture:** One pure Node script (`scripts/detect-buckets.mjs`) is the single source of truth mapping changed files → atomic checks. Hooks call it for phase-gated execution; CI workflows call it in a `detect-changes` job whose outputs gate every other job. Master pushes use `--force-all` for a full safety-net run.

**Tech Stack:** Node 22 (ESM), `picomatch` for globs, Vitest for unit tests, GitHub Actions, Husky v9 hooks (bash), `actionlint` + `shellcheck` binaries for workflow/shell linting.

**Spec:** [`docs/superpowers/specs/2026-04-14-smart-pipelines-design.md`](../specs/2026-04-14-smart-pipelines-design.md)

---

## File Structure

**New files:**

- `scripts/detect-buckets.mjs` — pure `detectChecks(files)` + CLI entry (`--staged`, `--base`, `--force-all`, `--github-output`, `--verbose`, `--files`).
- `scripts/detect-buckets.test.mjs` — Vitest unit tests for the pure function and CLI file-list path.

**Modified files:**

- `.husky/pre-commit` — run lint-staged, then typecheck iff staged files trigger it.
- `.husky/pre-push` — phase-gated check runner driven by the script.
- `.github/workflows/ci.yml` — add `detect-changes` job; split current `lint` job into seven parallel jobs; gate every job on its corresponding output; add `push: branches: [master]` trigger path that uses `--force-all`.
- `.github/workflows/e2e.yml` — add `detect-changes`; remove `push: branches: [master]` trigger; gate `e2e` job on `outputs.e2e`.
- `.github/workflows/visual-regression.yml` — add `detect-changes`; gate on `outputs.vr`.
- `.github/workflows/pr-preview.yml` — add `detect-changes`; gate `deploy-preview` on `outputs.build`.
- `package.json` — add `picomatch` direct dependency; add `lint:actions`, `lint:shell` scripts.
- `CLAUDE.md` — rewrite the "Pre-push Quality Gate" section to describe phase-gated behaviour.

---

## Task 1: Scaffold detect-buckets module and tests (TDD)

**Files:**

- Create: `scripts/detect-buckets.mjs`
- Create: `scripts/detect-buckets.test.mjs`
- Modify: `package.json` (add `picomatch` dep)

- [ ] **Step 1: Add `picomatch` as a direct dependency**

```bash
yarn add -D picomatch@^4.0.0
```

- [ ] **Step 2: Create the failing test file**

Create `scripts/detect-buckets.test.mjs` with the full test suite up front (these tests stay failing through Task 3 and pass at the end of Task 3).

```js
import { describe, it, expect } from 'vitest';
import {
  detectChecks,
  TRIGGERS,
  ALL_CHECKS,
} from './detect-buckets.mjs';

describe('TRIGGERS', () => {
  it('exposes every atomic check', () => {
    expect([...ALL_CHECKS].sort()).toEqual(
      [
        'actionlint',
        'build',
        'e2e',
        'eslint',
        'knip',
        'markdownlint',
        'prettier',
        'shellcheck',
        'storybook',
        'stylelint',
        'typecheck',
        'unit',
        'vr',
      ].sort(),
    );
  });
});

describe('detectChecks — positive cases', () => {
  const cases = [
    ['README.md', ['prettier', 'markdownlint']],
    ['docs/foo.md', ['prettier', 'markdownlint']],
    ['docs/foo.mdx', ['prettier']], // mdx excluded from markdownlint
    [
      'src/components/Button.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/lib/game-engine/reducer.ts',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/components/Button.css',
      ['stylelint', 'storybook', 'vr', 'e2e', 'build'],
    ],
    [
      'src/components/Button.stories.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/components/Button.test.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'e2e/landing.spec.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'vr', 'e2e'],
    ],
    ['public/favicon.svg', ['vr', 'e2e', 'build']],
    ['.github/workflows/ci.yml', ['prettier', 'actionlint']],
    ['.husky/pre-push', ['shellcheck']],
    ['scripts/foo.sh', ['shellcheck']],
    [
      'package.json',
      ['prettier', 'knip', 'unit', 'storybook', 'build'],
    ],
    ['yarn.lock', ['build']],
    ['tsconfig.json', ['prettier', 'typecheck', 'unit', 'build']],
    [
      'vite.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'build'],
    ],
    [
      'vitest.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'unit'],
    ],
    [
      'playwright.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'e2e'],
    ],
    [
      '.storybook/main.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'storybook'],
    ],
  ];

  it.each(cases)('%s triggers %j', (file, expected) => {
    const result = detectChecks([file]);
    expect([...result].sort()).toEqual([...expected].sort());
  });
});

describe('detectChecks — union semantics', () => {
  it('multi-file input unions the triggers', () => {
    const result = detectChecks([
      'README.md',
      'src/components/Button.css',
    ]);
    expect(result).toContain('markdownlint');
    expect(result).toContain('stylelint');
    expect(result).toContain('vr');
  });
});

describe('detectChecks — negative cases', () => {
  it('unknown file extension triggers nothing', () => {
    expect([...detectChecks(['something.unknown'])]).toEqual([]);
  });

  it('empty input returns empty set', () => {
    expect([...detectChecks([])]).toEqual([]);
  });

  it('README.md does not trigger stylelint or unit', () => {
    const result = detectChecks(['README.md']);
    expect(result).not.toContain('stylelint');
    expect(result).not.toContain('unit');
    expect(result).not.toContain('typecheck');
  });

  it('mdx file does not trigger markdownlint', () => {
    const result = detectChecks(['src/components/Foo.stories.mdx']);
    expect(result).not.toContain('markdownlint');
    expect(result).toContain('prettier');
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
yarn vitest run scripts/detect-buckets.test.mjs
```

Expected: fails with `Cannot find module './detect-buckets.mjs'`.

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock scripts/detect-buckets.test.mjs
git commit -m "test(detect-buckets): add failing spec for atomic-check detection"
```

---

## Task 2: Implement `detectChecks` pure function

**Files:**

- Create: `scripts/detect-buckets.mjs`

- [ ] **Step 1: Write the minimal module**

```js
// scripts/detect-buckets.mjs
import picomatch from 'picomatch';

export const TRIGGERS = {
  prettier: ['**/*.{md,mdx,json,ts,tsx,js,mjs,cjs,css,yml,yaml}'],
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
  unit: [
    'src/**',
    '**/*.{test,spec}.{ts,tsx,js,mjs}',
    'vitest.config.*',
    'package.json',
    'tsconfig*.json',
  ],
  storybook: [
    '**/*.stories.*',
    'src/**/*.{ts,tsx,css}',
    '.storybook/**',
    'package.json',
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

export const ALL_CHECKS = new Set(Object.keys(TRIGGERS));

const COMPILED = Object.fromEntries(
  Object.entries(TRIGGERS).map(([check, globs]) => [
    check,
    picomatch(globs, { dot: true }),
  ]),
);

export const detectChecks = (files) => {
  const result = new Set();
  for (const file of files) {
    for (const check of ALL_CHECKS) {
      if (result.has(check)) continue;
      if (COMPILED[check](file)) {
        // mdx carve-out: markdownlint does not run on .mdx
        if (check === 'markdownlint' && file.endsWith('.mdx')) continue;
        result.add(check);
      }
    }
  }
  return result;
};
```

- [ ] **Step 2: Run the tests**

```bash
yarn vitest run scripts/detect-buckets.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/detect-buckets.mjs
git commit -m "feat(detect-buckets): pure detectChecks() mapping files to atomic checks"
```

---

## Task 3: Add CLI entry point + git-diff integration

**Files:**

- Modify: `scripts/detect-buckets.mjs`
- Modify: `scripts/detect-buckets.test.mjs` (add CLI-path tests)

- [ ] **Step 1: Append CLI tests to the test file**

Append to `scripts/detect-buckets.test.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SCRIPT = fileURLToPath(
  new URL('./detect-buckets.mjs', import.meta.url),
);

const runCli = (args) =>
  execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' }).trim();

describe('CLI — --files mode', () => {
  it('prints space-separated checks for an explicit file list', () => {
    const out = runCli(['--files', 'README.md']);
    expect(out.split(/\s+/).sort()).toEqual([
      'markdownlint',
      'prettier',
    ]);
  });

  it('--force-all emits every check', () => {
    const out = runCli(['--force-all']);
    const checks = out.split(/\s+/).sort();
    expect(checks).toContain('e2e');
    expect(checks).toContain('build');
    expect(checks).toContain('prettier');
    expect(checks.length).toBe(13);
  });

  it('empty --files input prints empty line', () => {
    const out = runCli(['--files']);
    expect(out).toBe('');
  });

  it('--github-output writes key=value to the file in $GITHUB_OUTPUT', () => {
    const outPath = path.join(
      process.env.RUNNER_TEMP || '/tmp',
      `detect-buckets-test-${process.pid}.txt`,
    );
    execFileSync('node', [SCRIPT, '--force-all', '--github-output'], {
      env: { ...process.env, GITHUB_OUTPUT: outPath },
      encoding: 'utf8',
    });
    const contents = require('node:fs').readFileSync(outPath, 'utf8');
    expect(contents).toMatch(/^prettier=true$/m);
    expect(contents).toMatch(/^e2e=true$/m);
    expect(contents).toMatch(/^build=true$/m);
  });
});
```

- [ ] **Step 2: Append CLI code to the script**

Append to `scripts/detect-buckets.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const parseArgs = (argv) => {
  const args = {
    staged: false,
    base: null,
    forceAll: false,
    githubOutput: false,
    verbose: false,
    files: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--staged') args.staged = true;
    else if (arg === '--force-all') args.forceAll = true;
    else if (arg === '--github-output') args.githubOutput = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg.startsWith('--base='))
      args.base = arg.slice('--base='.length);
    else if (arg === '--files') {
      args.files = argv.slice(i + 1);
      break;
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(
        [
          'Usage: detect-buckets.mjs [options]',
          '  --staged                use git staged files',
          '  --base=REF              diff against REF (merge-base)',
          '  --force-all             ignore diff, return every check',
          '  --github-output         write key=value to $GITHUB_OUTPUT',
          '  --verbose               print matching details to stderr',
          '  --files F1 F2 ...       explicit file list',
          '',
        ].join('\n'),
      );
      process.exit(0);
    }
  }
  return args;
};

const gitFiles = ({ staged, base }) => {
  if (staged) {
    const out = execFileSync(
      'git',
      ['diff', '--name-only', '--cached'],
      {
        encoding: 'utf8',
      },
    );
    return out.split('\n').filter(Boolean);
  }
  if (base) {
    // merge-base diff: what this branch changed vs the base
    let mergeBase;
    try {
      mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], {
        encoding: 'utf8',
      }).trim();
    } catch {
      process.stderr.write(
        `detect-buckets: could not resolve base "${base}", assuming all checks\n`,
      );
      return null; // signal: run everything
    }
    const out = execFileSync(
      'git',
      ['diff', '--name-only', `${mergeBase}..HEAD`],
      { encoding: 'utf8' },
    );
    return out.split('\n').filter(Boolean);
  }
  return [];
};

const writeGithubOutput = (checks) => {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) {
    process.stderr.write(
      'detect-buckets: --github-output given but $GITHUB_OUTPUT unset\n',
    );
    process.exit(2);
  }
  const lines = [...ALL_CHECKS]
    .map((check) => `${check}=${checks.has(check) ? 'true' : 'false'}`)
    .join('\n');
  appendFileSync(outPath, `${lines}\n`);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  let files;
  if (args.forceAll) {
    const checks = new Set(ALL_CHECKS);
    if (args.githubOutput) writeGithubOutput(checks);
    else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
    return;
  }
  if (args.files) {
    files = args.files;
  } else {
    const fromGit = gitFiles({ staged: args.staged, base: args.base });
    if (fromGit === null) {
      // base unresolved — safe default: run everything
      const checks = new Set(ALL_CHECKS);
      if (args.githubOutput) writeGithubOutput(checks);
      else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
      return;
    }
    files = fromGit;
  }
  if (args.verbose) {
    process.stderr.write(
      `detect-buckets: ${files.length} changed files\n`,
    );
    for (const f of files) process.stderr.write(`  ${f}\n`);
  }
  const checks = detectChecks(files);
  if (args.githubOutput) writeGithubOutput(checks);
  else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 3: Run the full test suite**

```bash
yarn vitest run scripts/detect-buckets.test.mjs
```

Expected: all tests pass (both pure-function and CLI).

- [ ] **Step 4: Manual smoke test**

```bash
node scripts/detect-buckets.mjs --files README.md
# Expected: "markdownlint prettier"

node scripts/detect-buckets.mjs --force-all
# Expected: all 13 checks

node scripts/detect-buckets.mjs --files src/components/Button.tsx
# Expected: build e2e eslint knip prettier storybook typecheck unit vr
```

- [ ] **Step 5: Commit**

```bash
git add scripts/detect-buckets.mjs scripts/detect-buckets.test.mjs
git commit -m "feat(detect-buckets): add CLI entry with git-diff, --force-all, --github-output"
```

---

## Task 4: Add `lint:actions` and `lint:shell` scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add npm scripts**

Edit `package.json`, add to the `scripts` object:

```json
{
  "scripts": {
    "lint:actions": "actionlint",
    "lint:shell": "shellcheck .husky/pre-commit .husky/pre-push .husky/post-merge scripts/*.sh 2>/dev/null || true"
  }
}
```

`actionlint` runs via `npx` in CI (or install manually locally with `brew install actionlint`). `shellcheck` installs via `brew install shellcheck` locally; CI uses the `shellcheck` apt package. The `|| true` for shellcheck swallows the error when `scripts/*.sh` glob has no matches — shellcheck exits non-zero on unknown files.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore(scripts): add lint:actions and lint:shell npm scripts"
```

---

## Task 5: Rewrite `.husky/pre-commit`

**Files:**

- Modify: `.husky/pre-commit`

- [ ] **Step 1: Replace contents**

```sh
#!/usr/bin/env sh
# .husky/pre-commit
# 1. lint-staged handles per-file formatters/linters (eslint, stylelint,
#    markdownlint, prettier) based on staged extensions.
# 2. If any staged file triggers `typecheck`, run `yarn typecheck`.
# Respects SKIP_PREPUSH=1 for parity with pre-push.

if [ "${SKIP_PREPUSH:-0}" = "1" ]; then
  echo "  ⚠ pre-commit (skipped — SKIP_PREPUSH=1)"
  exit 0
fi

set -e

npx lint-staged

CHECKS=$(node scripts/detect-buckets.mjs --staged)

case " $CHECKS " in
  *" typecheck "*)
    if [ "${SKIP_TYPECHECK:-0}" = "1" ]; then
      echo "  ⚠ typecheck (skipped — SKIP_TYPECHECK=1)"
    else
      echo "▶ typecheck (staged ts/tsx files detected)"
      yarn typecheck
    fi
    ;;
  *)
    echo "  (no typecheck-relevant files staged)"
    ;;
esac
```

- [ ] **Step 2: Ensure the hook is executable**

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 3: Smoke test — staged markdown should not trigger typecheck**

```bash
echo "# test" > /tmp/_pc_test.md && cp /tmp/_pc_test.md .
git add _pc_test.md
git -c core.hooksPath=.husky commit -m "test" --dry-run --verbose
# Observe: "(no typecheck-relevant files staged)"
git reset HEAD _pc_test.md && rm _pc_test.md
```

- [ ] **Step 4: Smoke test — staged ts file should trigger typecheck**

```bash
echo "export const x = 1;" > /tmp/_pc_test.ts && cp /tmp/_pc_test.ts src/
git add src/_pc_test.ts
git -c core.hooksPath=.husky commit -m "test" --dry-run --verbose
# Observe: "▶ typecheck (staged ts/tsx files detected)"
git reset HEAD src/_pc_test.ts && rm src/_pc_test.ts
```

- [ ] **Step 5: Commit**

```bash
git add .husky/pre-commit
git commit -m "feat(hooks): pre-commit runs typecheck only when staged files need it"
```

---

## Task 6: Rewrite `.husky/pre-push`

**Files:**

- Modify: `.husky/pre-push`

- [ ] **Step 1: Replace contents**

```sh
#!/usr/bin/env bash
# .husky/pre-push — phase-gated quality gate.
#
# Runs each check only when changed files between origin/master and HEAD
# trigger it (see scripts/detect-buckets.mjs).
#
# Skip env vars (unchanged API):
#   SKIP_PREPUSH=1          bypass every check
#   SKIP_LINT=1             skip prettier/eslint/stylelint/markdownlint/knip
#   SKIP_TYPECHECK=1        skip typecheck
#   SKIP_UNIT=1             skip unit tests
#   SKIP_STORYBOOK=1        skip storybook (not run by default on pre-push)
#   SKIP_VR=1               skip visual regression (not run by default on pre-push)
#   SKIP_E2E=1              skip e2e (not run by default on pre-push)

if [ "${SKIP_PREPUSH:-0}" = "1" ]; then
  echo "  ⚠ All pre-push checks (skipped — SKIP_PREPUSH=1)"
  exit 0
fi

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'
pass()   { echo -e "${GREEN}  ✓ ${1}${RESET}"; }
fail()   { echo -e "${RED}  ✗ ${1}${RESET}"; }
skip()   { echo -e "${YELLOW}  ⚠ ${1} (skipped)${RESET}"; }
info()   { echo -e "${CYAN}${BOLD}▶ ${1}${RESET}"; }
divider(){ echo -e "${BOLD}──────────────────────────────────────────${RESET}"; }

divider
echo -e "${BOLD}  Pre-push checks${RESET}"
divider

CHECKS=$(node scripts/detect-buckets.mjs --base=origin/master)
echo -e "${CYAN}  Triggered checks: ${CHECKS:-<none>}${RESET}"
divider

FAILED=0

# has_check "name"
has_check() {
  case " $CHECKS " in *" $1 "*) return 0 ;; *) return 1 ;; esac
}

# run_if_triggered "label" "check-name" "skip-var" "command"
run_if_triggered() {
  local label="$1" check="$2" skip_var="$3" cmd="$4"
  if ! has_check "$check"; then
    return
  fi
  if [ "${!skip_var:-0}" = "1" ]; then
    skip "$label"
    return
  fi
  info "Running: $label"
  if eval "$cmd"; then
    pass "$label"
  else
    fail "$label"
    FAILED=1
  fi
}

# Phase: pre-push runs every lint-like check + typecheck + unit (related).
run_if_triggered "Prettier"      "prettier"     "SKIP_LINT"      "npx prettier --check ."
run_if_triggered "ESLint"        "eslint"       "SKIP_LINT"      "npx eslint . --max-warnings 0"
run_if_triggered "Stylelint"     "stylelint"    "SKIP_LINT"      "npx stylelint 'src/**/*.css'"
run_if_triggered "Markdownlint"  "markdownlint" "SKIP_LINT"      "yarn lint:md"
run_if_triggered "actionlint"    "actionlint"   "SKIP_LINT"      "yarn lint:actions"
run_if_triggered "shellcheck"    "shellcheck"   "SKIP_LINT"      "yarn lint:shell"
run_if_triggered "Knip"          "knip"         "SKIP_LINT"      "npx knip"
run_if_triggered "TypeScript"    "typecheck"    "SKIP_TYPECHECK" "yarn typecheck"

# Unit tests — run vitest related against the changed files for speed.
if has_check "unit"; then
  if [ "${SKIP_UNIT:-0}" = "1" ]; then
    skip "Unit tests"
  else
    CHANGED=$(git diff --name-only "$(git merge-base HEAD origin/master)..HEAD" \
      | grep -E '\.(ts|tsx|js|mjs|cjs)$' || true)
    if [ -n "$CHANGED" ]; then
      info "Running: vitest related"
      if npx vitest related $CHANGED --run; then
        pass "Unit tests (vitest related)"
      else
        fail "Unit tests"
        FAILED=1
      fi
    else
      info "unit triggered but no code files in diff — running full suite"
      if yarn test; then
        pass "Unit tests"
      else
        fail "Unit tests"
        FAILED=1
      fi
    fi
  fi
fi

divider
if [ "$FAILED" -ne 0 ]; then
  echo -e "${RED}${BOLD}  Pre-push checks FAILED. Push aborted.${RESET}"
  echo -e "${YELLOW}  Fix the issues above, or skip specific checks with SKIP_* env vars.${RESET}"
  divider
  exit 1
else
  echo -e "${GREEN}${BOLD}  All pre-push checks passed.${RESET}"
  divider
fi
```

- [ ] **Step 2: Ensure executable**

```bash
chmod +x .husky/pre-push
```

- [ ] **Step 3: Smoke test — push a docs-only branch**

```bash
# From the worktree
echo "# smoke" >> docs/superpowers/specs/2026-04-14-smart-pipelines-design.md
git add . && git commit -m "smoke: docs-only"
git push --dry-run origin feat/smart-pipelines 2>&1 | head -40
# Observe: Triggered checks should include prettier markdownlint but NOT typecheck, unit, eslint, etc.
# (Undo the test commit before continuing)
git reset --hard HEAD~1
```

- [ ] **Step 4: Commit**

```bash
git add .husky/pre-push
git commit -m "feat(hooks): pre-push runs only checks triggered by the branch diff"
```

---

## Task 7: Rewrite `.github/workflows/ci.yml`

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace contents**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      prettier: ${{ steps.filter.outputs.prettier }}
      eslint: ${{ steps.filter.outputs.eslint }}
      stylelint: ${{ steps.filter.outputs.stylelint }}
      markdownlint: ${{ steps.filter.outputs.markdownlint }}
      actionlint: ${{ steps.filter.outputs.actionlint }}
      shellcheck: ${{ steps.filter.outputs.shellcheck }}
      knip: ${{ steps.filter.outputs.knip }}
      typecheck: ${{ steps.filter.outputs.typecheck }}
      unit: ${{ steps.filter.outputs.unit }}
      storybook: ${{ steps.filter.outputs.storybook }}
      build: ${{ steps.filter.outputs.build }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - name: Install
        run: yarn install --frozen-lockfile
      - id: filter
        run: |
          if [ "${{ github.event_name }}" = "push" ]; then
            node scripts/detect-buckets.mjs --force-all --github-output
          else
            node scripts/detect-buckets.mjs \
              --base=${{ github.event.pull_request.base.sha }} \
              --github-output
          fi

  prettier:
    name: Prettier
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.prettier != 'true'
        run: echo "Skipped — no prettier-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.prettier == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.prettier == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.prettier == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.prettier == 'true'
        run: npx prettier --check .

  eslint:
    name: ESLint
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.eslint != 'true'
        run: echo "Skipped — no eslint-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.eslint == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.eslint == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.eslint == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.eslint == 'true'
        run: npx eslint . --max-warnings 0

  stylelint:
    name: Stylelint
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.stylelint != 'true'
        run: echo "Skipped — no stylelint-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.stylelint == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.stylelint == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.stylelint == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.stylelint == 'true'
        run: npx stylelint "src/**/*.css"

  markdownlint:
    name: Markdownlint
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.markdownlint != 'true'
        run: echo "Skipped — no markdown-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.markdownlint == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.markdownlint == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.markdownlint == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.markdownlint == 'true'
        run: npx markdownlint-cli2 "**/*.md" "#node_modules" "#.specstory" "#.cursor" "#dist" "#worktrees"

  actionlint:
    name: Actionlint
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.actionlint != 'true'
        run: echo "Skipped — no workflow changes" && exit 0
      - if: needs.detect-changes.outputs.actionlint == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.actionlint == 'true'
        uses: raven-actions/actionlint@v2

  shellcheck:
    name: Shellcheck
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.shellcheck != 'true'
        run: echo "Skipped — no shell script changes" && exit 0
      - if: needs.detect-changes.outputs.shellcheck == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.shellcheck == 'true'
        uses: ludeeus/action-shellcheck@master
        with:
          additional_files: '.husky/pre-commit .husky/pre-push .husky/post-merge'

  knip:
    name: Knip
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.knip != 'true'
        run: echo "Skipped — no knip-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.knip == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.knip == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.knip == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.knip == 'true'
        run: npx knip

  typecheck:
    name: Type Check
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.typecheck != 'true'
        run: echo "Skipped — no typecheck-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.typecheck == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.typecheck == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.typecheck == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.typecheck == 'true'
        run: npx tsc --noEmit

  unit-test:
    name: Unit Tests
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.unit != 'true'
        run: echo "Skipped — no unit-test-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.unit == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.unit == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.unit == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.unit == 'true'
        run: npx vitest run --coverage
      - if: needs.detect-changes.outputs.unit == 'true' && always()
        uses: actions/upload-artifact@v7
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  build:
    name: Build
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.build != 'true'
        run: echo "Skipped — no build-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.build == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.build == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.build == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.build == 'true'
        run: yarn build
      - if: needs.detect-changes.outputs.build == 'true'
        uses: actions/upload-artifact@v7
        with:
          name: dist-ci
          path: dist/
          retention-days: 1

  storybook-test:
    name: Storybook Tests
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.storybook != 'true'
        run: echo "Skipped — no storybook-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.storybook == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.storybook == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: npx playwright install --with-deps chromium
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: yarn build-storybook --output-dir storybook-static
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: npx http-server storybook-static --port 6006 &
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: npx wait-on http://localhost:6006 --timeout 60000
      - if: needs.detect-changes.outputs.storybook == 'true'
        run: yarn test:storybook --url http://localhost:6006
      - if: needs.detect-changes.outputs.storybook == 'true' && failure()
        uses: actions/upload-artifact@v7
        with:
          name: storybook-playwright-traces
          path: test-results/
          retention-days: 7
```

- [ ] **Step 2: Validate the workflow syntax**

```bash
npx actionlint .github/workflows/ci.yml
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(ci.yml): split into atomic jobs gated by detect-changes; force-all on master push"
```

---

## Task 8: Update `.github/workflows/e2e.yml`

**Files:**

- Modify: `.github/workflows/e2e.yml`

- [ ] **Step 1: Replace contents**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
  schedule:
    - cron: '0 0 * * 0' # weekly — Sunday at 00:00 UTC
  workflow_dispatch:

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      e2e: ${{ steps.filter.outputs.e2e }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - run: yarn install --frozen-lockfile
      - id: filter
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            node scripts/detect-buckets.mjs \
              --base=${{ github.event.pull_request.base.sha }} \
              --github-output
          else
            node scripts/detect-buckets.mjs --force-all --github-output
          fi

  e2e:
    name: E2E — ${{ matrix.browser }}
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium]
    steps:
      - name: Skip if not triggered
        if: needs.detect-changes.outputs.e2e != 'true'
        run: echo "Skipped — no e2e-relevant changes" && exit 0
      - if: needs.detect-changes.outputs.e2e == 'true'
        uses: actions/checkout@v6
      - if: needs.detect-changes.outputs.e2e == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: yarn install --frozen-lockfile
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: npx playwright install --with-deps ${{ matrix.browser }}
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: yarn build
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: cp dist/client/_shell.html dist/client/index.html
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true
      - if: needs.detect-changes.outputs.e2e == 'true'
        run: npx playwright test --project=${{ matrix.browser }} --grep @a11y
        continue-on-error: false
      - if: needs.detect-changes.outputs.e2e == 'true' && failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 14
```

- [ ] **Step 2: Validate**

```bash
npx actionlint .github/workflows/e2e.yml
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/e2e.yml
git commit -m "ci(e2e): gate on detect-changes; drop master-push trigger"
```

---

## Task 9: Update `.github/workflows/visual-regression.yml`

**Files:**

- Modify: `.github/workflows/visual-regression.yml`

- [ ] **Step 1: Replace contents**

```yaml
# .github/workflows/visual-regression.yml
# VR runs only via scripts/vr-docker.mjs (Playwright official image) — same path as yarn test:vr.
name: Visual Regression

on:
  pull_request:
  workflow_dispatch:
    inputs:
      update_snapshots:
        description: 'Update baseline snapshots and commit them'
        type: boolean
        default: false

concurrency:
  group: visual-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: write

jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      vr: ${{ steps.filter.outputs.vr }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - run: yarn install --frozen-lockfile
      - id: filter
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            node scripts/detect-buckets.mjs \
              --base=${{ github.event.pull_request.base.sha }} \
              --github-output
          else
            node scripts/detect-buckets.mjs --force-all --github-output
          fi

  visual-regression:
    name: Visual Regression (Docker / Chromium)
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - name: Skip if not triggered
        if: github.event_name == 'pull_request' && needs.detect-changes.outputs.vr != 'true'
        run: echo "Skipped — no vr-relevant changes" && exit 0

      - if: github.event_name != 'pull_request' || needs.detect-changes.outputs.vr == 'true'
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event_name == 'workflow_dispatch' && github.ref_name || '' }}

      - if: github.event_name != 'pull_request' || needs.detect-changes.outputs.vr == 'true'
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn

      - if: github.event_name != 'pull_request' || needs.detect-changes.outputs.vr == 'true'
        run: yarn install --frozen-lockfile

      - name: Update baseline snapshots
        if: github.event_name == 'workflow_dispatch' && inputs.update_snapshots == true
        run: node scripts/vr-docker.mjs update

      - name: Commit updated snapshots
        if: github.event_name == 'workflow_dispatch' && inputs.update_snapshots == true
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add e2e/
          git diff --cached --quiet || git commit -m "chore(vr): update visual baselines (Docker/Chromium) [skip ci]"
          git push

      - name: Run visual regression tests
        if: (github.event_name == 'pull_request' && needs.detect-changes.outputs.vr == 'true') || (github.event_name == 'workflow_dispatch' && inputs.update_snapshots != true)
        run: node scripts/vr-docker.mjs test
        continue-on-error: true
        id: visual

      - name: Upload diff images
        if: steps.visual.outcome == 'failure'
        uses: actions/upload-artifact@v7
        with:
          name: visual-regression-diffs-chromium
          path: test-results/
          retention-days: 14

      - name: Upload Playwright HTML report
        if: inputs.update_snapshots != true && steps.visual.outcome == 'failure'
        uses: actions/upload-artifact@v7
        with:
          name: playwright-report-vr
          path: playwright-report/
          retention-days: 14
```

- [ ] **Step 2: Validate**

```bash
npx actionlint .github/workflows/visual-regression.yml
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/visual-regression.yml
git commit -m "ci(vr): gate on detect-changes for PRs; dispatch path unchanged"
```

---

## Task 10: Update `.github/workflows/pr-preview.yml`

**Files:**

- Modify: `.github/workflows/pr-preview.yml`

- [ ] **Step 1: Add `detect-changes` job and gate `deploy-preview` on `outputs.build`**

Insert before the `deploy-preview` job:

```yaml
jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      build: ${{ steps.filter.outputs.build }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn
      - run: yarn install --frozen-lockfile
      - id: filter
        run: node scripts/detect-buckets.mjs --base=${{ github.event.pull_request.base.sha }} --github-output

  deploy-preview:
    name: Build and deploy preview
    needs: detect-changes
    if: needs.detect-changes.outputs.build == 'true'
    runs-on: ubuntu-latest
    # ... rest unchanged
```

Keep every existing step inside `deploy-preview` as-is (checkout, compute version, build, etc.). Only two edits: add `needs:` and the workflow-level `if:` above.

Because the job-level `if:` is used, docs/workflow-only PRs show `deploy-preview` as "skipped" in the PR UI — fine, it's not a required check.

- [ ] **Step 2: Validate**

```bash
npx actionlint .github/workflows/pr-preview.yml
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pr-preview.yml
git commit -m "ci(preview): skip PR preview deploy when no build-relevant files change"
```

---

## Task 11: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the "Pre-push Quality Gate" section**

Find the heading `## Pre-push Quality Gate` and replace its entire section (through the end of the "Visual Regression Tests" sub-section) with:

```markdown
## Hook and CI Gating

Hooks and CI run **only the checks that the changed files can possibly affect**, driven by `scripts/detect-buckets.mjs`. Full documentation: `docs/superpowers/specs/2026-04-14-smart-pipelines-design.md`.

### Pre-commit (`husky/pre-commit`)

1. `lint-staged` (per-file formatters/linters).
2. `yarn typecheck` — only if any staged file triggers the `typecheck` atomic check.

### Pre-push (`husky/pre-push`)

Runs the pre-push phase of every atomic check whose globs match files changed between `origin/master` and `HEAD`. Output begins with a `Triggered checks:` summary.

| Phase       | Atomic checks that may run                                                    |
| ----------- | ----------------------------------------------------------------------------- |
| pre-commit  | prettier, eslint, stylelint, markdownlint (via lint-staged), typecheck        |
| pre-push    | + actionlint, shellcheck, knip, unit (`vitest related`)                       |
| PR CI       | + storybook, VR, e2e, build                                                   |
| master push | full suite (every check, ignoring the glob filter) — safety net before deploy |

### Skip flags (unchanged API)

- `SKIP_PREPUSH=1` — bypass pre-commit **and** pre-push entirely
- `SKIP_LINT=1` — skip prettier/eslint/stylelint/markdownlint/actionlint/shellcheck/knip
- `SKIP_TYPECHECK=1`
- `SKIP_UNIT=1`
- `SKIP_STORYBOOK=1` (not run by default on pre-push)
- `SKIP_VR=1` (not run by default on pre-push)
- `SKIP_E2E=1` (not run by default on pre-push)

When skipping a check, document the reason in the commit message or PR description.

### Branch protection

Required status checks on `master`: `Prettier`, `ESLint`, `Stylelint`, `Markdownlint`, `Actionlint`, `Shellcheck`, `Knip`, `Type Check`, `Unit Tests`, `Storybook Tests`, `Visual Regression (Docker / Chromium)`, `E2E — chromium`, `Build`. Conditionally-skipped jobs exit 0 early → GitHub shows them green.

### Visual Regression Tests

VR tests use Docker; behaviour and troubleshooting unchanged. See `docs/superpowers/specs/2026-04-14-smart-pipelines-design.md` for the full trigger table.
```

- [ ] **Step 2: Run markdown lint**

```bash
yarn fix:md CLAUDE.md
npx markdownlint-cli2 CLAUDE.md
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document change-aware hook and CI behaviour"
```

---

## Task 12: Integration smoke tests

**Files:** no code changes — verification only.

- [ ] **Step 1: Run the full unit test suite**

```bash
yarn test
```

Expected: all tests pass, including `scripts/detect-buckets.test.mjs`.

- [ ] **Step 2: Verify full lint still passes**

```bash
yarn lint
yarn typecheck
```

Expected: no errors.

- [ ] **Step 3: Dry-run pre-push locally**

```bash
SKIP_VR=1 SKIP_STORYBOOK=1 SKIP_E2E=1 .husky/pre-push
```

Expected: finishes successfully, prints `Triggered checks: ...` reflecting the real diff.

- [ ] **Step 4: Push the branch and open a PR**

```bash
git push -u origin feat/smart-pipelines
gh pr create --title "ci: change-aware hooks and pipelines" --body "$(cat <<'EOF'
## Summary

Implements `docs/superpowers/specs/2026-04-14-smart-pipelines-design.md`.

- Hooks (pre-commit, pre-push) run only checks matching the diff.
- CI (`ci.yml`, `e2e.yml`, `visual-regression.yml`, `pr-preview.yml`) gate every job on `detect-changes` outputs.
- Master push runs the full suite via `--force-all` as a safety net.

## Test plan

- [ ] CI for this PR triggers `eslint`, `typecheck`, `unit`, `actionlint`, `shellcheck`, `knip`, `prettier`, `markdownlint`, `storybook`, `VR`, `e2e`, `build` (touches src + workflows + hooks + docs).
- [ ] Follow-up docs-only PR: only `prettier` + `markdownlint` run; the rest are skipped green.
- [ ] Follow-up workflow-only PR: only `prettier` + `actionlint` run.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Watch PR CI — every job must either run or exit 0 green (none "pending" forever)**

```bash
gh pr checks
```

Expected: all 13 atomic-check jobs complete (green or green-skip).

- [ ] **Step 6: Manually update branch protection required checks**

In the GitHub repo settings → Branches → branch protection rule for `master`, set required status checks to the 13 job names listed in the "Branch protection" section of CLAUDE.md. **This step is manual and must be done by a repo admin before merging.** Document in the PR description that this is required.

- [ ] **Step 7: Open a second (docs-only) PR to verify the skip path works**

```bash
# On a fresh branch
git checkout -b chore/smart-pipelines-smoke
echo "- smoke test entry" >> docs/superpowers/specs/2026-04-14-smart-pipelines-design.md
git add . && git commit -m "docs: smoke test for smart pipelines"
git push -u origin chore/smart-pipelines-smoke
gh pr create --title "smoke: docs-only PR" --body "Verifying skip paths."
gh pr checks
```

Expected: `Prettier` and `Markdownlint` run; every other job exits 0 green immediately.

- [ ] **Step 8: After merge, watch `master` push trigger the full suite**

```bash
# Merge the smart-pipelines PR first, then:
gh run list --workflow=ci.yml --branch=master --limit=1
```

Expected: the master-push run triggers every job (via `--force-all`).

---

## Self-Review Notes

- **Spec coverage**: every section of the spec maps to a task — atomic checks (Task 2), CLI contract (Task 3), hooks (Tasks 5–6), CI workflows (Tasks 7–10), docs/branch protection (Task 11), smoke tests (Task 12).
- **Branch protection**: step 6 of Task 12 is a manual admin action. Flagged explicitly; cannot be automated.
- **Trigger globs**: the spec's unit/storybook globs included vague "config files" — the implementation uses the specific subset (`package.json`, `tsconfig*.json`) for unit and `package.json` for storybook. Matches the fix applied during the spec self-review.
- **mdx carve-out**: lives in `detectChecks` itself (Task 2) with a unit test (Task 1). Matches the `.lintstagedrc.mjs` behaviour.
- **`prettier` glob**: extended to include `.js`/`.mjs`/`.cjs` since prettier already formats them (scripts, config files). Not a spec deviation — makes the glob match `eslint`'s scope on JS files.
