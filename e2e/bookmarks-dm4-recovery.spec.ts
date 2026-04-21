import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { seedMathRandom } from './seed-math-random';
import type { Page } from '@playwright/test';

type ExportedDb = {
  databaseName: string;
  databaseVersion: number;
  objectStoreNames: string[];
  stores: { name: string; data: { key: unknown; value: unknown }[] }[];
};

const PROD_DB_NAME = 'baseskill-data';
const V0_BOOKMARKS_IDB = `rxdb-dexie-${PROD_DB_NAME}--0--bookmarks`;
const V0_INTERNAL_IDB = `rxdb-dexie-${PROD_DB_NAME}--0--_rxdb_internal`;
const V0_MIGRATION_META_IDB = `rxdb-dexie-${PROD_DB_NAME}--0--rx-migration-state-meta-bookmarks-0`;

/**
 * Seeds the exact pre-#117 broken IndexedDB shape that v0.10.0 left on
 * real users' devices: gameId-keyed v0 bookmark docs + a `collection|bookmarks-0`
 * meta entry that points at a v0 schema with the `gameId` field.
 */
const seedBrokenV0BookmarksState = async (page: Page) => {
  await page.evaluate(
    async ({ bookmarksDb, internalDb, metaDb }) => {
      const wipe = (name: string) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(name);
          request.addEventListener('success', () => resolve());
          request.addEventListener('error', () =>
            reject(request.error),
          );
          request.addEventListener('blocked', () => resolve());
        });
      const open = (name: string) =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(name);
          request.addEventListener('success', () =>
            resolve(request.result),
          );
          request.addEventListener('error', () =>
            reject(request.error),
          );
          request.addEventListener('upgradeneeded', () => {
            request.result.createObjectStore('docs', { keyPath: 'id' });
          });
        });
      const put = (db: IDBDatabase, doc: Record<string, unknown>) =>
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction('docs', 'readwrite');
          tx.objectStore('docs').put(doc);
          tx.addEventListener('complete', () => resolve());
          tx.addEventListener('error', () => reject(tx.error));
        });

      await Promise.all([
        wipe(bookmarksDb),
        wipe(internalDb),
        wipe(metaDb),
      ]);

      const bookmarks = await open(bookmarksDb);
      const fixtures = [
        {
          id: 'tJDLrcsRUtvroJvbMo6AE',
          profileId: 'anonymous',
          gameId: 'math-subtraction',
          createdAt: '2026-04-02T12:06:57.559Z',
          _deleted: '0',
          _rev: '1-blcbcgzyjl',
          _meta: { lwt: 1_775_131_617_559.01 },
          _attachments: {},
        },
        {
          id: 'zngVeBJa_tBjWvqdEWc3m',
          profileId: 'anonymous',
          gameId: 'placeholder-game',
          createdAt: '2026-04-02T12:06:58.698Z',
          _deleted: '0',
          _rev: '1-blcbcgzyjl',
          _meta: { lwt: 1_775_131_618_698.01 },
          _attachments: {},
        },
      ];
      for (const f of fixtures) await put(bookmarks, f);
      bookmarks.close();

      const internal = await open(internalDb);
      await put(internal, {
        id: 'collection|bookmarks-0',
        key: 'bookmarks-0',
        context: 'collection',
        data: {
          name: 'bookmarks',
          schemaHash: 'seed-v0-hash',
          schema: {
            additionalProperties: false,
            encrypted: [],
            indexes: [
              ['_deleted', 'id'],
              ['_meta.lwt', 'id'],
            ],
            keyCompression: false,
            primaryKey: 'id',
            properties: {
              _attachments: { type: 'object' },
              _deleted: { type: 'boolean' },
              _meta: {
                additionalProperties: true,
                properties: {
                  lwt: {
                    maximum: 1e15,
                    minimum: 1,
                    multipleOf: 0.01,
                    type: 'number',
                  },
                },
                required: ['lwt'],
                type: 'object',
              },
              _rev: { minLength: 1, type: 'string' },
              createdAt: { format: 'date-time', type: 'string' },
              gameId: { maxLength: 64, type: 'string' },
              id: { maxLength: 36, type: 'string' },
              profileId: { maxLength: 36, type: 'string' },
            },
            required: [
              'id',
              'profileId',
              'gameId',
              'createdAt',
              '_deleted',
              '_rev',
              '_meta',
              '_attachments',
            ],
            type: 'object',
            version: 0,
          },
          version: 0,
          connectedStorages: [],
        },
        _deleted: '0',
        _rev: '1-rsxfshggzi',
        _meta: { lwt: 1_774_964_092_655.01 },
        _attachments: {},
      });
      internal.close();
    },
    {
      bookmarksDb: V0_BOOKMARKS_IDB,
      internalDb: V0_INTERNAL_IDB,
      metaDb: V0_MIGRATION_META_IDB,
    },
  );
};

