import type { Page } from '@playwright/test';

/**
 * Replace Math.random with a deterministic PRNG so game routes (round shuffle,
 * numeral bank order) produce stable layouts for Playwright screenshots and assertions.
 */
export async function seedMathRandom(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let seed = 1;
    Math.random = () => {
      seed = (seed * 16_807) % 2_147_483_647;
      return (seed - 1) / 2_147_483_646;
    };
  });
}
