import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

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

test('WordSpell picture mode renders letter tiles', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await startGame(page);
  const tiles = page.getByRole('button', { name: /^Letter /i });
  await expect(tiles.first()).toBeVisible();
});

test('NumberMatch numeral-to-group renders numeral question', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await startGame(page);
  await expect(
    page.getByRole('button', { name: 'Hear the question' }),
  ).toBeVisible();
});
