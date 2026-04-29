import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import { startGame } from './start-game';
import type { Page } from '@playwright/test';

const SESSION_HISTORY_INDEX_IDB =
  'rxdb-dexie-baseskill-data--2--session_history_index';

/**
 * Seeds a pre-#130 drift scenario into the WordSpell in-progress session:
 *
 * 1. Strips `wordSpellRounds` / `roundOrder` from `initialContent` — the
 *    shape a session would have had before PR #130 started persisting them.
 * 2. Overwrites `draftState` with tiles and a `roundIndex` that cannot
 *    possibly align with any round in the current default pool (see
 *    `WORD_SPELL_ROUND_POOL` in `$gameId.tsx`). This mirrors the real-world
 *    capture from the plan fixture: tiles spelling `pant` while the resumed
 *    roundIndex points at a different word entirely.
 *
 * Returns the in-progress sessionId so the test can correlate assertions.
 */
const seedDriftedInProgressSession = async (
  page: Page,
): Promise<string> =>
  page.evaluate(async (dbName) => {
    const open = () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.addEventListener('success', () =>
          resolve(request.result),
        );
        request.addEventListener('error', () => reject(request.error));
      });
    const getAllDocs = (store: IDBObjectStore) =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.addEventListener('success', () =>
          resolve(request.result as unknown[]),
        );
        request.addEventListener('error', () => reject(request.error));
      });

    const db = await open();
    const tx = db.transaction('docs', 'readwrite');
    const store = tx.objectStore('docs');
    const docs = await getAllDocs(store);

    let targetSessionId = '';
    for (const raw of docs as Record<string, unknown>[]) {
      if (
        raw['gameId'] !== 'word-spell' ||
        raw['status'] !== 'in-progress'
      ) {
        continue;
      }
      targetSessionId = String(raw['sessionId'] ?? '');
      const initialContent: Record<string, unknown> = {
        ...(raw['initialContent'] as
          | Record<string, unknown>
          | undefined),
      };
      delete initialContent['wordSpellRounds'];
      delete initialContent['roundOrder'];

      const existingMeta = raw['_meta'] as
        | Record<string, number>
        | undefined;
      const mutated = {
        ...raw,
        initialContent,
        draftState: {
          allTiles: [
            { id: 't0', label: 'p', value: 'p' },
            { id: 't1', label: 'a', value: 'a' },
            { id: 't2', label: 'n', value: 'n' },
            { id: 't3', label: 't', value: 't' },
          ],
          bankTileIds: ['t0', 't1', 't2', 't3'],
          zones: [],
          activeSlotIndex: 0,
          phase: 'playing',
          roundIndex: 2,
          retryCount: 0,
          levelIndex: 0,
        },
        _meta: { ...existingMeta, lwt: Date.now() + 1 },
      };

      // `session_history_index` uses in-line keys (`sessionId`) — the IDB
      // entry holds the key inside the doc, so we must NOT pass an explicit
      // key argument to `put`.
      store.put(mutated);
    }

    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve());
      tx.addEventListener('error', () => reject(tx.error));
    });
    db.close();

    return targetSessionId;
  }, SESSION_HISTORY_INDEX_IDB);

/** Reads `draftState` for the in-progress WordSpell session straight out of IDB. */
const readDraftState = async (
  page: Page,
): Promise<Record<string, unknown> | null | undefined> =>
  page.evaluate(async (dbName) => {
    const open = () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.addEventListener('success', () =>
          resolve(request.result),
        );
        request.addEventListener('error', () => reject(request.error));
      });
    const db = await open();
    const tx = db.transaction('docs', 'readonly');
    const store = tx.objectStore('docs');
    const docs = await new Promise<unknown[]>((resolve, reject) => {
      const request = store.getAll();
      request.addEventListener('success', () =>
        resolve(request.result as unknown[]),
      );
      request.addEventListener('error', () => reject(request.error));
    });
    db.close();
    const match = (docs as Record<string, unknown>[]).find(
      (d) =>
        d['gameId'] === 'word-spell' && d['status'] === 'in-progress',
    );
    return (match?.['draftState'] ?? null) as Record<
      string,
      unknown
    > | null;
  }, SESSION_HISTORY_INDEX_IDB);

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

