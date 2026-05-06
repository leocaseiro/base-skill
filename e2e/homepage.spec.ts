import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('kid flow: tap a default card, see instructions, play immediately (clean config)', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Tap the first default card on the grid.
  const card = page.getByRole('button', { name: /^Play / }).first();
  await card.click();

  // Instructions overlay appears with a "Let's go" button.
  const letsGo = page.getByRole('button', { name: /let's go/i });
  await expect(letsGo).toBeVisible();

  // No config edits — draft is clean. Let's go plays immediately without any dialog.
  await letsGo.click();

  // Game mounts — the instructions overlay is gone (no save prompt shown).
  await expect(
    page.getByRole('dialog', { name: /game instructions/i }),
  ).toBeHidden();
});
