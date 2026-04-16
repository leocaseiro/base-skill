import type { Page } from '@playwright/test';

/**
 * Clicks Let's go and dismisses the save-on-play custom game prompt if it
 * appears. Use in tests that don't exercise the save-prompt UX itself.
 */
export const startGame = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /let's go/i }).click();
  const playWithoutSaving = page.getByRole('button', {
    name: /play without saving/i,
  });
  try {
    await playWithoutSaving.waitFor({
      state: 'visible',
      timeout: 1000,
    });
    await playWithoutSaving.click();
  } catch {
    // No prompt — already a custom game or no unsaved settings.
  }
};
