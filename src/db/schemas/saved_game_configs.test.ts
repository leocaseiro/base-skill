// src/db/schemas/saved_game_configs.test.ts
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

describe('saved_game_configs schema v2', () => {
  it('accepts an optional cover field', async () => {
    const doc = await db.saved_game_configs.insert({
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

  it('preserves docs missing the cover field (v1 docs)', async () => {
    const doc = await db.saved_game_configs.insert({
      id: 'test-no-cover',
      profileId: 'p1',
      gameId: 'word-spell',
      name: 'Classic',
      config: {},
      createdAt: new Date().toISOString(),
      color: 'indigo',
    });
    expect(doc.cover).toBeUndefined();
  });

  it('rejects an invalid cover kind', async () => {
    await expect(
      db.saved_game_configs.insert({
        id: 'test-bad-cover',
        profileId: 'p1',
        gameId: 'word-spell',
        name: 'Bad',
        config: {},
        createdAt: new Date().toISOString(),
        color: 'amber',
        cover: { kind: 'unknown', emoji: '🦁' } as never,
      }),
    ).rejects.toThrow();
  });
});
