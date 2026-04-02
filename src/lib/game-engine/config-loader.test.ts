// src/lib/game-engine/config-loader.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGameConfig } from './config-loader';
import type { ResolvedGameConfig } from './types';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

let db: BaseSkillDatabase;

const defaultConfig: ResolvedGameConfig = {
  gameId: 'word-builder',
  title: { en: 'Word Builder' },
  gradeBand: 'year1-2',
  maxRounds: 5,
  maxRetries: 2,
  maxUndoDepth: 3,
  timerVisible: true,
  timerDurationSeconds: 60,
  difficulty: 'medium',
};

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('loadGameConfig', () => {
  it('returns the default config when no overrides exist', async () => {
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result).toEqual(defaultConfig);
  });

  it('applies game-specific override (highest priority)', async () => {
    await db.game_config_overrides.insert({
      id: 'override-game',
      profileId: 'prof-1',
      scope: 'game',
      scopeValue: 'word-builder',
      retries: 0,
      timerDuration: null,
      alwaysWin: null,
      difficulty: null,
      updatedAt: new Date().toISOString(),
    });
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.maxRetries).toBe(0);
    expect(result.timerDurationSeconds).toBe(60); // not overridden (null means "no override")
  });

  it('applies grade-band override when no game override exists', async () => {
    await db.game_config_overrides.insert({
      id: 'override-grade',
      profileId: 'prof-1',
      scope: 'grade-band',
      scopeValue: 'year1-2',
      retries: null,
      timerDuration: 30,
      alwaysWin: null,
      difficulty: null,
      updatedAt: new Date().toISOString(),
    });
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.timerDurationSeconds).toBe(30);
    expect(result.timerVisible).toBe(true); // timerDuration set → visible
  });

  it('grade-band override does not apply for a different grade band', async () => {
    await db.game_config_overrides.insert({
      id: 'override-grade-other',
      profileId: 'prof-1',
      scope: 'grade-band',
      scopeValue: 'year3-4', // different grade band
      retries: null,
      timerDuration: 30,
      alwaysWin: null,
      difficulty: null,
      updatedAt: new Date().toISOString(),
    });
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.timerDurationSeconds).toBe(60); // unchanged
  });

  it('applies global override when no game or grade-band override exists', async () => {
    await db.game_config_overrides.insert({
      id: 'override-global',
      profileId: 'prof-1',
      scope: 'global',
      scopeValue: null,
      retries: null,
      timerDuration: null,
      alwaysWin: null,
      difficulty: 'easy',
      updatedAt: new Date().toISOString(),
    });
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.difficulty).toBe('easy');
  });

  it('game override takes priority over grade-band override', async () => {
    await db.game_config_overrides.bulkInsert([
      {
        id: 'override-grade-2',
        profileId: 'prof-1',
        scope: 'grade-band',
        scopeValue: 'year1-2',
        retries: 5,
        timerDuration: null,
        alwaysWin: null,
        difficulty: null,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'override-game-2',
        profileId: 'prof-1',
        scope: 'game',
        scopeValue: 'word-builder',
        retries: 1,
        timerDuration: null,
        alwaysWin: null,
        difficulty: null,
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.maxRetries).toBe(1); // game override wins
  });

  it('timerVisible is false when timerDuration override is 0', async () => {
    await db.game_config_overrides.insert({
      id: 'override-timer',
      profileId: 'prof-1',
      scope: 'game',
      scopeValue: 'word-builder',
      retries: null,
      timerDuration: 0,
      alwaysWin: null,
      difficulty: null,
      updatedAt: new Date().toISOString(),
    });
    const result = await loadGameConfig(
      'word-builder',
      'prof-1',
      'year1-2',
      db,
      defaultConfig,
    );
    expect(result.timerDurationSeconds).toBe(0);
    expect(result.timerVisible).toBe(false);
  });
});
