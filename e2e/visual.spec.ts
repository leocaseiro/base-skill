import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('@visual home page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  // Wait for the exit button — signals the GameShell chrome is fully mounted
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', {
    fullPage: true,
  });
});

test('@visual WordSpell picture mode mid-game layout', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('word-spell-picture-mode.png', {
    fullPage: true,
  });
});

test('@visual NumberMatch numeral-to-group layout', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group.png',
    {
      fullPage: true,
    },
  );
});
