import type { RxJsonSchema } from 'rxdb'

export type AppMetaDoc = {
  id: 'singleton'
  appVersion: string
  rxdbSchemaVersion: number
  lastMigrationAt: string | null
  installId: string
}

export const appMetaSchema: RxJsonSchema<AppMetaDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    appVersion: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
    rxdbSchemaVersion: {
      type: 'integer',
      minimum: 0,
      multipleOf: 1,
    },
    lastMigrationAt: {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
    installId: {
      type: 'string',
      maxLength: 64,
    },
  },
  required: ['id', 'appVersion', 'rxdbSchemaVersion', 'installId'],
  additionalProperties: false,
}
