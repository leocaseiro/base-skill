import { expect, test } from '@playwright/test';

test('@visual home page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/math-addition');
  // Wait for the GameShell chrome to appear
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Wait for the exit button to appear
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', {
    fullPage: true,
  });
});
