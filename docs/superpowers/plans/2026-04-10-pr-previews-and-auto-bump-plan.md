# PR Previews and Auto-Version-Bump Plan

## Context

BaseSkill currently deploys production builds to GitHub Pages on every push to
`master` via `.github/workflows/deploy.yml`, using the modern Pages API
(`actions/deploy-pages`). Only one version of the site is live at any time — the
latest build on `master`.

This plan adds two things:

1. **PR preview deploys** — every open PR publishes a live preview of the app and
   Storybook under `https://leocaseiro.github.io/base-skill/pr/<number>/app/` and
   `.../pr/<number>/storybook/`. Previews persist forever (no cleanup on close)
   so history is preserved.

2. **Automatic version bumping** — when a PR merges to `master`, the workflow
   inspects the PR's commit messages, picks a semver bump, updates
   `package.json`, tags the commit, and deploys.

Because GitHub Pages only serves from one source, and per-PR subdirectories
require pushing to a long-lived `gh-pages` branch, the existing `deploy.yml`
must migrate off the Pages API and onto a branch-push model using
`JamesIves/github-pages-deploy-action`. Both production and previews will live
on the same `gh-pages` branch.

### Manual Setup Required (one-time)

Before the new workflows will publish anything, the user must change the
GitHub Pages source in repo settings:

- Go to **Settings → Pages → Source**
- Change from **GitHub Actions** to **Deploy from a branch**
- Select branch **`gh-pages`** and folder **`/ (root)`**

This is a one-time manual step and will be documented in the PR description.

## Scope

### In scope

- `scripts/determine-bump.sh` — analyses PR commit messages, outputs bump type
- `.github/workflows/pr-preview.yml` — per-PR previews (new)
- `.github/workflows/deploy.yml` — migrated to `gh-pages` branch, adds bump + tag (modified)
- `vite.config.ts` — prefer `VITE_APP_VERSION` env var over `package.json` version at build time
- PR comment with preview URLs (bot-managed, single comment per PR, updated on subsequent pushes)

### Out of scope

- Cleanup workflow for closed PRs (user explicitly wants history retained)
- Service worker gating on PR builds (user accepted the first-load edge case)
- IndexedDB namespacing (user declined despite the schema-conflict risk)
- Override mechanism for bump type (auto-detection from commits is the source of truth)
- Conventional commit enforcement (existing style is close enough; default is patch)
- PR creation helper / skill (may be added later)

### Explicit non-goals

- PR previews are not expected to share service workers, local storage, or
  IndexedDB with the production build; cross-contamination is a known tradeoff
  the user has accepted.
- The workflow must not introduce any manual steps at PR time — labels,
  commit-message discipline, and post-merge actions are all automatic.

## Bump Rules

`scripts/determine-bump.sh` reads the PR number from argv and uses
`gh pr view` to fetch all commit messages (headline + body). It then applies
these rules in order:

| Priority | Pattern                                                             | Bump  |
| -------- | ------------------------------------------------------------------- | ----- |
| 1        | Commit contains `BREAKING CHANGE` (body) OR `<type>!:` (header)     | major |
| 2        | Any commit header matches `^feat(\(.+\))?:`                         | minor |
| 3        | Any commit header matches `^(fix\|perf\|refactor\|style)(\(.+\))?:` | patch |
| 4        | Only `^(docs\|ci\|chore\|test\|build)(\(.+\))?:` commits            | skip  |
| 5        | Anything else (unclassifiable commits)                              | patch |

Output: prints exactly one of `major`, `minor`, `patch`, or `skip` to stdout.
Exit code `0` on success, non-zero on failure (e.g., `gh` not authenticated).

The script takes one required positional argument: the PR number. In the
workflow it will be called as `scripts/determine-bump.sh "$PR_NUMBER"`. A local
mode is also needed for testability: if `PR_COMMITS_FILE` env var is set,
the script reads commit messages from that file instead of calling `gh`.
This allows the bundled shell test suite to exercise every rule.

## Version Strings

- **Production builds** (master): `0.1.0`, `0.2.0`, `1.0.0`, etc. — unchanged,
  read from `package.json`.
- **PR preview builds**: `${BASE_VERSION}-pr.${PR_NUMBER}` where `BASE_VERSION`
  is the current `package.json` version on the PR branch. Example: `0.1.0-pr.42`.

The PR version is stable across commits on the same PR: multiple pushes to the
same PR always produce the same `-pr.N` suffix (e.g., `0.1.0-pr.42`). The
changing commit SHA is captured in `version.json#buildSha` instead. This means
the `pr/42/` directory is overwritten in place on every push.

## Deploy Layout on `gh-pages`

```text
gh-pages/
├── index.html              ← production app (master)
├── assets/                 ← production assets
├── docs/                   ← production storybook
├── version.json            ← production version metadata
├── 404.html                ← SPA history-routing fallback
└── pr/
    ├── 42/
    │   ├── app/
    │   │   ├── index.html
    │   │   ├── assets/
    │   │   └── version.json   (version "0.1.0-pr.42")
    │   └── storybook/
    │       └── index.html
    └── 57/
        └── ...
```

