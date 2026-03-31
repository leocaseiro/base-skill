import { nanoid } from 'nanoid'
import { createRxDatabase } from 'rxdb'
import type { RxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { checkVersionAndMigrate } from './migrations'
import {
  appMetaSchema,
  bookmarksSchema,
  gameConfigOverridesSchema,
  profilesSchema,
  progressSchema,
  sessionHistoryIndexSchema,
  sessionHistorySchema,
  settingsSchema,
  syncMetaSchema,
  themesSchema,
} from './schemas'
import type { BaseSkillCollections, BaseSkillDatabase } from './types'

const DB_NAME = 'baseskill-data-test'
const PRODUCTION_DB_NAME = 'baseskill-data'

const COLLECTIONS = {
  app_meta: { schema: appMetaSchema },
  profiles: { schema: profilesSchema },
  progress: { schema: progressSchema },
  settings: { schema: settingsSchema },
  game_config_overrides: { schema: gameConfigOverridesSchema },
  bookmarks: { schema: bookmarksSchema },
  themes: { schema: themesSchema },
  session_history: { schema: sessionHistorySchema },
  session_history_index: { schema: sessionHistoryIndexSchema },
  sync_meta: { schema: syncMetaSchema },
} as const

async function addBaseSkillCollections(
  db: RxDatabase<BaseSkillCollections>,
): Promise<BaseSkillDatabase> {
  await db.addCollections(COLLECTIONS)
  return db as BaseSkillDatabase
}

/** Memory storage for unit tests; does not run migrations (call `checkVersionAndMigrate` in tests that need `app_meta`). */
export async function createTestDatabase(): Promise<BaseSkillDatabase> {
  const db = await createRxDatabase<BaseSkillDatabase>({
    name: `${DB_NAME}-${nanoid()}`,
    storage: getRxStorageMemory(),
    multiInstance: false,
  })
  return addBaseSkillCollections(db)
}

let productionDbPromise: Promise<BaseSkillDatabase> | undefined

/** Browser-only: opens IndexedDB via Dexie-backed RxStorage and runs migrations. */
export async function getOrCreateDatabase(): Promise<BaseSkillDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error(
      'getOrCreateDatabase is only available in a browser with IndexedDB',
    )
  }
  productionDbPromise ??= (async () => {
    const db = await createRxDatabase<BaseSkillDatabase>({
      name: PRODUCTION_DB_NAME,
      storage: getRxStorageDexie(),
      multiInstance: false,
    })
    const withCols = await addBaseSkillCollections(db)
    await checkVersionAndMigrate(withCols)
    return withCols
  })()
  return productionDbPromise
}

export async function destroyTestDatabase(
  db?: BaseSkillDatabase,
): Promise<void> {
  if (db) await db.remove()
}
