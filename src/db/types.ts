import type { RxCollection, RxDatabase } from 'rxdb'
import type { AppMetaDoc } from './schemas/app-meta'

 
export type BaseSkillCollections = {
  app_meta: RxCollection<AppMetaDoc>
}

export type BaseSkillDatabase = RxDatabase<BaseSkillCollections>

export type CollectionName = keyof BaseSkillCollections
