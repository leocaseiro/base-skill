import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('create and delete a custom game', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Open the first default card's cog (settings gear, bottom-right of the card).
  await page
    .getByRole('button', { name: /^settings$/i })
    .first()
    .click();

  // Save as a new custom game with a unique name.
  const uniqueName = `E2E Custom ${Date.now()}`;
  await page.getByPlaceholder(/skip by 2/i).fill(uniqueName);
  await page
    .getByRole('button', { name: /save as new custom game/i })
    .click();

  // Card for the new custom game appears on the home grid.
  const customCard = page.getByRole('button', {
    name: new RegExp(`play ${uniqueName}`, 'i'),
  });
  await expect(customCard).toBeVisible();

  // Open its cog, delete, confirm.
  const cogs = page.getByRole('button', { name: /^settings$/i });
  // The custom-card cog is the last one (custom cards render after defaults).
  await cogs.last().click();

  await page.getByRole('button', { name: /^delete$/i }).click();

  // Nested confirm dialog.
  await expect(
    page.getByText(
      new RegExp(String.raw`delete "${uniqueName}"\?`, 'i'),
    ),
  ).toBeVisible();
  // The destructive "Delete" button inside the confirm dialog.
  await page
    .getByRole('button', { name: /^delete$/i })
    .last()
    .click();

  // Card is gone after the RxDB reactive query re-emits.
  await expect(customCard).toHaveCount(0);
});
