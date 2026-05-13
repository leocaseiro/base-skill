import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { ensureAppMetaSingleton } from '@/db/migrations';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  await ensureAppMetaSingleton(db);
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('app_meta v2 migration', () => {
  it('seeds an undefined theFloorIsLavaSeeded for existing singletons', async () => {
    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta).not.toBeNull();
    expect(meta!.theFloorIsLavaSeeded).toBeUndefined();
  });

  it('accepts a per-profile flag write via incrementalPatch', async () => {
    const meta = await db.app_meta.findOne('singleton').exec();
    await meta!.incrementalPatch({
      theFloorIsLavaSeeded: { 'profile-A': true },
    });
    const reread = await db.app_meta.findOne('singleton').exec();
    expect(reread!.theFloorIsLavaSeeded).toEqual({
      'profile-A': true,
    });
  });
});
