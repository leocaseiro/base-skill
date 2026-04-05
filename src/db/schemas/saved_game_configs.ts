import type { RxJsonSchema } from 'rxdb';

export type SavedGameConfigDoc = {
  id: string;
  profileId: string;
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
};

export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> =
  {
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 36 },
      profileId: { type: 'string', maxLength: 36 },
      gameId: { type: 'string', maxLength: 64 },
      name: { type: 'string', maxLength: 128 },
      config: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' },
      color: { type: 'string', maxLength: 32 },
    },
    required: [
      'id',
      'profileId',
      'gameId',
      'name',
      'config',
      'createdAt',
      'color',
    ],
    additionalProperties: false,
  };
