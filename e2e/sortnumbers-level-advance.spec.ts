import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';
import type { Page } from '@playwright/test';

/**
 * Regression for PR #357 manual smoke (handoff
 * `2026-05-12-pr-1b-resume-and-level-regressions.md`):
 *
 * SortNumbers default simple-config ships with `totalRounds: 1`,
 * `levelMode: { generateNextLevel }`, and NO `maxLevels` (see
 * `resolve-simple-config.ts:40,49,55`). Pre-PR 1b the reducer's
 * `resolveCompletionPhase` returned `'level-complete'` for this shape
 * — endless level mode of one round per level. PR 1b moved the
 * overlay gating onto `engine.phase` (camelCase), but
 * `useGameEngine.buildEngineGuards` reads `isLastRound` as
 * `roundIndex + 1 >= totalRounds` with no knowledge of level mode,
 * so the engine transitions to `gameOver` after the only round and
 * `LevelCompleteOverlay` never renders.
 *
 * After the fix, completing a round in the default simple config
 * must show the `Level N Complete!` dialog with an enabled
 * `Next Level` button, not the `Game complete` dialog.
 */

const placeTile = async (
  page: Page,
  tileLabel: number,
  slotIndex: number,
): Promise<void> => {
  const tile = page.getByRole('button', {
    name: `Number ${tileLabel}`,
  });
  const slot = page.getByRole('listitem', {
    name: new RegExp(`^Slot ${slotIndex}, empty`, 'i'),
  });
  const tileBox = await tile.boundingBox();
  const slotBox = await slot.boundingBox();
  if (!tileBox || !slotBox) {
    throw new Error(
      `tile or slot bounding box not resolved for Number ${tileLabel} → Slot ${slotIndex}`,
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
  await expect(
    page.getByRole('listitem', {
      name: new RegExp(
        `^Slot ${slotIndex}, filled with ${tileLabel}`,
        'i',
      ),
    }),
  ).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('SortNumbers default simple config shows Level Complete (not Game Over) after one round', async ({
  page,
}) => {
  // Default ascending start=2 step=2 quantity=5 → expected sequence 2,4,6,8,10
  // in slots 1..5.
  await page.goto('/en/game/sort-numbers');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await startGame(page);

  await placeTile(page, 2, 1);
  await placeTile(page, 4, 2);
  await placeTile(page, 6, 3);
  await placeTile(page, 8, 4);
  await placeTile(page, 10, 5);

  // Engine waits 750 ms in `roundComplete` before deciding the next
  // state. With the bug, after that timer the engine transitions to
  // `gameOver` and the `Game complete` dialog appears. After the
  // fix, the `Level 1 complete` dialog appears with an enabled
  // `Next Level` button.
  await expect(
    page.getByRole('dialog', { name: /^Level 1 complete/i }),
  ).toBeVisible({ timeout: 5000 });

  await expect(
    page.getByRole('button', { name: /^Next Level$/i }),
  ).toBeEnabled();

  // Belt-and-suspenders: the `Game complete` overlay must NOT be
  // showing. This is the symptom path the user reported.
  await expect(
    page.getByRole('dialog', { name: /^Game complete$/i }),
  ).toHaveCount(0);

  // Verify the user can actually progress to the next level (the
  // primary symptom in the bug report: "the Next level button does
  // not progress to the new level rounds"). After clicking, the
  // overlay closes and a fresh set of 5 empty slots appears.
  await page.getByRole('button', { name: /^Next Level$/i }).click();

  await expect(
    page.getByRole('dialog', { name: /^Level 1 complete/i }),
  ).toHaveCount(0);

  // New level should have 5 empty slots again. We don't pin the
  // exact numbers because `generateNextLevel` advances the sequence,
  // but slot 1 must exist and be empty.
  await expect(
    page.getByRole('listitem', { name: /^Slot 1, empty/i }),
  ).toBeVisible();
});
