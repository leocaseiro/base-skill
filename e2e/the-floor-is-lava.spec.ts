import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';
import type { Page } from '@playwright/test';

/**
 * End-to-end discoverability test for the seeded "The Floor is Lava"
 * custom game (PR feat/multi-skin-config, Task 16).
 *
 * Exercises the full user-visible path:
 *   1. Open the home grid → confirm the seeded card is present
 *      (the home-screen mount triggers `seedTheFloorIsLavaIfNeeded`).
 *   2. Tap the card → game route loads with `configId=seed:tfil:anonymous`.
 *   3. Dismiss the InstructionsOverlay via "Let's go".
 *   4. Confirm the Dragon Cave scene is in the DOM via its `.skin-dragon-cave`
 *      class hook (the skin prop passed through from the resolved config).
 *   5. Spell the first round's word by clicking letter tiles (which
 *      auto-place in the next empty slot via `placeInNextSlot`) and
 *      assert the `Round complete!` status fires.
 *
 * The seeded config uses `DEFAULT_RECALL_CONFIG`: recall mode +
 * `tileBankMode: 'exact'` + `wrongTileBehavior: 'lock-auto-eject'`.
 * "Exact" tile-bank mode means the bank carries only the letters of the
 * current word (no distractors). Clicking a bank tile invokes
 * `useDraggableTile.handleClick → placeInNextSlot`, which places the
 * tile in the lowest-index available slot — much more reliable in
 * headless than HTML5-drag dispatch, which races with
 * pragmatic-drag-and-drop's event detection across worker pools.
 *
 * Wrong placements transit the slot during a 350 ms shake before being
 * auto-ejected back to the bank (~1 s total). Each click is followed by
 * a poll that decides whether the placement stuck (correct, the
 * filled-slot count incremented) or bounced (wrong, the count is
 * unchanged after the eject window).
 *
 * The `roundComplete` engine phase is brief (~750 ms before auto-advance
 * to the next round), so we install a MutationObserver before placing
 * any tiles. The observer latches `true` the first time a node matching
 * `role="status"` with the "Round complete!" label is attached. After
 * the play loop finishes we assert against that latch instead of racing
 * the live DOM.
 */

const EJECT_WINDOW_MS = 1800;

/** Slot count for the current round; used as the word length. */
const countSlots = async (page: Page): Promise<number> => {
  const slots = page.getByRole('listitem', {
    name: /^Slot \d+, /i,
  });
  await slots.first().waitFor({ state: 'visible' });
  return slots.count();
};

/** Count of slots whose aria-label reports `filled with …`. */
const countFilledSlots = async (page: Page): Promise<number> =>
  page
    .getByRole('listitem', { name: /^Slot \d+, filled with /i })
    .count();

/** Unique letter labels currently sitting in the tile bank. */
const availableBankLetters = async (
  page: Page,
): Promise<readonly string[]> => {
  const tiles = page.getByRole('button', { name: /^Letter /i });
  const labels = await tiles.evaluateAll((nodes) =>
    nodes
      .map((n) =>
        (n.getAttribute('aria-label') ?? '').replace(/^Letter /i, ''),
      )
      .map((l) => l.toLowerCase()),
  );
  return [...new Set(labels)];
};

/**
 * Install a window-level latch that turns true the first time a
 * `role="status"` element labelled "Round complete!" appears in the DOM.
 * The `roundComplete` engine phase only lasts ~750 ms before the engine
 * auto-advances to the next round, so a post-hoc query would race with
 * the engine. The latch captures the moment regardless of when the test
 * gets around to checking.
 */
const installRoundCompleteLatch = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const SELECTOR = 'div[role="status"][aria-label="Round complete!"]';
    const w = globalThis as unknown as {
      __roundCompleteFired?: boolean;
      __roundCompleteObserver?: MutationObserver;
    };
    w.__roundCompleteFired = false;
    const scan = (root: ParentNode): boolean => {
      if (
        root instanceof HTMLElement &&
        root.matches('div[role="status"][aria-label="Round complete!"]')
      ) {
        return true;
      }
      return root.querySelector(SELECTOR) !== null;
    };
    if (scan(document.body)) {
      w.__roundCompleteFired = true;
      return;
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement && scan(node)) {
            w.__roundCompleteFired = true;
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    w.__roundCompleteObserver = observer;
  });
};

const readRoundCompleteLatch = async (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const w = globalThis as unknown as {
      __roundCompleteFired?: boolean;
    };
    return w.__roundCompleteFired === true;
  });

/**
 * Click a single bank letter and wait for the placement outcome.
 *
 * Returns `'correct'` if the click increased the filled-slot count past
 * the eject window (the tile took an empty slot and stayed). Returns
 * `'wrong'` if the count was unchanged after the eject window (the tile
 * was wrong and ejected back to the bank). Returns `'round-complete'`
 * if the round-complete latch fires during the wait — in that case the
 * test should stop placing tiles immediately.
 *
 * Click is preferred over drag-and-drop in headless: pragmatic-drag-and-drop
 * uses HTML5 drag events, and Playwright's `mouse.down/move/up` does not
 * reliably trigger them in every browser/worker-pool combo. The click
 * path goes through `useDraggableTile.handleClick → placeInNextSlot`
 * which is a synchronous reducer dispatch.
 *
 * Wrong placements transit the slot during a 350 ms shake before being
 * auto-ejected back to the bank (~1 s total). Both correct and wrong
 * placements incrementally show the slot as `filled with X` at first;
 * the only way to tell them apart is to wait past the eject window and
 * re-read the count.
 */
