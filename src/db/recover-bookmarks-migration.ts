const PRODUCTION_DB_NAME = 'baseskill-data';
const INTERNAL_IDB = (version: number): string =>
  `rxdb-dexie-${PRODUCTION_DB_NAME}--${version}--_rxdb_internal`;

/**
 * Old (closed-during-migration) Dexie storage. Wipes the legacy schema-version
 * IndexedDB(s) for `<collectionName>` and its `rx-migration-state-meta` peer,
 * then removes the corresponding `collection|<name>-<version>` and
 * `rx-migration-status|<name>-v-*` rows from every `_rxdb_internal` partition
 * so RxDB stops attempting the broken migration on subsequent boots.
 */

type DM4Like = {
  code?: unknown;
  parameters?: {
    collection?: unknown;
    error?: { message?: unknown } | null;
  } | null;
};

const ID_PREFIX_TO_DROP = (collection: string) => [
  `collection|${collection}-`,
  `rx-migration-status|${collection}-`,
];

export const getMigrationFailureCollection = (
  error: unknown,
): string | null => {
  if (typeof error !== 'object' || error === null) return null;
  const e = error as DM4Like;
  if (e.code !== 'DM4') return null;
  const collection = e.parameters?.collection;
  if (typeof collection !== 'string') return null;
  const innerMessage = e.parameters?.error?.message;
  if (
    typeof innerMessage !== 'string' ||
    !innerMessage.includes('is closed')
  )
    return null;
  return collection;
};

/** @deprecated kept as a thin alias so older imports still type-check */
export const isBookmarksMigrationFailure = (error: unknown): boolean =>
  getMigrationFailureCollection(error) === 'bookmarks';

const deleteIdb = (name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.addEventListener('success', () => resolve());
    request.addEventListener('error', () =>
      reject(
        request.error ?? new Error(`deleteDatabase failed: ${name}`),
      ),
    );
    // Don't block recovery if another tab/worker holds the DB open;
    // the browser completes deletion asynchronously and recovery resumes.
    request.addEventListener('blocked', () => resolve());
  });

const dropFromInternalStore = async (
  collection: string,
): Promise<void> => {
  const list = await indexedDB.databases();
  const internalDbs = list
    .map((d) => d.name)
    .filter((n): n is string => typeof n === 'string')
    .filter((n) =>
      /^rxdb-dexie-baseskill-data--\d+--_rxdb_internal$/.test(n),
    );
  const prefixes = ID_PREFIX_TO_DROP(collection);

  await Promise.all(
    internalDbs.map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const openRequest = indexedDB.open(name);
          openRequest.addEventListener('error', () =>
            reject(openRequest.error),
          );
          openRequest.addEventListener('success', () => {
            const db = openRequest.result;
            if (!db.objectStoreNames.contains('docs')) {
              db.close();
              resolve();
              return;
            }
            const tx = db.transaction('docs', 'readwrite');
            const store = tx.objectStore('docs');
            const cursorRequest = store.openCursor();
            cursorRequest.addEventListener('success', () => {
              const cursor = cursorRequest.result;
              if (!cursor) return;
              const id =
                typeof cursor.key === 'string' ? cursor.key : undefined;
              if (id && prefixes.some((p) => id.startsWith(p))) {
                cursor.delete();
              }
              cursor.continue();
            });
            tx.addEventListener('complete', () => {
              db.close();
              resolve();
            });
            tx.addEventListener('error', () => {
              db.close();
              reject(tx.error);
            });
          });
        }),
    ),
  );
};

const wipeOldStorageVersions = async (
  collection: string,
  excludeVersion: number,
): Promise<void> => {
  const list = await indexedDB.databases();
  const pattern = new RegExp(
    String.raw`^rxdb-dexie-baseskill-data--(\d+)--(?:${collection}|rx-migration-state-meta-${collection}-\d+)$`,
  );
  const targets = list
    .map((d) => d.name)
    .filter((n): n is string => typeof n === 'string')
    .filter((n) => {
      const match = pattern.exec(n);
      return !!match && Number(match[1]) !== excludeVersion;
    });
  await Promise.all(targets.map((name) => deleteIdb(name)));
};

const findCurrentSchemaVersion = async (
  collection: string,
): Promise<number> => {
  const list = await indexedDB.databases();
  const pattern = new RegExp(
    String.raw`^rxdb-dexie-baseskill-data--(\d+)--${collection}$`,
  );
  const versions = list
    .map((d) => d.name)
    .filter((n): n is string => typeof n === 'string')
    .map((n) => pattern.exec(n))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => Number(m[1]));
  return versions.length > 0 ? Math.max(...versions) : 0;
};

export const recoverBrokenMigration = async (
  collection: string,
): Promise<void> => {
  const currentVersion = await findCurrentSchemaVersion(collection);
  await dropFromInternalStore(collection);
  await wipeOldStorageVersions(collection, currentVersion);
};

/** @deprecated use {@link recoverBrokenMigration} with `'bookmarks'` */
export const recoverBrokenBookmarksMigration = (): Promise<void> =>
  recoverBrokenMigration('bookmarks');

// Internal helpers reused by tests.
export const __test__ = {
  INTERNAL_IDB,
  PRODUCTION_DB_NAME,
};
