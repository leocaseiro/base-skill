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

  it('partitions rows per profile for the same signature', async () => {
    const db = await createTestDatabase();
    try {
      const signature = 'region=aus|level=2';
      await db.word_spell_seen_words.insert({
        id: `alice__${signature}`,
        profileId: 'alice',
        signature,
        words: ['cat'],
        updatedAt: new Date().toISOString(),
      });
      await db.word_spell_seen_words.insert({
        id: `bob__${signature}`,
        profileId: 'bob',
        signature,
        words: ['dog'],
        updatedAt: new Date().toISOString(),
      });

      const alice = await db.word_spell_seen_words
        .findOne(`alice__${signature}`)
        .exec();
      const bob = await db.word_spell_seen_words
        .findOne(`bob__${signature}`)
        .exec();
      expect(alice?.words).toEqual(['cat']);
      expect(bob?.words).toEqual(['dog']);
    } finally {
      await destroyTestDatabase(db);
    }
  });

  it('upsert replaces the words array for the same id', async () => {
    const db = await createTestDatabase();
    try {
      const id = 'anonymous__region=aus|level=1';
      const base = {
        id,
        profileId: 'anonymous',
        signature: 'region=aus|level=1',
      };
      await db.word_spell_seen_words.upsert({
        ...base,
        words: ['a', 'b'],
        updatedAt: new Date().toISOString(),
      });
      await db.word_spell_seen_words.upsert({
        ...base,
        words: ['c'],
        updatedAt: new Date().toISOString(),
      });

      const doc = await db.word_spell_seen_words.findOne(id).exec();
      expect(doc?.words).toEqual(['c']);
    } finally {
      await destroyTestDatabase(db);
    }
  });
});
