import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = '__no-transitions';
    style.textContent =
      '*, *::before, *::after { transition: none !important; animation: none !important; }';
    document.head.append(style);

    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  });
}

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

  test('home page dark mode has no WCAG AA violations', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.getByRole('main').waitFor({ state: 'visible' });
    await page
      .getByRole('button', { name: /^Play / })
      .first()
      .waitFor({ state: 'visible' });
    await setDarkMode(page);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
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

  test('game page (word-spell) dark mode has no WCAG AA violations', async ({
    page,
  }) => {
    await page.goto('/en/game/word-spell');
    await page
      .getByRole('button', { name: /exit/i })
      .waitFor({ state: 'visible' });
    await setDarkMode(page);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
