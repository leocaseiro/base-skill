import type { RxJsonSchema } from 'rxdb'

export type GameConfigOverridesDoc = {
  id: string
  profileId: string
  scope: 'game' | 'grade-band' | 'global'
  scopeValue: string | null
  retries?: number | null
  timerDuration?: number | null
  alwaysWin?: boolean | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
  updatedAt: string
}

export const gameConfigOverridesSchema: RxJsonSchema<GameConfigOverridesDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    scope: { type: 'string', enum: ['game', 'grade-band', 'global'] },
    scopeValue: {
      oneOf: [{ type: 'string' }, { type: 'null' }],
    },
    retries: {
      oneOf: [
        { type: 'integer', minimum: 0, maximum: 99, multipleOf: 1 },
        { type: 'null' },
      ],
    },
    timerDuration: {
      oneOf: [
        { type: 'integer', minimum: 0, multipleOf: 1 },
        { type: 'null' },
      ],
    },
    alwaysWin: {
      oneOf: [{ type: 'boolean' }, { type: 'null' }],
    },
    difficulty: {
      oneOf: [
        { type: 'string', enum: ['easy', 'medium', 'hard'] },
        { type: 'null' },
      ],
    },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'scope', 'scopeValue', 'updatedAt'],
  additionalProperties: false,
}