const clickLetterAndAwaitOutcome = async (
  page: Page,
  letter: string,
  filledBefore: number,
): Promise<'correct' | 'wrong' | 'round-complete'> => {
  const tile = page
    .getByRole('button', { name: `Letter ${letter}` })
    .first();
  await tile.waitFor({ state: 'visible' });
  await tile.click();

  // Poll for the full eject window. Resolve early if the round-complete
  // latch fires (correct placement that finished the round) — the engine
  // auto-advances the round 750 ms later, so further reads would race.
  return page.evaluate(
    ({ filled, timeoutMs }) =>
      new Promise<'correct' | 'wrong' | 'round-complete'>((resolve) => {
        const w = globalThis as unknown as {
          __roundCompleteFired?: boolean;
        };
        const start = Date.now();
        const poll = () => {
          if (w.__roundCompleteFired === true) {
            resolve('round-complete');
            return;
          }
          if (Date.now() - start > timeoutMs) {
            const count = document.querySelectorAll(
              'li[aria-label^="Slot "][aria-label*="filled with "]',
            ).length;
            resolve(count > filled ? 'correct' : 'wrong');
            return;
          }
          setTimeout(poll, 100);
        };
        poll();
      }),
    { filled: filledBefore, timeoutMs: EJECT_WINDOW_MS },
  );
};

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('full play-through: open The Floor is Lava from home, complete a round', async ({
  page,
}) => {
  // 1. Home renders → seeder runs → card appears.
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  const card = page.getByRole('button', {
    name: 'Play The Floor is Lava',
  });
  await expect(card).toBeVisible();

  // 2. Tap the card → game route mounts.
  await card.click();
  await page.getByRole('main').waitFor({ state: 'visible' });

  // 3. Dismiss InstructionsOverlay (custom game → no save prompt).
  await startGame(page);

  // 4. Dragon Cave scene is wired up. The class lives on the scene
  // wrapper rendered by `dragonCaveSkin.SceneBackground`.
  await expect(page.locator('.skin-dragon-cave')).toBeVisible();

  // 5. Tiles + slots ready → spell the word.
  await page
    .getByRole('button', { name: /^Letter /i })
    .first()
    .waitFor({ state: 'visible' });

  // Install the latch before the first click so we catch the
  // ScoreAnimation mount even if the test is busy in `evaluate` when
  // the engine fires `roundComplete`.
  await installRoundCompleteLatch(page);

  const wordLength = await countSlots(page);
  expect(
    wordLength,
    'recall mode should render at least one slot',
  ).toBeGreaterThan(0);

  // Trial loop: pick a candidate letter from the bank, click it, and
  // observe whether the filled-slot count advanced. Stop as soon as
  // the round-complete latch fires (the engine auto-advances to the
  // next round ~750 ms later, so we must not keep clicking past that).
  // `triedWrong` resets after every correct placement — the next slot
  // may accept a letter the previous slot rejected.
  const spelled: string[] = [];
  let triedWrong = new Set<string>();
  const maxAttempts = wordLength * 6; // generous upper bound
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await readRoundCompleteLatch(page)) break;

    const filledBefore = await countFilledSlots(page);
    if (filledBefore >= wordLength) {
      // Either the round is about to complete (latch will catch up) or
      // every slot is filled correctly — both end the play loop.
      break;
    }

    const available = await availableBankLetters(page);
    const candidates = available.filter((l) => !triedWrong.has(l));
    if (candidates.length === 0) {
      throw new Error(
        `bank exhausted at filledBefore=${filledBefore}; tried=${[...triedWrong].join(',')}`,
      );
    }

    const letter = candidates[0]!;
    const outcome = await clickLetterAndAwaitOutcome(
      page,
      letter,
      filledBefore,
    );

    if (outcome === 'correct' || outcome === 'round-complete') {
      spelled.push(letter);
      triedWrong = new Set();
      if (outcome === 'round-complete') break;
    } else {
      triedWrong.add(letter);
    }
  }

  // 6. The round-complete status (ScoreAnimation) mounts when the engine
  // transitions to phase `roundComplete`. The phase auto-advances after
  // ~750 ms, but the latch installed above captures the mount regardless
  // of when this poll runs.
  await expect
    .poll(async () => await readRoundCompleteLatch(page), {
      message:
        'Round complete status (role="status" / aria-label="Round complete!") should have fired after the final correct placement',
      timeout: 5000,
    })
    .toBe(true);

  // Sanity: spelled letters reflect what was placed. Length should
  // equal the round 1 slot count, each entry a single lowercase letter.
  expect(spelled.length).toBe(wordLength);
  for (const letter of spelled) {
    expect(letter).toMatch(/^[a-z]$/);
  }
});
