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
  // ?seed= pins the route loader's seed (validateSearch in $gameId.tsx) so
  // useLibraryRounds.pickWithRecycling produces the same round every run.
  await page.goto('/en/game/word-spell?seed=vr-word-spell-1');
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
  await page.goto('/en/game/word-spell?seed=vr-word-spell-1');
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
  await page.goto('/en/game/word-spell?seed=vr-word-spell-1');
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
  await page.goto('/en/game/word-spell?seed=vr-word-spell-1');
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

test('@visual spot-all happy-path layout', async ({ page }) => {
  await page.goto('/en/game/spot-all?seed=vr-spot-all-1');
  await page.getByRole('main').waitFor({ state: 'visible' });
  // Dismiss instructions overlay.
  const startBtn = page.getByRole('button', { name: /let's go/i });
  await startBtn.waitFor({ state: 'visible' });
  await startBtn.click();
  // Wait for the grid tiles to be present so the screenshot is stable.
  await page.locator('button[aria-pressed]').first().waitFor();
  await expect(page).toHaveScreenshot('spot-all-grid.png', {
    fullPage: true,
  });
});

// ── Dragon Cave skin (The Floor is Lava seeded custom game) ───────────────────
// The seeder writes a custom-game row with a deterministic id (see
// src/db/seed-the-floor-is-lava.ts) on the home-screen mount. Tests deep-link
// via `?configId=seed:tfil:anonymous` so the seed runs without a card click
// (skipping a navigation race) AND pin `?seed=...` so the round sampler is
// deterministic across runs (otherwise the tile bank shuffle drifts between
// `update` and `test`, producing perpetual diffs). The home route still mounts
// briefly to trigger the seeder before the game route mounts and resolves the
// configId.
//
// fullPage: false keeps each screenshot viewport-clamped so each baseline
// reflects what a user at that viewport sees (the scene has an intrinsic
// aspect-ratio + min-width that may overflow at narrower viewports).

const DRAGON_CAVE_CONFIG_ID = 'seed:tfil:anonymous';
const DRAGON_CAVE_SEED = 'vr-dragon-cave-1';

const DRAGON_CAVE_VIEWPORTS = [
  { width: 1024, height: 768, name: 'tablet-landscape' },
  { width: 768, height: 1024, name: 'tablet-portrait' },
  { width: 414, height: 896, name: 'mobile-lg' },
] as const;

const seedTheFloorIsLava = async (page: Page): Promise<void> => {
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });
  // Wait for the seeded card to appear in the home grid — confirms the
  // seeder finished writing the custom-game row before we navigate away.
  await page
    .getByRole('button', { name: 'Play The Floor is Lava' })
    .waitFor({ state: 'visible' });
};

// Functional regression for two bugs spotted on the live PR preview:
//   1. The .game-container.skin-dragon-cave box was constrained by
//      GameShell's padding so it never spanned the full viewport.
//   2. As a downstream effect, the 100cqi/962px scale on every child of
//      .skin-dragon-cave produced a smaller-than-natural scale at common
//      viewports, shrinking the HUD audio button and round-progress dots.
// Both assertions must FAIL on the broken layout and PASS after the
// skin-scoped CSS fix in dragon-cave-skin.tsx (position: fixed; inset: 0
// with width/height min() clamping to preserve the 2738:1536 cliff
// aspect-ratio via letterbox/pillarbox).
test('dragon-cave: container fills viewport + HUD scales up', async ({
  page,
}) => {
  const viewport = { width: 1024, height: 768 };
  await page.setViewportSize(viewport);
  await seedTheFloorIsLava(page);
  await page.goto(
    `/en/game/word-spell?configId=${DRAGON_CAVE_CONFIG_ID}&seed=${DRAGON_CAVE_SEED}`,
  );
  await startGame(page);
  const container = page.locator('.game-container.skin-dragon-cave');
  await container.waitFor({ state: 'visible' });

  // Bug 2 regression: cave is fixed-positioned so it breaks out of
  // GameShell's padded content area (was `position: relative`).
  await expect(container).toHaveCSS('position', 'fixed');

  // Bug 2 regression — empirical: container actually spans the full
  // viewport width on a 1024-wide window (pre-fix it was 992px = 1024
  // minus GameShell's 16px-each-side padding).
  const containerBox = await container.boundingBox();
  expect(containerBox, 'container should be visible').not.toBeNull();
  expect(
    containerBox!.width,
    'cave container should span the full viewport width',
  ).toBeGreaterThanOrEqual(viewport.width);

  // Bug 1 regression: with the container now wider than 962px, the
  // 100cqi/962px transform-scale on the audio button (intrinsic 56px =
  // size-14) must exceed natural size on a 1024-wide viewport. Pre-fix
  // the container was 992px so scale was 1.03 (56 -> 57.7); post-fix
  // it's 1024px so scale is 1.065 (56 -> 59.6). A >= 58 floor brackets
  // the regression cleanly without flaking on browser sub-pixel rounding.
  const audioBtn = page.getByRole('button', {
    name: /hear the question/i,
  });
  await audioBtn.waitFor({ state: 'visible' });
  const btnBox = await audioBtn.boundingBox();
  expect(btnBox, 'audio button should be visible').not.toBeNull();
  expect(
    btnBox!.height,
    'HUD audio button should render at least at intrinsic 56px (scale >= 1) on a 1024-wide viewport once the cave fills it',
  ).toBeGreaterThanOrEqual(58);
});

for (const vp of DRAGON_CAVE_VIEWPORTS) {
  test(`@visual dragon-cave scene at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await seedTheFloorIsLava(page);
    await page.goto(
      `/en/game/word-spell?configId=${DRAGON_CAVE_CONFIG_ID}&seed=${DRAGON_CAVE_SEED}`,
    );
    // InstructionsOverlay opens first; dismiss + handle any save prompt.
    await startGame(page);
    // Wait for a bank tile to appear so the dragon-cave scene is stable.
    await page
      .getByRole('button', { name: /^Letter /i })
      .first()
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot(
      `dragon-cave-scene-${vp.name}.png`,
      { fullPage: false },
    );
  });
}

// The skin radio is rendered inline inside InstructionsOverlay via the
// per-game SimpleConfigFormRenderer (WordSpellSimpleConfigForm) — no extra
// click required to expose it. We screenshot the radiogroup itself rather
// than the full overlay so the baseline isolates the picker UI from
// surrounding chrome (cover, cog, library source).
test('@visual word-spell-skin-picker — both options visible', async ({
  page,
}) => {
  await seedTheFloorIsLava(page);
  await page.goto(
    `/en/game/word-spell?configId=${DRAGON_CAVE_CONFIG_ID}&seed=${DRAGON_CAVE_SEED}`,
  );
  // Don't call startGame() — we want the overlay (with the simple form)
  // visible.
  const skinRadio = page.getByRole('radiogroup', { name: /skin/i });
  await skinRadio.waitFor({ state: 'visible' });
  await expect(skinRadio).toHaveScreenshot(
    'word-spell-skin-picker.png',
  );
});
