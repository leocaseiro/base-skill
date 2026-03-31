import { nanoid } from 'nanoid'
import { createRxDatabase } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
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
import type { BaseSkillDatabase } from './types'

const DB_NAME = 'baseskill-data-test'

/** Memory storage for unit tests; production path uses Dexie (Task 5). */
export async function createTestDatabase(): Promise<BaseSkillDatabase> {
  const db = await createRxDatabase<BaseSkillDatabase>({
    name: `${DB_NAME}-${nanoid()}`,
    storage: getRxStorageMemory(),
    multiInstance: false,
  })
  await db.addCollections({
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
  })
  return db
}

export async function destroyTestDatabase(
  db?: BaseSkillDatabase,
): Promise<void> {
  if (db) await db.remove()
}
