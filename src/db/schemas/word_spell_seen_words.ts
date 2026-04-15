import type { RxJsonSchema } from 'rxdb';

export type WordSpellSeenWordsDoc = {
  id: string;
  profileId: string;
  signature: string;
  words: string[];
  updatedAt: string;
};

export const wordSpellSeenWordsSchema: RxJsonSchema<WordSpellSeenWordsDoc> =
  {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: { type: 'string', maxLength: 256 },
      profileId: { type: 'string', maxLength: 36 },
      signature: { type: 'string', maxLength: 512 },
      words: { type: 'array', items: { type: 'string' } },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'profileId', 'signature', 'words', 'updatedAt'],
    additionalProperties: false,
  };
