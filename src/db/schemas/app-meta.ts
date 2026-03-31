import type { RxJsonSchema } from 'rxdb'

export type AppMetaDoc = {
  id: 'singleton'
  appVersion: string
  rxdbSchemaVersion: number
  lastMigrationAt: string | null
  installId: string
}

/** Placeholder until schema is implemented in the next commit. */
export const appMetaSchema = {} as RxJsonSchema<AppMetaDoc>
