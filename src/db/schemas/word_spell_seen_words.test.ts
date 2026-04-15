import { describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '../create-database';

describe('word_spell_seen_words collection', () => {
  it('can be created, inserted into, and queried', async () => {
    const db = await createTestDatabase();
    try {
      await db.word_spell_seen_words.insert({
        id: 'anonymous__region=aus|level=2',
        profileId: 'anonymous',
        signature: 'region=aus|level=2',
        words: ['cat', 'dog'],
        updatedAt: new Date().toISOString(),
      });
      const doc = await db.word_spell_seen_words
        .findOne('anonymous__region=aus|level=2')
        .exec();
      expect(doc?.words).toEqual(['cat', 'dog']);
      expect(doc?.profileId).toBe('anonymous');
    } finally {
      await destroyTestDatabase(db);
    }
  });

  it('rejects rows missing required fields', async () => {
    const db = await createTestDatabase();
    try {
      await expect(
        db.word_spell_seen_words.insert({
          id: 'bad',
          profileId: 'anonymous',
          signature: 'sig',
          // missing words and updatedAt
        } as never),
      ).rejects.toThrow();
    } finally {
      await destroyTestDatabase(db);
    }
  });
});
