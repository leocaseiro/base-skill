import type { RxJsonSchema } from 'rxdb'

export type SessionHistoryIndexDoc = {
  sessionId: string
  profileId: string
  gameId: string
  startedAt: string
  endedAt?: string | null
  duration?: number | null
  finalScore?: number | null
  totalEvents?: number
  totalChunks?: number
  gradeBand: string
}

export const sessionHistoryIndexSchema: RxJsonSchema<SessionHistoryIndexDoc> = {
  version: 0,
  primaryKey: 'sessionId',
  type: 'object',
  properties: {
    sessionId: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    startedAt: { type: 'string', format: 'date-time' },
    endedAt: {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
    duration: {
      oneOf: [{ type: 'number', minimum: 0 }, { type: 'null' }],
    },
    finalScore: {
      oneOf: [{ type: 'number' }, { type: 'null' }],
    },
    totalEvents: { type: 'integer', minimum: 0, default: 0, multipleOf: 1 },
    totalChunks: { type: 'integer', minimum: 1, default: 1, multipleOf: 1 },
    gradeBand: { type: 'string' },
  },
  required: ['sessionId', 'profileId', 'gameId', 'startedAt', 'gradeBand'],
  additionalProperties: false,
}
