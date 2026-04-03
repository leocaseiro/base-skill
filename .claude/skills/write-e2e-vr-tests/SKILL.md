---
name: write-e2e-vr-tests
description: Use when adding Playwright E2E or visual regression (VR) tests in this project — covers file placement, test anatomy, VR screenshot workflow, Docker requirement, and the pre-push gate
---

# Write E2E and VR Tests

## Overview

E2E tests use Playwright and live in `e2e/`. VR (visual regression) tests are a subset tagged `@visual` inside `e2e/visual.spec.ts`. VR tests run inside Docker to match CI screenshots exactly.

## File Placement

| Test type          | File                 |
| ------------------ | -------------------- |
| Smoke / functional | `e2e/smoke.spec.ts`  |
| Accessibility      | `e2e/a11y.spec.ts`   |
| Visual regression  | `e2e/visual.spec.ts` |

Add new VR tests to `e2e/visual.spec.ts`. Add new functional E2E tests to `e2e/smoke.spec.ts` or a new file if the area warrants it.

## Anatomy of a Functional E2E Test

```ts
import { expect, test } from '@playwright/test';

test('game catalog renders', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(
    page.getByRole('group', { name: /filter by grade level/i }),
  ).toBeVisible();
});
```

**Rules:**

- Always wait for a stable element (`waitFor({ state: 'visible' })`) before asserting
- Use role-based selectors (`getByRole`, `getByLabel`) over CSS classes
- Locale prefix is `/en/` in tests (Playwright `webServer` sets `APP_BASE_URL=/`)

## Anatomy of a VR Test

```ts
import { expect, test } from '@playwright/test';

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', {
    fullPage: true,
  });
});
```

**Rules:**

- Tag with `@visual` at the start of the test name — the pre-push hook filters on this
- Call `waitFor({ state: 'visible' })` on the main content before screenshotting
- Use a descriptive, kebab-case filename for the `.png` baseline

## Running VR Tests

```bash
# Run VR tests (Docker required)
yarn test:vr

# Update baselines after intentional UI changes
yarn test:vr:update
```

**Docker must be running.** If Docker is unavailable the check is skipped with a warning.

## VR Review Workflow

1. `yarn test:vr` prints diff PNG paths on failure
2. Read the diff images (Claude can open PNGs with the Read tool)
3. **Intentional change?** → `yarn test:vr:update`, commit updated baselines
4. **Bug?** → fix the code, then re-run

## Pre-Push Gate

The `.husky/pre-push` hook runs in this order: lint → typecheck → unit → storybook → VR → E2E.

Skip flags when needed (document the reason):

```bash
SKIP_VR=1 git push       # skip VR only
SKIP_E2E=1 git push      # skip E2E only
SKIP_VR=1 SKIP_E2E=1 git push
```

## Common Mistakes

| Mistake                               | Fix                                                             |
| ------------------------------------- | --------------------------------------------------------------- |
| No `waitFor` before screenshot        | Add `waitFor({ state: 'visible' })` on main content             |
| VR test not tagged `@visual`          | Prepend `@visual` to the test name                              |
| Running `yarn test:vr` without Docker | Start Docker desktop first                                      |
| Committing without updating baselines | Run `yarn test:vr:update` after intentional UI changes          |
| Hardcoding absolute URLs              | Use relative paths like `/en/`; Playwright handles the base URL |