## Tasks

### Task 1: `determine-bump.sh` with shell tests

**Files:**

- `scripts/determine-bump.sh` (new, executable)
- `scripts/determine-bump.test.sh` (new, executable)

**Requirements:**

- Bash script, uses `set -euo pipefail`
- Takes PR number as `$1`
- If env var `PR_COMMITS_FILE` is set, reads newline-separated commit messages
  from that file (one commit per line, headline only acceptable; multi-line
  bodies separated by a literal `---` sentinel line)
- Otherwise, calls
  `gh pr view "$PR_NUMBER" --json commits --jq '.commits[] | (.messageHeadline + "\n" + .messageBody)'`
- Applies the rules from the table above
- Prints one of `major|minor|patch|skip` and exits 0
- On `gh` failure or missing argument, prints an error to stderr and exits 1

**Test script must cover:**

- `feat:` in one commit → `minor`
- `fix:` only → `patch`
- `style:` only → `patch` (user specifically said style is not skip)
- `docs:` only → `skip`
- `chore:` + `ci:` + `test:` → `skip`
- `docs:` + `fix:` → `patch` (fix beats docs)
- `fix:` + `feat:` → `minor` (feat beats fix)
- `feat!:` → `major`
- `fix:` with `BREAKING CHANGE:` in body → `major`
- Commit with no conventional prefix → `patch` (safe default)
- Scoped prefixes (`fix(auth):`, `feat(ui):`) recognized
- Mixed case (`FEAT:`, `Fix:`) NOT matched — enforce lowercase
- Empty commit list → `patch` (defensive default)

The test script should use a temp directory per case, write a `PR_COMMITS_FILE`,
invoke `determine-bump.sh` with any PR number (since the file bypasses `gh`),
and assert the output matches expected. Exit 0 on all-pass, non-zero otherwise.

**Wiring:**

- Add a `test:scripts` package.json script that runs `bash scripts/determine-bump.test.sh`
- Do NOT add it to the pre-push hook (keep the hook lean); it's fine as a
  manual check or a future CI job

### Task 2: `vite.config.ts` version env support

**File:** `vite.config.ts`

**Change:** Line 99-101 currently reads:

```ts
define: {
  'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
},
```

Change to:

```ts
define: {
  'import.meta.env.VITE_APP_VERSION': JSON.stringify(
    process.env['VITE_APP_VERSION'] ?? version,
  ),
},
```

That's the only source change needed. `APP_BASE_URL` is already wired at
`vite.config.ts:15`.

**Verification:**

- `yarn build` with no env var should stamp the `package.json` version (unchanged behavior)
- `VITE_APP_VERSION=0.1.0-pr.42 yarn build` should stamp `0.1.0-pr.42`
- `yarn typecheck` passes
- `yarn lint` passes

### Task 3: Migrate `deploy.yml` and add bump + tag logic

**File:** `.github/workflows/deploy.yml`

**Changes:**

1. **Trigger:** Change from `push: branches: [master]` to

   ```yaml
   on:
     pull_request:
       types: [closed]
       branches: [master]
     workflow_dispatch:
   ```

2. **Job gating:** Add job-level `if: github.event.pull_request.merged == true || github.event_name == 'workflow_dispatch'` so closed-without-merge PRs don't deploy.

3. **Permissions:** Replace the Pages permissions with:

   ```yaml
   permissions:
     contents: write
     pull-requests: read
   ```

4. **Checkout:** Use `ref: master` and `fetch-depth: 0` so we have full history and the master HEAD, not the PR merge commit.

5. **Bump step:** After install, add a step that:
   - Reads the PR number from `${{ github.event.pull_request.number }}` (or skips when dispatched manually)
   - Runs `scripts/determine-bump.sh "$PR_NUMBER"` → captures `BUMP`
   - If `BUMP == skip`, sets an output `bumped=false` and continues to build using the existing `package.json` version
   - Otherwise: `yarn version --$BUMP --no-git-tag-version`, captures the new version from `package.json`, sets output `bumped=true` and `new_version`

6. **Build steps:** unchanged, but the build will naturally pick up the new version because `vite.config.ts` reads from `package.json` by default. No need to inject `VITE_APP_VERSION` here.

7. **Replace Pages API deploy with branch push:**
   - Remove `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` steps
   - Remove the separate `deploy` job
   - Add `JamesIves/github-pages-deploy-action@v4` step that pushes `dist/client/` to the root of the `gh-pages` branch with `clean: true` but `clean-exclude: ['pr/**']` so PR previews are preserved

8. **Commit and tag pushback:** If `bumped == true`, add a step that:
   - Configures git user as `github-actions[bot]`
   - `git add package.json`
   - `git commit -m "chore(release): v${NEW_VERSION}"`
   - `git tag "v${NEW_VERSION}"`
   - `git push origin master --follow-tags`
   - Uses `github.actor != 'github-actions[bot]'` as a belt-and-suspenders guard (though the `pull_request: closed` trigger makes a loop effectively impossible)

