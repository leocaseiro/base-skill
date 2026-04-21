import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

/**
 * Regression for plan 2026-04-21-wordspell-resume-desync:
 *
 * A user resumes WordSpell and sees letter tiles for a different word than
 * the one being spoken by the AudioButton (captured on-device: tiles spelled
 * `pant` while TTS said `sit`). The tiles belonged to a frozen draft of round
 * 2 of an earlier `roundOrder`; the audio came from a freshly-regenerated
 * `roundOrder` (round 7 of a new pool).
 *
 * After the fix, WordSpell persists its resolved `roundOrder` into
 * `session_history_index.initialContent` and prefers that over seed-based
 * regeneration on resume. Reloading mid-session must therefore render the
 * same tiles that were visible pre-reload.
 */
test('WordSpell resume keeps tiles aligned across app reloads', async ({
  page,
}) => {
  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await startGame(page);

  const tiles = page.getByRole('button', { name: /^Letter /i });
  await expect(tiles.first()).toBeVisible();

  const sortedLabels = async () => {
    const labels = await tiles.evaluateAll((nodes) =>
      nodes.map((n) =>
        (n.getAttribute('aria-label') ?? '').replace(/^Letter /i, ''),
      ),
    );
    return labels.map((label) => label.toLowerCase()).toSorted();
  };

  const tileLabelsBefore = await sortedLabels();
  expect(tileLabelsBefore.length).toBeGreaterThan(0);

  // The draft sync in useAnswerGameDraftSync debounces 500 ms, and the
  // initialContent patch fires once useLibraryRounds settles — wait past both.
  await page.waitForTimeout(900);

  await page.reload();
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(tiles.first()).toBeVisible();

  const tileLabelsAfter = await sortedLabels();
  // Core invariant: the resumed round must show the same letters as before
  // reload. A diverging set would mean the re-render used a regenerated
  // `roundOrder` that the AudioButton prompt also follows — i.e. the desync.
  expect(tileLabelsAfter).toEqual(tileLabelsBefore);
  await expect(
    page.getByRole('button', { name: 'Hear the question' }),
  ).toBeVisible();
});
