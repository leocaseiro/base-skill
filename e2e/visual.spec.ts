import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';
import type { Page } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_PORTRAIT_VIEWPORT = { width: 768, height: 1024 };

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
    .getByRole('button', { name: /^Play / })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('@visual home page dark', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('button', { name: /^Play / })
    .first()
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
  await startGame(page);
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
  await startGame(page);
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
  await startGame(page);
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
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group-dark.png',
    { fullPage: true },
  );
});

test('@visual NumberMatch numeral-to-group layout mobile', async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/en/game/number-match');
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group-mobile.png',
    { fullPage: true },
  );
});

test('@visual NumberMatch numeral-to-group layout tablet portrait', async ({
  page,
}) => {
  await page.setViewportSize(TABLET_PORTRAIT_VIEWPORT);
  await page.goto('/en/game/number-match');
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'number-match-numeral-to-group-tablet-portrait.png',
    { fullPage: true },
  );
});

type NumberMatchPair = { from: string; to: string };

const MODE_TO_PAIR: Record<string, NumberMatchPair> = {
  'group-to-numeral': { from: 'group', to: 'numeral' },
  'cardinal-number-to-text': { from: 'numeral', to: 'word' },
  'ordinal-number-to-text': { from: 'ordinal', to: 'word' },
};

async function selectNumberMatchMode(
  page: Page,
  mode: string,
): Promise<void> {
  const pair = MODE_TO_PAIR[mode];
  if (!pair) throw new Error(`Unhandled NumberMatch mode: ${mode}`);
  await page.goto('/en/game/number-match');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  // InstructionsOverlay renders NumberMatchSimpleConfigForm inline —
  // change the pair via its "what you see" / "what you match" selects.
  await page.getByLabel('what you see').selectOption(pair.from);
  await page.getByLabel('what you match').selectOption(pair.to);
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
}

// Fixes the `group-to-numeral` regression: dot-group shown as question,
// numeric tiles in the bank, square slot matching the numeric answer style.
test('@visual NumberMatch group-to-numeral layout', async ({
  page,
}) => {
  await selectNumberMatchMode(page, 'group-to-numeral');
  await expect(page).toHaveScreenshot(
    'number-match-group-to-numeral.png',
    { fullPage: true },
  );
});

// One cardinal word-tile mode — verifies word rendering in tiles/slots.
test('@visual NumberMatch cardinal-number-to-text layout', async ({
  page,
}) => {
  await selectNumberMatchMode(page, 'cardinal-number-to-text');
  await expect(page).toHaveScreenshot(
    'number-match-cardinal-number-to-text.png',
    { fullPage: true },
  );
});

// One ordinal mode — exercises ordinal word conversion path.
test('@visual NumberMatch ordinal-number-to-text layout', async ({
  page,
}) => {
  await selectNumberMatchMode(page, 'ordinal-number-to-text');
  await expect(page).toHaveScreenshot(
    'number-match-ordinal-number-to-text.png',
    { fullPage: true },
  );
});

// Focused domino tile bank shots — isolate the vertical pip-based tiles
// (top/bottom 3x3 pip grids, horizontal divider, unified 72x136px size) from
// unrelated layout so regressions in the DominoTile are easy to spot.
test('@visual NumberMatch domino tile bank', async ({ page }) => {
  await page.goto('/en/game/number-match');
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  const tileBank = page.locator('[data-tile-bank]');
  await tileBank.waitFor({ state: 'visible' });
  await expect(tileBank).toHaveScreenshot(
    'number-match-domino-tile-bank.png',
  );
});

test('@visual NumberMatch domino tile bank dark', async ({ page }) => {
  await page.goto('/en/game/number-match');
  await startGame(page);
  await page
    .getByRole('button', { name: 'Hear the question' })
    .waitFor({ state: 'visible' });
  const tileBank = page.locator('[data-tile-bank]');
  await tileBank.waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(tileBank).toHaveScreenshot(
    'number-match-domino-tile-bank-dark.png',
  );
});

// Countable dots — the DotGroupQuestion renders individually tappable dots
// that assign sequential counts when tapped. Switch to group-to-numeral mode
// via the Settings panel before starting so dots are the question.
// Math.random is pinned to a constant so the round value (and therefore the
// dot count) is reproducible across runs, independent of how many times the
// config resolver consumes random state while the Settings panel opens.
async function openNumberMatchWithDots(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0.37;
  });
  await page.goto('/en/game/number-match');
  await page
    .getByRole('button', { name: /let's go/i })
    .waitFor({ state: 'visible' });
  await page.getByLabel('what you see').selectOption('group');
  await page.getByLabel('what you match').selectOption('numeral');
  await startGame(page);
  await page
    .getByRole('button', { name: /^Dot 1 of/i })
    .waitFor({ state: 'visible' });
}

test('@visual NumberMatch countable dots initial', async ({ page }) => {
  await openNumberMatchWithDots(page);
  const dotGroup = page
    .getByRole('button', { name: /^Dot 1 of/i })
    .locator('..');
  await expect(dotGroup).toHaveScreenshot(
    'number-match-countable-dots-initial.png',
  );
});

test('@visual NumberMatch countable dots partially tapped', async ({
  page,
}) => {
  await openNumberMatchWithDots(page);
  await page.getByRole('button', { name: /^Dot 1 of/i }).click();
  await page.getByRole('button', { name: /^Dot 2 of/i }).click();
  const dotGroup = page
    .getByRole('button', { name: /^Dot 1 of/i })
    .locator('..');
  await expect(dotGroup).toHaveScreenshot(
    'number-match-countable-dots-partial.png',
  );
});

// ── SortNumbers ──────────────────────────────────────────────────────────────

test('@visual SortNumbers mid-game layout', async ({ page }) => {
  await page.goto('/en/game/sort-numbers');
  await startGame(page);
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
  await startGame(page);
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await setDarkMode(page);
  await expect(page).toHaveScreenshot('sort-numbers-dark.png', {
    fullPage: true,
  });
});

test('@visual SortNumbers mid-game layout mobile', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/en/game/sort-numbers');
  await startGame(page);
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot('sort-numbers-mobile.png', {
    fullPage: true,
  });
});

test('@visual SortNumbers mid-game layout tablet portrait', async ({
  page,
}) => {
  await page.setViewportSize(TABLET_PORTRAIT_VIEWPORT);
  await page.goto('/en/game/sort-numbers');
  await startGame(page);
  await page
    .getByRole('button', { name: /^Number /i })
    .first()
    .waitFor({ state: 'visible' });
  await expect(page).toHaveScreenshot(
    'sort-numbers-tablet-portrait.png',
    { fullPage: true },
  );
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
  await startGame(page);
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
  await startGame(page);
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
