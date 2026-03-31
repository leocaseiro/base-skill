# CI/CD Design Document — BaseSkill

**Project:** BaseSkill — free, open-source, offline-first educational PWA for children  
**Stack:** TanStack Start · TanStack Router · React · TypeScript (strict) · Vite · GitHub Actions · GitHub Pages  
**License:** GPL v3

---

## Table of Contents

1. [Overview](#1-overview)
2. [GitHub Actions Workflows](#2-github-actions-workflows)
   - [ci.yml — Pull Request / Push CI](#a-ciyml--pull-request--push-ci)
   - [e2e.yml — E2E Tests](#b-e2eyml--e2e-tests)
   - [deploy.yml — Deploy to GitHub Pages](#c-deployyml--deploy-to-github-pages)
   - [visual-regression.yml — Visual Regression](#d-visual-regressionyml--visual-regression)
3. [App Versioning Strategy](#3-app-versioning-strategy)
4. [Service Worker Lifecycle on Deploy](#4-service-worker-lifecycle-on-deploy)
5. [GitHub Pages Deployment](#5-github-pages-deployment)
6. [Build Output](#6-build-output)
7. [Portability — Deploying to Other Hosts](#7-portability--deploying-to-other-hosts)
8. [Commit and Branch Strategy](#8-commit-and-branch-strategy)
9. [Branch Protection Rules](#9-branch-protection-rules)
10. [Environment Variables](#10-environment-variables)

---

## 1. Overview

BaseSkill follows a **continuous integration, continuous deployment** model designed for a GPL v3 open-source project. The goals are:

- **Every incremental feature commit has passing CI.** No broken code reaches `main`. Each feature branch must have all four CI jobs pass before merge.
- **Automatic deployment on merge to `main`.** Every merge triggers a production deploy to GitHub Pages with no manual steps.
- **Portability.** The build output is a standard static SPA (`dist/`) that deploys identically to Netlify, Vercel, Cloudflare Pages, or any static file host with SPA fallback configured.
- **Community-friendly.** Branch protection rules enforce the PR workflow, making it safe for open-source contributors to submit changes without risk of breaking production.

### Pipeline at a Glance

```
Feature branch push
        │
        ▼
  ┌─────────────────────────────────────────┐
  │  ci.yml (parallel jobs)                 │
  │  lint · typecheck · unit-test · build   │
  └─────────────────────────────────────────┘
        │ all pass
        ▼
  PR opened → review → merge to main
        │
        ▼
  ┌─────────────┐   ┌──────────────────────────┐
  │  ci.yml     │   │  e2e.yml (post-merge)     │
  │  (re-run)   │   │  chromium/firefox/webkit  │
  └─────────────┘   └──────────────────────────┘
        │ all pass
        ▼
  ┌───────────────────────────────────────────────┐
  │  deploy.yml                                   │
  │  build → stamp version.json → deploy dist/    │
  └───────────────────────────────────────────────┘
```

---

## 2. GitHub Actions Workflows

All workflow files live in `.github/workflows/`.

### a) `ci.yml` — Pull Request / Push CI

**Triggers:** push to any branch, pull request targeting `main`.  
**Purpose:** gate every PR; all four jobs must pass before merge is allowed.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: ESLint
        run: npx eslint . --max-warnings 0

      - name: Prettier
        run: npx prettier --check .

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: TypeScript
        run: npx tsc --noEmit

  unit-test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Vitest with coverage
        run: npx vitest run --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-ci
          path: dist/
          retention-days: 1
```

Coverage thresholds are enforced in `vitest.config.ts`:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
```

---

### b) `e2e.yml` — E2E Tests

**Triggers:** push to `main`, pull request to `main`, scheduled weekly (Sunday midnight UTC).  
**Purpose:** cross-browser functional tests and accessibility audits.

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'   # weekly — Sunday at 00:00 UTC
  workflow_dispatch:

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    name: E2E — ${{ matrix.browser }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build app
        run: npm run build

      - name: Run Playwright tests (${{ matrix.browser }})
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true

      - name: Run accessibility audit
        run: npx playwright test --project=${{ matrix.browser }} --grep @a11y
        continue-on-error: false

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 14
```

Accessibility tests use `@axe-core/playwright` tagged with `@a11y`:

```typescript
// tests/a11y/home.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('@a11y Home page has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toHaveLength(0)
})
```

---

### c) `deploy.yml` — Deploy to GitHub Pages

**Triggers:** push to `main` (after CI passes via `needs`).  
**Purpose:** build, stamp version metadata, and deploy `dist/` to GitHub Pages.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false   # never cancel an in-flight deploy

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Read package version
        id: version
        run: echo "version=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Build
        run: npm run build
        env:
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_ONEDRIVE_CLIENT_ID: ${{ secrets.VITE_ONEDRIVE_CLIENT_ID }}
          VITE_CF_WORKER_URL: ${{ secrets.VITE_CF_WORKER_URL }}
          VITE_ANALYTICS_PROVIDER: ${{ vars.VITE_ANALYTICS_PROVIDER }}

      - name: Stamp version.json
        run: |
          echo '{
            "version": "${{ steps.version.outputs.version }}",
            "buildSha": "${{ github.sha }}",
            "buildDate": "${{ github.event.head_commit.timestamp }}"
          }' > dist/version.json

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

> **Base URL:** if the repository is hosted at `github.com/[owner]/base-skill`, the GitHub Pages URL is `https://[owner].github.io/base-skill/`. Set `base: '/base-skill/'` in `vite.config.ts` (or the value of `APP_BASE_URL` env var). For a custom domain, set base to `'/'`.

---

### d) `visual-regression.yml` — Visual Regression

**Triggers:** pull request to `main`, manual dispatch (`workflow_dispatch`).  
**Purpose:** screenshot comparison against committed baselines to catch unintended UI changes.

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: visual-${{ github.ref }}
  cancel-in-progress: true

jobs:
  visual-regression:
    name: Visual Regression — ${{ matrix.browser }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium]   # extend to firefox/webkit when baselines exist

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build app
        run: npm run build

      - name: Run visual regression tests
        run: npx playwright test --project=${{ matrix.browser }} --grep @visual
        continue-on-error: true
        id: visual

      - name: Upload diff images
        if: steps.visual.outcome == 'failure'
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-diffs-${{ matrix.browser }}
          path: test-results/
          retention-days: 14

      - name: Fail if visual regressions found
        if: steps.visual.outcome == 'failure'
        run: exit 1
```

Baseline snapshots are committed to `tests/snapshots/`. To update baselines:

```bash
npx playwright test --grep @visual --update-snapshots
git add tests/snapshots/
git commit -m "chore: update visual regression baselines"
```

---

## 3. App Versioning Strategy

### Version Source

The single source of truth for the version is the `"version"` field in `package.json`. Format: **semantic versioning** `MAJOR.MINOR.PATCH` (e.g., `0.1.0`, `1.0.0`).

### Build-Time Injection

Vite injects the version at build time so it is accessible anywhere in the app as `import.meta.env.VITE_APP_VERSION`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { version } from './package.json'

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },
})
```

Usage in app code:

```typescript
const appVersion = import.meta.env.VITE_APP_VERSION  // e.g., "1.2.3"
```

### Deploy-Time Stamping

CI stamps a `version.json` file into the build root after `npm run build`:

```json
{
  "version": "1.2.3",
  "buildSha": "abc1234def5678",
  "buildDate": "2026-03-31T00:00:00Z"
}
```

This file can be fetched at runtime to compare with the currently running version.

### Runtime Version Check

On app load, the app reads from the `app_meta` RxDB collection. If the stored version differs from `import.meta.env.VITE_APP_VERSION`, it:

1. Triggers a Service Worker update check (`registration.update()`).
2. Checks the RxDB schema version to determine whether a migration is needed.
3. Runs any pending RxDB migrations before rendering the main app tree.

```typescript
// src/lib/versionCheck.ts
export async function checkVersion(db: RxDatabase) {
  const meta = await db.app_meta.findOne().exec()
  const runningVersion = import.meta.env.VITE_APP_VERSION

  if (meta?.version !== runningVersion) {
    // Trigger SW update check
    const reg = await navigator.serviceWorker.getRegistration()
    await reg?.update()

    // Run RxDB migrations if schema version changed
    await runPendingMigrations(db)

    // Persist updated version
    await db.app_meta.upsert({ id: 'meta', version: runningVersion })
  }
}
```

### Version Display

The current version is displayed in **Parent Settings › About** screen, sourced from `import.meta.env.VITE_APP_VERSION`.

---

## 4. Service Worker Lifecycle on Deploy

BaseSkill uses `vite-plugin-pwa` to generate the Service Worker. The following lifecycle strategy ensures users always get the latest version transparently.

### Cache Strategy

- **Cache name prefix:** `baseskill-v{version}` (e.g., `baseskill-v1.2.3`)
- Each deploy generates a new SW with a new content hash.

### `install` Event

The new SW pre-caches all hashed assets under the versioned cache name:

```javascript
// sw.js (generated by vite-plugin-pwa / Workbox)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(`baseskill-v${APP_VERSION}`).then((cache) => {
      return cache.addAll(PRECACHE_MANIFEST)
    })
  )
})
```

### `activate` Event

On activation, the SW deletes all caches that do not match the current version prefix, preventing stale cache accumulation:

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(`baseskill-v${APP_VERSION}`))
          .map((name) => caches.delete(name))
      )
    ).then(() => {
      self.skipWaiting()
      return self.clients.claim()
    })
  )
})
```

### App-Side Update Detection

The app listens for `controllerchange` to detect when a new SW has taken control:

```typescript
// src/lib/serviceWorker.ts
export function registerUpdateHandler(db: RxDatabase) {
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    // New SW is now active — check version and run migrations
    await checkVersion(db)
    // No forced reload: update applies on next route navigation
  })
}
```

### User Experience

- Updates are **transparent** — no "A new version is available, click to refresh" prompt.
- The new SW activates immediately via `skipWaiting()` + `clients.claim()`.
- The app silently picks up the new version on the next in-app navigation.
- RxDB migrations run before the new route renders, ensuring data compatibility.

---

## 5. GitHub Pages Deployment

### Repository Setup

| Setting | Value |
|---------|-------|
| Repository | `github.com/[owner]/base-skill` |
| Pages source | **GitHub Actions** (not a branch) |
| Default URL | `https://[owner].github.io/base-skill/` |
| Base path | `/base-skill/` |

### Routing on GitHub Pages

GitHub Pages serves only static files; there is no server to redirect unknown paths to `index.html`. Two options are supported:

#### Option A: Hash-Based Routing (recommended for simplest setup)

Use TanStack Router's `createHashHistory()`. All navigation uses the URL hash (`/#/route`), which never hits the server:

```typescript
// src/router.ts
import { createHashHistory, createRouter } from '@tanstack/react-router'

const hashHistory = createHashHistory()

export const router = createRouter({
  routeTree,
  history: hashHistory,
})
```

#### Option B: Clean URLs via 404 Redirect

Add a `public/404.html` that mirrors `index.html`. GitHub Pages serves `404.html` for unknown paths; the SPA then handles routing client-side. This enables clean URLs (`/games/math`) at the cost of an extra redirect:

```html
<!-- public/404.html -->
<!doctype html>
<html>
  <head>
    <script>
      // Redirect to index with path encoded as query param
      const path = location.pathname
      location.replace('/?redirect=' + encodeURIComponent(path) + location.hash)
    </script>
  </head>
</html>
```

```typescript
// src/main.tsx — decode redirect on load
const params = new URLSearchParams(window.location.search)
const redirect = params.get('redirect')
if (redirect) {
  window.history.replaceState(null, '', redirect)
}
```

### Custom Domain

1. Add a `public/CNAME` file containing the custom domain (e.g., `baseskill.app`).
2. In `vite.config.ts`, set `base: '/'` when building for the custom domain.
3. Update the GitHub Pages custom domain setting in the repository settings.
4. Update the deploy workflow to pass `APP_BASE_URL=/` environment variable.

### Vite Base URL Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.APP_BASE_URL ?? '/base-skill/',
})
```

For the default GitHub Pages deploy, `APP_BASE_URL` is not set and defaults to `/base-skill/`. For a custom domain deploy, set `APP_BASE_URL=/` in the workflow.

---

## 6. Build Output

Running `npm run build` produces a `dist/` directory:

```
dist/
  index.html              # Entry point; contains SW registration + manifest link
  assets/
    index-[hash].js       # Main application bundle
    index-[hash].css      # Compiled CSS
    vendor-[hash].js      # Third-party dependencies (React, TanStack, RxDB, …)
  games/
    math-[hash].js        # Math game chunk (lazy-loaded)
    reading-[hash].js     # Reading game chunk (lazy-loaded)
    …                     # Additional game chunks
  icons/
    icon-192.png
    icon-512.png
    apple-touch-icon.png
  manifest.json           # PWA web app manifest
  sw.js                   # Service Worker (generated by vite-plugin-pwa / Workbox)
  sw-register.js          # SW registration helper
  version.json            # Build metadata (stamped by CI)
```

Key properties of the build output:

- **All JS/CSS files are content-hashed.** Filenames change when content changes, enabling aggressive cache-busting with `Cache-Control: max-age=31536000, immutable` on `assets/`.
- **`index.html` is not hashed** and should be served with `Cache-Control: no-cache` to ensure browsers always fetch the latest entry point.
- **`sw.js` is not hashed** (SW files must have stable URLs) but contains an internal version hash that Workbox uses to detect updates.
- **`version.json`** is stamped by CI and served with `Cache-Control: no-cache`.
- **`manifest.json`** is served as-is from `public/`.

---

## 7. Portability — Deploying to Other Hosts

The `dist/` output is a standard static SPA. All SPAs require the host to serve `index.html` for any path that does not match a static file (SPA fallback).

| Host | Steps |
|------|-------|
| **Netlify** | Connect GitHub repo or drag-drop `dist/`. Add `public/_redirects`: `/* /index.html 200`. Build command: `npm run build`. Publish directory: `dist`. |
| **Vercel** | `npx vercel --prod` or connect GitHub repo. Add `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`. Framework preset: `Vite`. |
| **Cloudflare Pages** | Connect GitHub repo. Build command: `npm run build`. Output directory: `dist`. Add `public/_redirects`: `/* /index.html 200`. |
| **AWS S3 + CloudFront** | Upload `dist/` to S3 bucket. Configure CloudFront error pages: 403/404 → `/index.html` with 200 status. Set `index.html` to `no-cache`. |
| **Any static host** | Serve `dist/`. Configure the host to return `index.html` (HTTP 200) for all requests that don't match a file. This is the SPA fallback / "try_files" pattern. |

### `_redirects` file (Netlify / Cloudflare Pages)

```
# public/_redirects
/*    /index.html    200
```

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> These files are committed to `public/` so they are included in every build. They are no-ops on GitHub Pages (which uses the hash-router or 404-redirect strategy instead).

---

## 8. Commit and Branch Strategy

### Workflow

BaseSkill uses **trunk-based development**:

1. All development happens in short-lived feature branches branched from `main`.
2. Feature branches are merged to `main` via pull request.
3. `main` is always in a deployable state. Every commit on `main` has passing CI.
4. No long-lived branches (no `develop`, `staging`, etc.).

### Commit Convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or user-visible functionality |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |
| `chore:` | Build, tooling, dependency updates |
| `refactor:` | Code change that neither adds a feature nor fixes a bug |
| `perf:` | Performance improvement |
| `ci:` | CI/CD configuration changes |

Examples:
```
feat: add number recognition game for ages 3-5
fix: correct score persistence after SW cache clear
docs: add deployment guide for Cloudflare Pages
test: add accessibility tests for game selection screen
chore: upgrade Playwright to 1.44
```

### Changelog

Changelogs are auto-generated from Conventional Commits on release:

```bash
npx conventional-changelog-cli -p angular -i CHANGELOG.md -s
```

### Release Process

1. Determine next version following semver (`MAJOR.MINOR.PATCH`).
2. Update `"version"` in `package.json`.
3. Run `npm run build` locally to verify.
4. Commit: `chore: release v1.2.0`.
5. Tag: `git tag v1.2.0 && git push origin v1.2.0`.
6. CI deploys automatically on push to `main`.

> No automated version bumping (no `semantic-release`). Versions are bumped manually to keep release decisions intentional.

---

## 9. Branch Protection Rules

Configure in **GitHub › Repository › Settings › Branches › Add branch protection rule** for `main`:

| Rule | Setting |
|------|---------|
| Require pull request before merging | ✅ Enabled |
| Required approving reviews | 1 (for community PRs; maintainers may self-merge) |
| Dismiss stale pull request approvals when new commits are pushed | ✅ Enabled |
| Require status checks to pass before merging | ✅ Enabled |
| Required status checks | `lint`, `typecheck`, `unit-test`, `build` |
| Require branches to be up to date before merging | ✅ Enabled |
| Require conversation resolution before merging | ✅ Enabled |
| Do not allow bypassing the above settings | ✅ Enabled (enforce for admins too) |
| Allow force pushes | ❌ Disabled |
| Allow deletions | ❌ Disabled |

### Status Checks Reference

The required status checks correspond to job names in `ci.yml`:

```
lint          → job: lint
typecheck     → job: typecheck
unit-test     → job: unit-test
build         → job: build
```

E2E and visual-regression jobs are **not** required checks (they run post-merge or on `main`) to avoid blocking PRs on slower browser tests. However, E2E failures on `main` trigger a notification and block the next deploy attempt.

---

## 10. Environment Variables

All `VITE_*` variables are **embedded in the client bundle at build time**. They are visible to anyone who inspects the JavaScript bundle. Do not store secrets here. Only store public client IDs, public URLs, and feature flags.

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `VITE_APP_VERSION` | Injected by Vite from `package.json` | App version string — available as `import.meta.env.VITE_APP_VERSION` |
| `VITE_GOOGLE_CLIENT_ID` | GitHub Actions secret → CI env | Google OAuth client ID (public; safe to embed in bundle) |
| `VITE_ONEDRIVE_CLIENT_ID` | GitHub Actions secret → CI env | OneDrive / MSAL.js client ID (public; safe to embed) |
| `VITE_CF_WORKER_URL` | GitHub Actions secret → CI env | Cloudflare Worker OAuth proxy URL |
| `VITE_ANALYTICS_PROVIDER` | GitHub Actions variable (optional) | Analytics provider selection; defaults to `noop` (no analytics) |

### Local Development

Create a `.env.local` file (gitignored) for local overrides:

```bash
# .env.local — NOT committed to git
VITE_GOOGLE_CLIENT_ID=your-local-client-id
VITE_ONEDRIVE_CLIENT_ID=your-local-msal-client-id
VITE_CF_WORKER_URL=http://localhost:8787
VITE_ANALYTICS_PROVIDER=noop
```

### Adding a Secret to CI

1. Go to **GitHub › Repository › Settings › Secrets and variables › Actions**.
2. Add the secret under **Repository secrets**.
3. Reference it in the workflow:

```yaml
env:
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
```

### Type Safety for Env Variables

Declare env vars in `src/vite-env.d.ts` for TypeScript autocompletion:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_ONEDRIVE_CLIENT_ID: string
  readonly VITE_CF_WORKER_URL: string
  readonly VITE_ANALYTICS_PROVIDER: 'noop' | 'plausible' | 'umami'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

*This document is the authoritative reference for BaseSkill's CI/CD pipeline. Update it when workflows, deployment targets, or versioning strategies change.*
