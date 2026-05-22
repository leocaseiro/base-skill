import type { RxJsonSchema } from 'rxdb';

export type AppMetaDoc = {
  id: 'singleton';
  appVersion: string;
  rxdbSchemaVersion: number;
  lastMigrationAt: string | null;
  installId: string;
  customGamesMigrated?: boolean;
  /**
   * Map of profileId → true marking that "The Floor is Lava" has been seeded
   * into `custom_games` for that profile. The seeder writes the flag once
   * per profile; subsequent runs short-circuit. If the user deletes the
   * seeded row, the flag stays set so we do not re-seed.
   */
  theFloorIsLavaSeeded?: Record<string, true>;
};

export const appMetaSchema: RxJsonSchema<AppMetaDoc> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36,
    },
    appVersion: {
      type: 'string',
      // eslint-disable-next-line unicorn/prefer-string-raw -- regex is not a string
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
    rxdbSchemaVersion: {
      type: 'integer',
      minimum: 0,
      multipleOf: 1,
    },
    lastMigrationAt: {
      oneOf: [
        { type: 'string', format: 'date-time' },
        { type: 'null' },
      ],
    },
    installId: {
      type: 'string',
      maxLength: 64,
    },
    customGamesMigrated: {
      type: 'boolean',
    },
    theFloorIsLavaSeeded: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
  },
  required: ['id', 'appVersion', 'rxdbSchemaVersion', 'installId'],
  additionalProperties: false,
};
