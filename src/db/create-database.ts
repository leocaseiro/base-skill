import { nanoid } from 'nanoid';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { checkVersionAndMigrate } from './migrations';
import {
  getMigrationFailureCollection,
  recoverBrokenMigration,
} from './recover-bookmarks-migration';
import {
  appMetaSchema,
  bookmarksSchema,
  customGamesSchema,
  gameConfigOverridesSchema,
  profilesSchema,
  progressSchema,
  savedGameConfigsSchema,
  sessionHistoryIndexSchema,
  sessionHistorySchema,
  settingsSchema,
  syncMetaSchema,
  themesSchema,
  wordSpellSeenWordsSchema,
} from './schemas';
import type { BaseSkillCollections, BaseSkillDatabase } from './types';
import type { RxDatabase } from 'rxdb';
import { migrateWordSpellConfig } from '@/db/migrations/word-spell-multi-level';

addRxPlugin(RxDBMigrationSchemaPlugin);

const DB_NAME = 'baseskill-data-test';
const PRODUCTION_DB_NAME = 'baseskill-data';

const COLLECTIONS = {
  app_meta: {
    schema: appMetaSchema,
    migrationStrategies: {
      1: (oldDoc: Record<string, unknown>) => oldDoc,
    },
  },
  bookmarks: {
    schema: bookmarksSchema,
    migrationStrategies: {
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
    },
  },
  custom_games: {
    schema: customGamesSchema,
    migrationStrategies: {
      2: migrateWordSpellConfig,
    },
  },
  profiles: { schema: profilesSchema },
  progress: { schema: progressSchema },
  settings: {
    schema: settingsSchema,
    migrationStrategies: {
      1: (oldDoc: Record<string, unknown>) => oldDoc,
      2: (oldDoc: Record<string, unknown>) => oldDoc,
    },
  },
  game_config_overrides: { schema: gameConfigOverridesSchema },
  saved_game_configs: {
    schema: savedGameConfigsSchema,
    migrationStrategies: {
      1: (oldDoc: Record<string, unknown>) => ({
        ...oldDoc,
        color: 'indigo',
      }),
      2: (oldDoc: Record<string, unknown>) => oldDoc,
      3: migrateWordSpellConfig,
    },
  },
  themes: { schema: themesSchema },
  session_history: { schema: sessionHistorySchema },
  session_history_index: {
    schema: sessionHistoryIndexSchema,
    migrationStrategies: {
      1: (oldDoc: Record<string, unknown>) => ({
        ...oldDoc,
        status: 'completed',
        seed: '',
        initialContent: { rounds: [] },
        initialState: {},
      }),
      2: (oldDoc: Record<string, unknown>) => ({
        ...oldDoc,
        draftState: null,
      }),
    },
  },
  sync_meta: { schema: syncMetaSchema },
  word_spell_seen_words: { schema: wordSpellSeenWordsSchema },
} as const;

async function addBaseSkillCollections(
  db: RxDatabase<BaseSkillCollections>,
): Promise<BaseSkillDatabase> {
  await db.addCollections(COLLECTIONS);
  return db as BaseSkillDatabase;
}

/** Memory storage for unit tests; does not run migrations (call `checkVersionAndMigrate` in tests that need `app_meta`). */
export async function createTestDatabase(): Promise<BaseSkillDatabase> {
  const db = await createRxDatabase<BaseSkillDatabase>({
    name: `${DB_NAME}-${nanoid()}`,
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageMemory(),
    }),
    multiInstance: false,
  });
  return addBaseSkillCollections(db);
}

const STORYBOOK_DB_PREFIX = 'baseskill-storybook';

/**
 * Ephemeral in-memory DB for Storybook. Browsers do not allow replacing native
 * `indexedDB` with fake-indexeddb, so demos must use memory storage instead.
 */
export async function createStorybookDatabase(): Promise<BaseSkillDatabase> {
  const db = await createRxDatabase<BaseSkillDatabase>({
    name: `${STORYBOOK_DB_PREFIX}-${nanoid()}`,
    storage: getRxStorageMemory(),
    multiInstance: false,
  });
  const withCols = await addBaseSkillCollections(db);
  await checkVersionAndMigrate(withCols);
  return withCols;
}

let productionDbPromise: Promise<BaseSkillDatabase> | undefined;

/** Browser-only: opens IndexedDB via Dexie-backed RxStorage and runs migrations. */
export async function getOrCreateDatabase(): Promise<BaseSkillDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new TypeError(
      'getOrCreateDatabase is only available in a browser with IndexedDB',
    );
  }
  productionDbPromise ??= (async () => {
    const open = async (): Promise<BaseSkillDatabase> => {
      const db = await createRxDatabase<BaseSkillDatabase>({
        name: PRODUCTION_DB_NAME,
        storage: getRxStorageDexie(),
        multiInstance: false,
      });
      try {
        const withCols = await addBaseSkillCollections(db);
        await checkVersionAndMigrate(withCols);
        return withCols;
      } catch (error) {
        await db.close().catch(() => {});
        throw error;
      }
    };
    // RxDB's parallel migration plumbing intermittently throws DM4 with a
    // closed-instance inner error during `addCollections` for users whose
    // IndexedDB carries stale legacy schema versions. Recover by wiping
    // the broken collection's old storage + meta and retrying. Loop a few
    // times in case multiple collections trip the same race in one boot.
    const MAX_RECOVERY_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_RECOVERY_ATTEMPTS; attempt++) {
      try {
        return await open();
      } catch (error) {
        const collection = getMigrationFailureCollection(error);
        if (!collection) throw error;
        await recoverBrokenMigration(collection);
      }
    }
    return await open();
  })();
  return productionDbPromise;
}

export async function destroyTestDatabase(
  db?: BaseSkillDatabase,
): Promise<void> {
  if (db) await db.remove();
}
