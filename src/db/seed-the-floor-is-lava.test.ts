import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedTheFloorIsLavaIfNeeded } from './seed-the-floor-is-lava';
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

describe('seedTheFloorIsLavaIfNeeded', () => {
  it('inserts the row + sets the per-profile flag on first call', async () => {
    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');

    const rows = await db.custom_games.find().exec();
    expect(rows.map((r) => r.name)).toContain('The Floor is Lava');

    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta!.theFloorIsLavaSeeded).toEqual({
      'profile-A': true,
    });
  });

  it('no-ops on the second call (flag already set)', async () => {
    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');

    const rows = await db.custom_games
      .find({ selector: { name: 'The Floor is Lava' } })
      .exec();
    expect(rows).toHaveLength(1);
  });

  it('seeds independently per profile', async () => {
    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
    await seedTheFloorIsLavaIfNeeded(db, 'profile-B');

    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta!.theFloorIsLavaSeeded).toEqual({
      'profile-A': true,
      'profile-B': true,
    });

    const rows = await db.custom_games
      .find({ selector: { name: 'The Floor is Lava' } })
      .exec();
    expect(rows).toHaveLength(2);
  });

  it('does not re-seed after user deletes the row', async () => {
    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
    const row = await db.custom_games
      .findOne({ selector: { name: 'The Floor is Lava' } })
      .exec();
    await row!.remove();

    await seedTheFloorIsLavaIfNeeded(db, 'profile-A');

    const rows = await db.custom_games
      .find({ selector: { name: 'The Floor is Lava' } })
      .exec();
    expect(rows).toHaveLength(0);
  });

  it('handles concurrent calls without producing duplicate rows', async () => {
    await Promise.all([
      seedTheFloorIsLavaIfNeeded(db, 'profile-A'),
      seedTheFloorIsLavaIfNeeded(db, 'profile-A'),
    ]);

    const rows = await db.custom_games
      .find({ selector: { name: 'The Floor is Lava' } })
      .exec();
    expect(rows).toHaveLength(1);
  });
});
