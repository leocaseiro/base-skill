import { expect, test } from '@playwright/test';

// WordLibraryExplorer has no app route — these flows are exercised via its
// Storybook story. Run this spec against a Storybook dev server on 6006:
//
//   yarn storybook &  # port 6006
//   PLAYWRIGHT_BASE_URL=http://127.0.0.1:6006 \
//     yarn playwright test e2e/wordlibrary-explorer.spec.ts
//
// Skipped by default so the usual `yarn playwright test` (which builds the app
// and serves /dist) does not 404 on /iframe.html.
const STORY_URL =
  '/iframe.html?id=data-wordlibraryexplorer--default&viewMode=story';

test.describe.skip('WordLibraryExplorer mobile + blender', () => {
  test.use({ viewport: { width: 414, height: 736 } });

  test('filter sheet opens, pill removal, blender highlights active letter', async ({
    page,
  }) => {
    await page.goto(STORY_URL);

    await page.getByRole('button', { name: 'Open filters' }).click();
    await expect(
      page.getByRole('dialog').getByText('Filters'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'L1' }).first().click();
    await page.keyboard.press('Escape');

    const pillRow = page.getByTestId('active-filter-pills');
    await expect(pillRow.getByText('L1')).toBeVisible();

    await pillRow
      .getByRole('button', { name: /remove/i })
      .first()
      .click();
    await expect(pillRow.getByText('L1')).toHaveCount(0);

    const blender = page.getByRole('slider').first();
    const box = await blender.boundingBox();
    if (!box) throw new Error('blender not visible');
    await page.mouse.move(
      box.x + box.width * 0.1,
      box.y + box.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width * 0.5,
      box.y + box.height / 2,
    );
    await expect(blender).toHaveAttribute(
      'aria-valuenow',
      /^(?!0$)\d+$/,
    );
    await page.mouse.up();
  });

  test('sustained audio stops when tab visibility changes', async ({
    page,
  }) => {
    await page.goto(STORY_URL);

    const chips = page.getByTestId('chips-row').first();
    await chips.getByRole('button').first().click();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(100);

    const stillPlaying = await page.evaluate(
      () =>
        (
          globalThis as unknown as {
            __phonemeAudioState?: { currentSource: unknown | null };
          }
        ).__phonemeAudioState?.currentSource !== null,
    );
    expect(stillPlaying).toBeFalsy();
  });
});
