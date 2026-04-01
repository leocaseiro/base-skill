import type { RxJsonSchema } from 'rxdb';

export type ProgressBadge = {
  badgeId: string
  earnedAt: string
}

export type ProgressDoc = {
  id: string
  profileId: string
  gameId: string
  lastScore?: number
  bestScore?: number
  totalStars?: number
  streakDays?: number
  lastPlayedAt?: string
  completionCount?: number
  badges?: ProgressBadge[]
}

export const progressSchema: RxJsonSchema<ProgressDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    lastScore: { type: 'number', minimum: 0, default: 0 },
    bestScore: { type: 'number', minimum: 0, default: 0 },
    totalStars: {
      type: 'integer',
      minimum: 0,
      default: 0,
      multipleOf: 1,
    },
    streakDays: {
      type: 'integer',
      minimum: 0,
      default: 0,
      multipleOf: 1,
    },
    lastPlayedAt: { type: 'string', format: 'date-time' },
    completionCount: {
      type: 'integer',
      minimum: 0,
      default: 0,
      multipleOf: 1,
    },
    badges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          badgeId: { type: 'string' },
          earnedAt: { type: 'string', format: 'date-time' },
        },
        required: [ 'badgeId', 'earnedAt' ],
        additionalProperties: false,
      },
      default: [],
    },
  },
  required: [ 'id', 'profileId', 'gameId' ],
  additionalProperties: false,
};