/**
 * Specifically reproduces the desync the smoke test above cannot: the default
 * WordSpell config in `$gameId.tsx` uses `roundsInOrder: true` with a
 * hardcoded 8-word pool, so `buildRoundOrder` is deterministic and a plain
 * reload never produces drift on its own.
 *
 * To trigger the pre-#130 bug we seed a real drift scenario directly into the
 * persisted session: strip `wordSpellRounds` / `roundOrder` from
 * `initialContent` (simulating a legacy session that predates the fix) and
 * overwrite `draftState` with tiles that cannot align with any round in the
 * current pool. After reload, the safety net in `WordSpell.tsx` must detect
 * the stale draft and recover to round 0 — tiles must spell `cat`, not the
 * seeded `pant`.
 */
test('WordSpell resume discards a drifted draft and recovers to round 0', async ({
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

  // Capture the initial round 0 letters before we tamper with state. The
  // default mode (recall + library) is no longer pinned to `cat`, so the
  // assertion has to be mode-agnostic: whatever letters round 0 has, the
  // safety net must restore exactly those.
  const round0Letters = await sortedLabels();
  expect(round0Letters.length).toBeGreaterThan(0);

  // Drag any tile into slot 1 so we have a realistic mid-round draft before
  // we inject drift. This proves the reset path actually clears placements
  // (not just tile labels) on recovery — a clean-slate test would pass even
  // if the safety net forgot to reset zones.
  const firstLetter = round0Letters[0]!;
  const firstTile = page.getByRole('button', {
    name: `Letter ${firstLetter}`,
  });
  const slot1Empty = page.getByRole('listitem', {
    name: /^Slot 1, empty/i,
  });
  const tileBox = await firstTile.boundingBox();
  const slotBox = await slot1Empty.boundingBox();
  if (!tileBox || !slotBox) {
    throw new Error('tile or slot bounding box not resolved');
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
      name: new RegExp(`^Slot 1, filled with ${firstLetter}`, 'i'),
    }),
  ).toBeVisible();

  // Wait past useAnswerGameDraftSync's 500 ms debounce + the initialContent
  // patch that fires once useLibraryRounds settles — both must complete
  // before we can meaningfully mutate the persisted document.
  await page.waitForTimeout(900);

  const sessionId = await seedDriftedInProgressSession(page);
  expect(
    sessionId,
    'seed helper should find an in-progress session',
  ).not.toBe('');

  await page.reload();
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(tiles.first()).toBeVisible();

  // The drifted draft carried [a, n, p, t] at roundIndex 2 — if the safety
  // net failed we would see those letters on the bank instead. After the
  // safety net fires, tiles must return to whatever round 0 was originally.
  await expect
    .poll(async () => await sortedLabels(), {
      message: 'tiles should recover to round 0 letters after drift',
    })
    .toEqual(round0Letters);

  // Every slot must be empty — the safety net has to drop the drifted
  // placements, not just relabel them.
  await expect(
    page.getByRole('listitem', { name: /^Slot 1, empty/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: /^Slot 2, empty/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('listitem', { name: /^Slot 3, empty/i }),
  ).toBeVisible();

  // User-facing signal from the safety-net toast (see PR #136).
  await expect(
    page.getByText(/Saved progress couldn't be restored/i),
  ).toBeVisible();

  // Persisted side-effect: WordSpell.tsx:459-474 null-patches the stale
  // draft. Poll because the patch is async after the safety net fires.
  await expect
    .poll(async () => await readDraftState(page), {
      message:
        'draftState in IDB should be cleared once the safety net fires',
    })
    .toBeNull();

  await expect(
    page.getByRole('button', { name: 'Hear the question' }),
  ).toBeVisible();
});
