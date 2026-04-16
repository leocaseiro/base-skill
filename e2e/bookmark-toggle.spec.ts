import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('bookmark a default game, persist across navigation, then unbookmark', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  const addBookmark = page
    .getByRole('button', { name: /add bookmark/i })
    .first();
  await addBookmark.click();

  const removeBookmark = page
    .getByRole('button', { name: /remove bookmark/i })
    .first();
  await expect(removeBookmark).toHaveAttribute('aria-pressed', 'true');

  await page
    .getByRole('button', { name: /^settings$/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });

  await expect(
    page.getByRole('button', { name: /remove bookmark/i }).first(),
  ).toHaveAttribute('aria-pressed', 'true');

  await page
    .getByRole('button', { name: /remove bookmark/i })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: /add bookmark/i }).first(),
  ).toHaveAttribute('aria-pressed', 'false');
});
