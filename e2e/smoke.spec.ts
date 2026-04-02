import { expect, test } from '@playwright/test';

/** History router: home under default locale (Playwright webServer uses APP_BASE_URL=/). */
function localeHomePath(locale: string): string {
  return `/${locale}/`;
}

test('home page loads', async ({ page }) => {
  await page.goto(localeHomePath('en'));
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(page).toHaveTitle(/BaseSkill/);
});

test('game catalog renders', async ({ page }) => {
  await page.goto(localeHomePath('en'));
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(
    page.getByRole('group', { name: /filter by grade level/i }),
  ).toBeVisible();
});
