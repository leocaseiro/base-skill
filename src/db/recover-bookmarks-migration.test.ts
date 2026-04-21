import { afterEach, describe, expect, it } from 'vitest';
import {
  getMigrationFailureCollection,
  recoverBrokenMigration,
} from './recover-bookmarks-migration';

const PROD_DB_NAME = 'baseskill-data';
const v0Idb = (collection: string) =>
  `rxdb-dexie-${PROD_DB_NAME}--0--${collection}`;
const v0MigMetaIdb = (collection: string) =>
  `rxdb-dexie-${PROD_DB_NAME}--0--rx-migration-state-meta-${collection}-0`;
const internalIdb = (version: number) =>
  `rxdb-dexie-${PROD_DB_NAME}--${version}--_rxdb_internal`;

const openIdb = (name: string) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
    request.addEventListener('upgradeneeded', () => {
      request.result.createObjectStore('docs', { keyPath: 'id' });
    });
  });

const seedDoc = (db: IDBDatabase, doc: Record<string, unknown>) =>
  new Promise<void>((resolve, reject) => {
    const tx = db.transaction('docs', 'readwrite');
    tx.objectStore('docs').put(doc);
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });

const listDocIds = (db: IDBDatabase) =>
  new Promise<IDBValidKey[]>((resolve, reject) => {
    const tx = db.transaction('docs', 'readonly');
    const request = tx.objectStore('docs').getAllKeys();
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });

const dbExists = async (name: string): Promise<boolean> => {
  const dbs = await indexedDB.databases();
  return dbs.some((d) => d.name === name);
};

const wipeAllBaseskillIdbs = async () => {
  const dbs = await indexedDB.databases();
  for (const d of dbs) {
    if (
      typeof d.name === 'string' &&
      d.name.startsWith('rxdb-dexie-baseskill-data')
    ) {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(d.name as string);
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
        request.addEventListener('blocked', () => resolve());
      });
    }
  }
};

afterEach(wipeAllBaseskillIdbs);

describe('getMigrationFailureCollection', () => {
  it('returns the collection name for a closed-instance DM4', () => {
    expect(
      getMigrationFailureCollection({
        code: 'DM4',
        parameters: {
          collection: 'bookmarks',
          error: {
            message:
              'RxStorageInstanceDexie is closed baseskill-data-bookmarks',
          },
        },
      }),
    ).toBe('bookmarks');
  });

  it('returns the collection name for a closed-instance DM4 on app_meta', () => {
    expect(
      getMigrationFailureCollection({
        code: 'DM4',
        parameters: {
          collection: 'app_meta',
          error: {
            message:
              'RxStorageInstanceDexie is closed baseskill-data-app_meta',
          },
        },
      }),
    ).toBe('app_meta');
  });

  it('returns null for DM4 without a closed-instance inner error', () => {
    expect(
      getMigrationFailureCollection({
        code: 'DM4',
        parameters: {
          collection: 'profiles',
          error: { message: 'something else' },
        },
      }),
    ).toBeNull();
  });

  it('returns null for unrelated errors', () => {
    expect(getMigrationFailureCollection(new Error('boom'))).toBeNull();
    expect(getMigrationFailureCollection(null)).toBeNull();
    expect(getMigrationFailureCollection({ code: 'DB1' })).toBeNull();
  });
});

describe('recoverBrokenMigration', () => {
  it('deletes the v0 IDB and v0 migration-meta IDB for the named collection', async () => {
    const v0 = await openIdb(v0Idb('bookmarks'));
    await seedDoc(v0, { id: 'doc1', profileId: 'a', gameId: 'g' });
    v0.close();

    const meta = await openIdb(v0MigMetaIdb('bookmarks'));
    await seedDoc(meta, { id: 'up|1' });
    meta.close();

    expect(await dbExists(v0Idb('bookmarks'))).toBe(true);
    expect(await dbExists(v0MigMetaIdb('bookmarks'))).toBe(true);

    // Provide a current-version IDB so recovery knows which to keep.
    const v1 = await openIdb(
      `rxdb-dexie-${PROD_DB_NAME}--1--bookmarks`,
    );
    v1.close();

    await recoverBrokenMigration('bookmarks');

    expect(await dbExists(v0Idb('bookmarks'))).toBe(false);
    expect(await dbExists(v0MigMetaIdb('bookmarks'))).toBe(false);
    expect(
      await dbExists(`rxdb-dexie-${PROD_DB_NAME}--1--bookmarks`),
    ).toBe(true);
  });

  it('works for app_meta and leaves bookmarks rows intact in _rxdb_internal', async () => {
    const internal = await openIdb(internalIdb(0));
    await seedDoc(internal, {
      id: 'collection|app_meta-0',
      _deleted: '0',
    });
    await seedDoc(internal, {
      id: 'rx-migration-status|app_meta-v-1',
      _deleted: '0',
    });
    await seedDoc(internal, {
      id: 'collection|bookmarks-0',
      _deleted: '0',
    });
    await seedDoc(internal, {
      id: 'collection|profiles-0',
      _deleted: '0',
    });
    await seedDoc(internal, {
      id: 'storage-token|storageToken',
      _deleted: '0',
    });
    internal.close();

    await recoverBrokenMigration('app_meta');

    const after = await openIdb(internalIdb(0));
    const ids = await listDocIds(after);
    after.close();
    expect(ids.toSorted()).toEqual([
      'collection|bookmarks-0',
      'collection|profiles-0',
      'storage-token|storageToken',
    ]);
  });

  it('is a no-op when no broken state exists', async () => {
    await expect(
      recoverBrokenMigration('bookmarks'),
    ).resolves.toBeUndefined();
  });
});
