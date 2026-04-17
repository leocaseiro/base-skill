import type { RxJsonSchema } from 'rxdb';

export type BookmarkTargetType = 'game' | 'customGame';

export type BookmarkDoc = {
  /** Composite key — `${profileId}:${targetType}:${targetId}` (see `bookmark-id.ts`) */
  id: string;
  profileId: string;
  targetType: BookmarkTargetType;
  targetId: string;
  createdAt: string;
};

export const bookmarksSchema: RxJsonSchema<BookmarkDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 256 },
    profileId: { type: 'string', maxLength: 36 },
    targetType: {
      type: 'string',
      enum: ['game', 'customGame'],
      maxLength: 16,
    },
    targetId: { type: 'string', maxLength: 64 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'targetType', 'targetId', 'createdAt'],
  additionalProperties: false,
};