/**
 * Seeds the entire IndexedDB layout from a DevTools JSON export, so a
 * developer can verify recovery against their own real-device data without
 * leaving the local dev server.
 *
 * Run with:
 *   SEED_FROM_EXPORT=./.local-debug/indexeddb-exports/<file>.json \
 *     yarn test:e2e --project=chromium --headed e2e/bookmarks-dm4-recovery.spec.ts
 */
const seedFromDevtoolsExport = async (
  page: Page,
  exportPath: string,
) => {
  const absolutePath = path.isAbsolute(exportPath)
    ? exportPath
    : path.resolve(process.cwd(), exportPath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const dbs = JSON.parse(raw) as ExportedDb[];
  const baseskillDbs = dbs.filter((d) =>
    d.databaseName.startsWith('rxdb-dexie-baseskill-data'),
  );

  // Helpers below are defined inline because they must serialize into the
  // page.evaluate browser context — they cannot be hoisted to module scope.
  /* eslint-disable unicorn/consistent-function-scoping -- arrow helpers must live inside page.evaluate so they serialize into the browser context */
  await page.evaluate(async (payload) => {
    const wipe = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
        request.addEventListener('blocked', () => resolve());
      });
    const open = (name: string, stores: string[]) =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.addEventListener('success', () =>
          resolve(request.result),
        );
        request.addEventListener('error', () => reject(request.error));
        request.addEventListener('upgradeneeded', () => {
          for (const store of stores) {
            if (!request.result.objectStoreNames.contains(store)) {
              // Out-of-line keys: collections like session_history_index use
              // `sessionId` (not `id`) as primary; we pass the explicit key
              // from the export so all variants seed consistently.
              request.result.createObjectStore(store);
            }
          }
        });
      });
    const put = (
      db: IDBDatabase,
      store: string,
      key: unknown,
      value: unknown,
    ) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key as IDBValidKey);
        tx.addEventListener('complete', () => resolve());
        tx.addEventListener('error', () => reject(tx.error));
      });

    for (const dbExport of payload) await wipe(dbExport.databaseName);

    for (const dbExport of payload) {
      const db = await open(
        dbExport.databaseName,
        dbExport.objectStoreNames,
      );
      // Only seed `docs` — RxDB rebuilds `changes`/`attachments` on demand
      // and those rows in DevTools exports often lack the keyPath field.
      const docsStore = dbExport.stores.find((s) => s.name === 'docs');
      if (docsStore) {
        for (const row of docsStore.data) {
          await put(db, 'docs', row.key, row.value);
        }
      }
      db.close();
    }
  }, baseskillDbs);
  /* eslint-enable unicorn/consistent-function-scoping -- end of page.evaluate block */
};

test.beforeEach(async ({ page }) => {
  await seedMathRandom(page);
});

test('app boots when v0 bookmarks (gameId shape) are present from v0.10.0', async ({
  page,
}) => {
  // Land on the origin so subsequent IndexedDB calls run against it.
  await page.goto('/en/');
  await page.getByRole('main').waitFor({ state: 'visible' });

  await seedBrokenV0BookmarksState(page);

  await page.reload();
  await page.getByRole('main').waitFor({ state: 'visible' });

  await expect(
    page.getByRole('button', { name: /^Play / }).first(),
  ).toBeVisible();

  await page.goto('/en/game/word-spell');
  await page.getByRole('main').waitFor({ state: 'visible' });
  await expect(
    page.getByRole('button', { name: /let's go/i }),
  ).toBeVisible();
});

const SEED_FROM_EXPORT = process.env['SEED_FROM_EXPORT'];

test.describe('verify against a real DevTools IndexedDB export', () => {
  test.skip(
    !SEED_FROM_EXPORT,
    'set SEED_FROM_EXPORT=path/to/export.json to enable',
  );

  test('app boots after seeding the entire DB layout from an export', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) =>
      consoleErrors.push(`pageerror: ${error.message}`),
    );

    await page.goto('/en/');
    await page.getByRole('main').waitFor({ state: 'visible' });

    await seedFromDevtoolsExport(page, SEED_FROM_EXPORT as string);

    await page.reload();
    await page
      .getByRole('main')
      .waitFor({ state: 'visible', timeout: 60_000 });

    await expect(
      page.getByRole('button', { name: /^Play / }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const fatal = consoleErrors.filter(
      (m) =>
        m.includes('DM4') ||
        m.includes('RxError') ||
        m.includes('is closed'),
    );
    expect(
      fatal,
      `unexpected RxDB errors:\n${fatal.join('\n')}`,
    ).toEqual([]);
  });
});
