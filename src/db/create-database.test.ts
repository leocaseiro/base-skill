import { afterEach, describe, expect, it } from 'vitest';
import {
  createStorybookDatabase,
  createTestDatabase,
  destroyTestDatabase,
} from './create-database';

describe('createTestDatabase', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  afterEach(async () => {
    if (db) await destroyTestDatabase(db);
    db = undefined;
  });

  it('creates app_meta collection', async () => {
    db = await createTestDatabase();
    expect(db.app_meta).toBeDefined();
  });

  it('adds all collections', async () => {
    db = await createTestDatabase();
    const names = [
      'app_meta',
      'custom_games',
      'profiles',
      'progress',
      'settings',
      'game_config_overrides',
      'saved_game_configs',
      'themes',
      'session_history',
      'session_history_index',
      'sync_meta',
      'word_spell_seen_words',
    ] as const;
    for (const name of names) {
      expect(db[name]).toBeDefined();
    }
  });
});

describe('createStorybookDatabase', () => {
  let db:
    | Awaited<ReturnType<typeof createStorybookDatabase>>
    | undefined;
  afterEach(async () => {
    if (db) await destroyTestDatabase(db);
    db = undefined;
  });

  it('uses memory storage and runs migrations', async () => {
    db = await createStorybookDatabase();
    const meta = await db.app_meta.findOne('singleton').exec();
    expect(meta).not.toBeNull();
  });
});
