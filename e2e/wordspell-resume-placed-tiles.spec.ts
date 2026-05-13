import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';
import type { Locator, Page } from '@playwright/test';

/**
 * Regression for PR #357 manual smoke (handoff
 * `2026-05-12-pr-1b-resume-and-level-regressions.md`):
 *
 * The pre-existing `wordspell-resume-desync.spec.ts` validates that
 * the *letter set* of the round is preserved across reload. It does
 * NOT validate that *placed tiles* survive — the user can place two
 * tiles, refresh, and end up with the same letters all back in the
 * bank. Manual report: "Played 2 turns in a 5-letter round of
 * WordSpell, refreshed the page, was forced to restart the game
 * instead of resuming with 2 tiles already placed."
 *
 * After the fix, reloading mid-round must restore both the letters
 * AND the slot placements.
 */

const dragFirstAvailableLetterTo = async (
  page: Page,
  slotIndex: number,
): Promise<string> => {
  const tile = page.getByRole('button', { name: /^Letter /i }).first();
  const ariaLabel = (await tile.getAttribute('aria-label')) ?? '';
  const letter = ariaLabel.replace(/^Letter /i, '').toLowerCase();
  expect(letter, 'tile must expose a letter in aria-label').not.toBe(
    '',
  );

  const slot = page.getByRole('listitem', {
    name: new RegExp(`^Slot ${slotIndex}, empty`, 'i'),
  });
  const tileBox = await tile.boundingBox();
  const slotBox = await slot.boundingBox();
  if (!tileBox || !slotBox) {
    throw new Error(
      `bounding box not resolved for tile or slot ${slotIndex}`,
    );
  }
  await page.mouse.move(
    tileBox.x + tileBox.width / 2,
    tileBox.y + tileBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    slotBox.x + slotBox.width / 2,
    slotBox.y + slotBox.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  // Confirm the placement landed. If the tile bounces back to the
  // bank (slot stays "empty"), the test fails here, not on reload.
  await expect(
    page.getByRole('listitem', {
      name: new RegExp(`^Slot ${slotIndex}, filled`, 'i'),
    }),
  ).toBeVisible();

  return letter;
};

const slotFilledLabels = async (
  page: Page,
): Promise<readonly string[]> => {
  const filled: Locator = page.getByRole('listitem', {
    name: /^Slot \d+, filled with /i,
  });
  return filled.evaluateAll((nodes) =>
    nodes
      .map((n) => n.getAttribute('aria-label') ?? '')
      .map((label) => {
        const match = label.match(/^Slot (\d+), filled with (.+?)$/i);
        if (!match) return '';
        return `${match[1]}:${match[2]!.trim().toLowerCase()}`;
      })
      .filter((s) => s.length > 0)
      .toSorted(),
  );
};

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('WordSpell resume restores placed tiles across reload', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await startGame(page);

  // Place two letters in slots 1 and 2. The specific letters depend on
  // round 0's word; we capture them so we can compare placements
  // after reload.
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });

  const placedBefore = await (async () => {
    await dragFirstAvailableLetterTo(page, 1);
    await dragFirstAvailableLetterTo(page, 2);
    return slotFilledLabels(page);
  })();

  expect(
    placedBefore.length,
    'two slots should be filled before reload',
  ).toBe(2);

  // useAnswerGameDraftSync debounces 500 ms; initialContent write
  // fires once useLibraryRounds settles. Wait past both.
  await page.waitForTimeout(900);

  await page.reload();
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });

  // Core invariant: the placements that existed before reload must
  // still be visible. A diverging set means the game restarted the
  // round (bug) or staleDraft fired and wiped the draft (also bug).
  const placedAfter = await slotFilledLabels(page);
  expect(
    placedAfter,
    'reload must restore the exact slot placements',
  ).toEqual(placedBefore);

  // The recovery toast must NOT have fired — this would mean the
  // safety net wiped a valid draft.
  await expect(
    page.getByText(/Saved progress couldn't be restored/i),
  ).toHaveCount(0);
});
