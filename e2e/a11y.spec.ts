import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('@a11y accessibility', () => {
  test('home page has no detectable accessibility violations', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.getByRole('main').waitFor({ state: 'visible' });
    await page
      .getByRole('button', { name: /^Play / })
      .first()
      .waitFor({ state: 'visible' });
    const accessibilityScanResults = await new AxeBuilder({
      page,
    }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('game page (word-spell) has no WCAG AA violations', async ({
    page,
  }) => {
    await page.goto('/en/game/word-spell');
    await page
      .getByRole('button', { name: /exit/i })
      .waitFor({ state: 'visible' });
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
