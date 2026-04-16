import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseSkillDatabase } from '@/db/types';
import { bookmarkId } from '@/db/bookmark-id';
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

describe('bookmarks schema v1', () => {
  it('inserts a bookmark for a default game', async () => {
    const id = bookmarkId('anonymous', 'game', 'word-spell');
    const doc = await db.bookmarks.insert({
      id,
      profileId: 'anonymous',
      targetType: 'game',
      targetId: 'word-spell',
      createdAt: new Date().toISOString(),
    });
    expect(doc.id).toBe(id);
    expect(doc.targetType).toBe('game');
  });

  it('inserts a bookmark for a custom game', async () => {
    const id = bookmarkId('anonymous', 'customGame', 'cg_xyz');
    const doc = await db.bookmarks.insert({
      id,
      profileId: 'anonymous',
      targetType: 'customGame',
      targetId: 'cg_xyz',
      createdAt: new Date().toISOString(),
    });
    expect(doc.targetType).toBe('customGame');
  });

  it('rejects an invalid targetType', async () => {
    await expect(
      db.bookmarks.insert({
        id: 'anonymous:other:x',
        profileId: 'anonymous',
        targetType: 'other' as 'game',
        targetId: 'x',
        createdAt: new Date().toISOString(),
      }),
    ).rejects.toThrow();
  });

  it('rejects a doc missing required fields', async () => {
    await expect(
      db.bookmarks.insert({
        id: 'bad',
        profileId: 'anonymous',
        // targetType, targetId, createdAt missing
      } as unknown as Parameters<typeof db.bookmarks.insert>[0]),
    ).rejects.toThrow();
  });
});
