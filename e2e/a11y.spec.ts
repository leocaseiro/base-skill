import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('@a11y accessibility', () => {
  test('home page has no detectable accessibility violations', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.getByRole('main').waitFor({ state: 'visible' });
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
