import type { RxJsonSchema } from 'rxdb';

export type BookmarkDoc = {
  id: string
  profileId: string
  gameId: string
  createdAt: string
}

export const bookmarksSchema: RxJsonSchema<BookmarkDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: [ 'id', 'profileId', 'gameId', 'createdAt' ],
  additionalProperties: false,
};
