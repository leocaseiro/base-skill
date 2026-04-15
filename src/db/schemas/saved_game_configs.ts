import type { Cover } from '@/games/cover-type';
import type { RxJsonSchema } from 'rxdb';

export type SavedGameConfigDoc = {
  id: string;
  profileId: string;
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
  cover?: Cover;
};

export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> =
  {
    version: 2,
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
      cover: {
        oneOf: [
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['emoji'] },
              emoji: { type: 'string', maxLength: 16 },
              gradient: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 2,
              },
            },
            required: ['kind', 'emoji'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['image'] },
              src: { type: 'string', maxLength: 2048 },
              alt: { type: 'string', maxLength: 256 },
              background: { type: 'string', maxLength: 32 },
            },
            required: ['kind', 'src'],
            additionalProperties: false,
          },
        ],
      },
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
