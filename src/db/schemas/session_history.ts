import type { RxJsonSchema } from 'rxdb';

export type SessionHistoryEvent = {
  timestamp: string
  action: string
  payload?: Record<string, unknown>
  result?: 'correct' | 'incorrect' | 'skipped' | 'timeout' | null
}

export type SessionHistoryDoc = {
  id: string
  sessionId: string
  profileId: string
  gameId: string
  chunkIndex: number
  events: SessionHistoryEvent[]
  createdAt: string
}

export const sessionHistorySchema: RxJsonSchema<SessionHistoryDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    sessionId: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    chunkIndex: { type: 'integer', minimum: 0, multipleOf: 1 },
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          action: { type: 'string' },
          payload: { type: 'object', additionalProperties: true },
          result: {
            oneOf: [
              {
                type: 'string',
                enum: [ 'correct', 'incorrect', 'skipped', 'timeout' ],
              },
              { type: 'null' },
            ],
          },
        },
        required: [ 'timestamp', 'action' ],
        additionalProperties: false,
      },
      default: [],
    },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'sessionId',
    'profileId',
    'gameId',
    'chunkIndex',
    'events',
    'createdAt',
  ],
  additionalProperties: false,
};
