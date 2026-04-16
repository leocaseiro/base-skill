import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrateCustomGames } from './migrate-custom-games';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import {
  ANONYMOUS_PROFILE_ID,
  lastSessionConfigId,
} from '@/db/last-session-game-config';
import { ensureAppMetaSingleton } from '@/db/migrations';

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  await ensureAppMetaSingleton(db);
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

async function seedSavedConfig(
  id: string,
  overrides: Partial<{ gameId: string; name: string }> = {},
) {
  await db.saved_game_configs.insert({
    id,
    profileId: ANONYMOUS_PROFILE_ID,
    gameId: overrides.gameId ?? 'word-spell',
    name: overrides.name ?? `Config ${id}`,
    config: { totalRounds: 3 },
    color: 'indigo',
    createdAt: new Date().toISOString(),
  });
}

describe('migrateCustomGames', () => {
  it('copies non-last-session docs into custom_games and deletes them from saved_game_configs', async () => {
    await seedSavedConfig('a');
    await seedSavedConfig('b', { name: 'Config b' });
    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id).toSorted()).toEqual(['a', 'b']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining).toHaveLength(0);
  });

  it('leaves last-session docs (id starts with "last:") in saved_game_configs', async () => {
    await seedSavedConfig('a');
    await db.saved_game_configs.insert({
      id: lastSessionConfigId('word-spell'),
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: '__last_session__',
      config: { totalRounds: 5 },
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id)).toEqual(['a']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining.map((d) => d.id)).toEqual([
      lastSessionConfigId('word-spell'),
    ]);
  });

  it('sets app_meta.customGamesMigrated = true after success', async () => {
    await seedSavedConfig('a');
    await migrateCustomGames(db);
    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta?.customGamesMigrated).toBe(true);
  });

  it('skips work on a second run (idempotent)', async () => {
    await seedSavedConfig('a');
    await migrateCustomGames(db);

    // Re-seed a source doc with the SAME id — if the migration re-ran it would
    // delete this new row. If it skips, the row survives.
    await db.saved_game_configs.insert({
      id: 'a',
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: 'Reinserted',
      config: {},
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining.map((d) => d.id)).toEqual(['a']);
  });

  it('is safe to run repeatedly even if the flag has not yet been set (crash recovery)', async () => {
    await seedSavedConfig('a');
    await seedSavedConfig('b');

    // Pretend we ran copy but not delete + flag — upsert-then-delete is
    // idempotent, so a subsequent full run converges to the same state.
    await db.custom_games.upsert({
      id: 'a',
      profileId: ANONYMOUS_PROFILE_ID,
      gameId: 'word-spell',
      name: 'Config a',
      config: { totalRounds: 3 },
      color: 'indigo',
      createdAt: new Date().toISOString(),
    });

    await migrateCustomGames(db);

    const customs = await db.custom_games.find().exec();
    expect(customs.map((d) => d.id).toSorted()).toEqual(['a', 'b']);

    const remaining = await db.saved_game_configs.find().exec();
    expect(remaining).toHaveLength(0);
  });
});
