import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('custom_games schema v1', () => {
  it('inserts a doc with all required fields', async () => {
    const doc = await db.custom_games.insert({
      id: 'test-id',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Zoo Words',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'amber',
    });
    expect(doc.name).toBe('Zoo Words');
    expect(doc.color).toBe('amber');
  });

  it('accepts an optional cover field', async () => {
    const doc = await db.custom_games.insert({
      id: 'test-with-cover',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Zoo Words',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'amber',
      cover: { kind: 'emoji', emoji: '🦁' },
    });
    expect(doc.cover).toEqual({ kind: 'emoji', emoji: '🦁' });
  });

  it('rejects a doc missing required fields', async () => {
    await expect(
      db.custom_games.insert({
        id: 'bad',
        profileId: 'p1',
        gameId: 'word-spell',
        // name, config, createdAt, color missing
      } as unknown as Parameters<typeof db.custom_games.insert>[0]),
    ).rejects.toThrow();
  });
});
