import { expect, test } from '@playwright/test';

test('@visual home page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});
