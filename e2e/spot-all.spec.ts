import { expect, test } from '@playwright/test';

test('spot-all full flow', async ({ page }) => {
  await page.goto('/en/game/spot-all?seed=e2e-spot-all-1');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Dismiss instructions overlay.
  const startButton = page.getByRole('button', { name: /let's go/i });
  await startButton.waitFor({ state: 'visible' });
  await startButton.click();

  // Dismiss the "Save as custom game?" dialog if it appears.
  const playWithoutSaving = page.getByRole('button', {
    name: /play without saving/i,
  });
  if (await playWithoutSaving.isVisible().catch(() => false)) {
    await playWithoutSaving.click();
  }

  // Wait for the grid tiles to appear.
  await page.locator('button[aria-pressed]').first().waitFor();

  // Tap every tile whose visible label matches the prompt target.
  // The prompt text reads "Select all the X tiles" — extract X.
  const promptEl = page
    .locator('p')
    .filter({ hasText: /Select all the/ });
  await promptEl.waitFor({ state: 'visible' });
  const promptText = await promptEl.first().textContent();
  const match = promptText?.match(/Select all the (\S+) tiles/);
  expect(match).not.toBeNull();
  const target = match![1]!;

  const tiles = page.locator('button[aria-pressed]');
  const count = await tiles.count();
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i);
    const raw = await tile.textContent();
    const tileText = raw?.trim() ?? '';
    if (tileText === target) await tile.click();
  }

  // Round-complete + advance happens within ~1s. Wait for either a new
  // prompt or the game-over Play Again button.
  await Promise.race([
    page
      .getByRole('button', { name: /play again/i })
      .waitFor({ state: 'visible', timeout: 5000 }),
    page
      .locator('button[aria-pressed]')
      .first()
      .waitFor({ state: 'attached', timeout: 5000 }),
  ]);
});
