import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('kid flow: tap a default card, see instructions, play without saving', async ({
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
  await letsGo.click();

  // Save-on-play prompt asks whether to save these settings as a custom game.
  await expect(
    page.getByText(/save these settings as a custom game\?/i),
  ).toBeVisible();

  // Kid opts out — go straight into the game.
  await page
    .getByRole('button', { name: /play without saving/i })
    .click();

  // Game mounts — the instructions overlay is gone.
  await expect(
    page.getByRole('dialog', { name: /game instructions/i }),
  ).toBeHidden();
});
