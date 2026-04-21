import { nanoid } from 'nanoid';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { beforeAll, describe, expect, it } from 'vitest';
import { bookmarksSchema } from './schemas';
import type { RxJsonSchema } from 'rxdb';

addRxPlugin(RxDBMigrationSchemaPlugin);

const structuredCloneFallback = <T>(value: T): T =>
  // eslint-disable-next-line unicorn/prefer-structured-clone -- fallback IS the structuredClone shim
  JSON.parse(JSON.stringify(value)) as T;

type V0GameIdShape = {
  id: string;
  profileId: string;
  gameId: string;
  createdAt: string;
};

const bookmarksV0GameIdSchema: RxJsonSchema<V0GameIdShape> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'gameId', 'createdAt'],
  additionalProperties: false,
};

const migrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => {
    const profileId = oldDoc.profileId as string;
    const gameId = oldDoc.gameId as string;
    return {
      id: `${profileId}:game:${gameId}`,
      profileId,
      targetType: 'game',
      targetId: gameId,
      createdAt: oldDoc.createdAt,
    };
  },
};

const realWorldV0Fixtures: V0GameIdShape[] = [
  {
    id: 'tJDLrcsRUtvroJvbMo6AE',
    profileId: 'anonymous',
    gameId: 'math-subtraction',
    createdAt: '2026-04-02T12:06:57.559Z',
  },
  {
    id: 'zngVeBJa_tBjWvqdEWc3m',
    profileId: 'anonymous',
    gameId: 'placeholder-game',
    createdAt: '2026-04-02T12:06:58.698Z',
  },
];

describe('bookmarks v0 (gameId shape) → v1 migration', () => {
  beforeAll(() => {
    if (typeof structuredClone === 'undefined') {
      // jsdom lacks structuredClone in older Node; fake-indexeddb relies on it.
      (
        globalThis as unknown as {
          structuredClone: typeof structuredClone;
        }
      ).structuredClone = (v) => structuredCloneFallback(v);
    }
  });

  it('reopens a v0 DB at v1 and migrates real-world docs without DM4', async () => {
    const dbName = `bs-mig-${nanoid()}`;

    const db0 = await createRxDatabase({
      name: dbName,
      storage: getRxStorageDexie(),
      multiInstance: false,
    });
    const cols0 = await db0.addCollections({
      bookmarks: { schema: bookmarksV0GameIdSchema },
    });
    await cols0.bookmarks.bulkInsert(realWorldV0Fixtures);
    await db0.close();

    const db1 = await createRxDatabase({
      name: dbName,
      storage: getRxStorageDexie(),
      multiInstance: false,
    });
    const cols1 = await db1.addCollections({
      bookmarks: {
        schema: bookmarksSchema,
        migrationStrategies,
      },
    });

    const migrated = await cols1.bookmarks.find().exec();
    const ids = migrated.map((d) => d.id).toSorted();
    expect(ids).toEqual([
      'anonymous:game:math-subtraction',
      'anonymous:game:placeholder-game',
    ]);
    expect(migrated.every((d) => d.targetType === 'game')).toBe(true);

    await db1.close();
  });
});
