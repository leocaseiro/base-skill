import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import type { Page } from '@playwright/test';

async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    // Suppress all CSS transitions before switching theme to avoid mid-animation screenshots
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

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

// ── Home ────────────────────────────────────────────────────────────────────

test('@visual home page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('@visual home page dark', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('group', { name: /filter by grade level/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('home-dark.png', {
    fullPage: true,
  });
});

// ── Game shell ───────────────────────────────────────────────────────────────

test('@visual game shell layout', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('game-shell.png', {
    fullPage: true,
  });
});

test('@visual game shell layout dark', async ({ page }) => {
  await page.goto('/en/game/word-spell');
  await page
    .getByRole('button', { name: /exit/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('game-shell-dark.png', {
    fullPage: true,
  });
});

// ── WordSpell ────────────────────────────────────────────────────────────────

test('@visual WordSpell picture mode mid-game layout', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('word-spell-picture-mode.png', {
    fullPage: true,
  });
});

test('@visual WordSpell picture mode mid-game layout dark', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'word-spell-picture-mode-dark.png',
    {
      fullPage: true,
    },
  );
});

// ── NumberMatch ──────────────────────────────────────────────────────────────

test('@visual NumberMatch numeral-to-group layout', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group.png',
    { fullPage: true },
  );
});

test('@visual NumberMatch numeral-to-group layout dark', async ({
  page,
}) => {
  await page.goto('/en/game/number-match');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group-dark.png',
    { fullPage: true },
  );
});

// ── SortNumbers ──────────────────────────────────────────────────────────────

test('@visual SortNumbers mid-game layout', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('sort-numbers.png', {
    fullPage: true,
  });
});

test('@visual SortNumbers mid-game layout dark', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page.getByRole('button', { name: /let's go/i }).click();
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('sort-numbers-dark.png', {
    fullPage: true,
  });
});

// ── InstructionsOverlay ──────────────────────────────────────────────────────

test('@visual InstructionsOverlay before start', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('instructions-overlay.png', {
    fullPage: true,
  });
});

test('@visual InstructionsOverlay before start dark', async ({
  page,
}) => {
  await page.goto('/en/game/sort-numbers');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('instructions-overlay-dark.png', {
    fullPage: true,
  });
});

// ── Slot drag preview ────────────────────────────────────────────────────────

test('@visual Slot drag preview target (empty slot hover)', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  const tileButton = page
    .getByRole('button', { name: /^Letter /i })
    .first();
  await tileButton.waitFor({ state: 'visible' });

  const tileBBox = await tileButton.boundingBox();
  if (!tileBBox) throw new Error('Tile bounding box not found');

  // Pick up the tile via pointer events
  const tileX = tileBBox.x + tileBBox.width / 2;
  const tileY = tileBBox.y + tileBBox.height / 2;
  await page.mouse.move(tileX, tileY);
  await page.mouse.down();

  // Move to the first empty slot
  const emptySlot = page.getByRole('listitem', {
    name: /^Slot 1, empty/i,
  });
  const slotBBox = await emptySlot.boundingBox();
  if (!slotBBox) throw new Error('Slot bounding box not found');

  const slotX = slotBBox.x + slotBBox.width / 2;
  const slotY = slotBBox.y + slotBBox.height / 2;
  await page.mouse.move(slotX, slotY, { steps: 5 });

  // Screenshot while dragging over the empty slot
  await expect(page).toHaveScreenshot('slot-drag-preview-target.png', {
    fullPage: true,
  });

  await page.mouse.up();
});

test('@visual Slot drag preview target dark (empty slot hover)', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('button', { name: /let's go/i }).click();
  const tileButton = page
    .getByRole('button', { name: /^Letter /i })
    .first();
  await tileButton.waitFor({ state: 'visible' });

  const tileBBox = await tileButton.boundingBox();
  if (!tileBBox) throw new Error('Tile bounding box not found');

  const tileX = tileBBox.x + tileBBox.width / 2;
  const tileY = tileBBox.y + tileBBox.height / 2;
  await page.mouse.move(tileX, tileY);
  await page.mouse.down();

  const emptySlot = page.getByRole('listitem', {
    name: /^Slot 1, empty/i,
  });
  const slotBBox = await emptySlot.boundingBox();
  if (!slotBBox) throw new Error('Slot bounding box not found');

  const slotX = slotBBox.x + slotBBox.width / 2;
  const slotY = slotBBox.y + slotBBox.height / 2;
  await page.mouse.move(slotX, slotY, { steps: 5 });

  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'slot-drag-preview-target-dark.png',
    { fullPage: true },
  );

  await page.mouse.up();
});