**Important note on `clean-exclude`:** with a glob of `pr/**`, when we deploy
production to the `gh-pages` branch root we wipe old production files but
leave everything under `pr/` untouched. The JamesIves action supports this
natively.

**Verification:**

- `yarn lint` passes on the YAML (yamllint is not configured; rely on GitHub Actions syntax)
- Workflow file parses (no structural errors)
- Full end-to-end verification requires an actual PR merge, which will happen when this feature itself merges

### Task 4: `pr-preview.yml`

**File:** `.github/workflows/pr-preview.yml` (new)

**Structure:**

```yaml
name: PR Preview
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [master]

concurrency:
  group: pr-preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: write
  pull-requests: write

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: yarn

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Compute version
        id: version
        run: |
          BASE_VERSION=$(node -p "require('./package.json').version")
          PR_NUMBER=${{ github.event.pull_request.number }}
          echo "version=${BASE_VERSION}-pr.${PR_NUMBER}" >> "$GITHUB_OUTPUT"
          echo "pr_base=/base-skill/pr/${PR_NUMBER}/app/" >> "$GITHUB_OUTPUT"

      - name: Build app
        env:
          APP_BASE_URL: ${{ steps.version.outputs.pr_base }}
          VITE_APP_VERSION: ${{ steps.version.outputs.version }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_ONEDRIVE_CLIENT_ID: ${{ secrets.VITE_ONEDRIVE_CLIENT_ID }}
          VITE_CF_WORKER_URL: ${{ secrets.VITE_CF_WORKER_URL }}
          VITE_ANALYTICS_PROVIDER: ${{ vars.VITE_ANALYTICS_PROVIDER }}
        run: yarn build

      - name: Copy shell to index.html
        run: cp dist/client/_shell.html dist/client/index.html

      - name: SPA fallback
        run: cp dist/client/index.html dist/client/404.html

      - name: Stamp version.json
        run: |
          echo '{
            "version": "${{ steps.version.outputs.version }}",
            "buildSha": "${{ github.event.pull_request.head.sha }}",
            "buildDate": "${{ github.event.pull_request.updated_at }}"
          }' > dist/client/version.json

      - name: Build storybook
        run: yarn build-storybook --output-dir storybook-static

      - name: Stage preview directory
        run: |
          rm -rf preview-staging
          mkdir -p preview-staging/app preview-staging/storybook
          cp -r dist/client/. preview-staging/app/
          cp -r storybook-static/. preview-staging/storybook/

      - name: Deploy preview
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: preview-staging
          target-folder: pr/${{ github.event.pull_request.number }}
          clean: true
          commit-message: 'deploy: PR #${{ github.event.pull_request.number }} preview'

      - name: Comment PR with preview URLs
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: pr-preview
          message: |
            ## 🚀 Preview deployed

            | Target    | URL                                                                                                    |
            | --------- | ------------------------------------------------------------------------------------------------------ |
            | App       | https://leocaseiro.github.io/base-skill/pr/${{ github.event.pull_request.number }}/app/                |
            | Storybook | https://leocaseiro.github.io/base-skill/pr/${{ github.event.pull_request.number }}/storybook/          |

            **Version:** `${{ steps.version.outputs.version }}`
            **Commit:** `${{ github.event.pull_request.head.sha }}`

            Previews are kept forever — no cleanup on close.
```

**Storybook base path note:** Storybook's static build emits relative URLs by
default, so it works in subdirectories without additional configuration. If it
turns out not to, we will pass `--base-path /base-skill/pr/${PR_NUMBER}/storybook/`
to `storybook build`. Implementer should verify the built `storybook-static/index.html`
uses relative asset paths (e.g., `./assets/...` not `/assets/...`).

**Verification:**

- Workflow file parses
- Does not actually run until the PR is open (meta: this plan's own PR will
  be the first real test)

## Sequencing and Dependencies

Tasks must be done in this order because of dependencies:

1. Task 1 (`determine-bump.sh`) — standalone, no deps
2. Task 2 (`vite.config.ts`) — standalone, no deps
3. Task 3 (`deploy.yml`) — depends on Task 1 and Task 2
4. Task 4 (`pr-preview.yml`) — depends on Task 2

Tasks 1 and 2 can technically be done in any order, but we will execute
strictly sequentially per subagent-driven-development rules.

## Definition of Done

- [ ] All four tasks implemented, reviewed, and committed on the
      `feat/pr-previews-auto-bump` branch
- [ ] `scripts/determine-bump.test.sh` passes locally
- [ ] `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` all pass
- [ ] PR description explains the manual GitHub Pages setting change required
- [ ] No changes to IndexedDB, service worker, or app source beyond
      `vite.config.ts:100`
- [ ] Plan document itself passes `yarn fix:md`
