// src/db/schemas/session_history_index.test.ts
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

describe('session_history_index schema v1', () => {
  it('inserts a document with status, seed, initialContent, initialState', async () => {
    const doc = await db.session_history_index.insert({
      sessionId: 'sess-001',
      profileId: 'prof-001',
      gameId: 'word-builder',
      startedAt: new Date().toISOString(),
      gradeBand: 'year1-2',
      status: 'in-progress',
      seed: 'abc123',
      initialContent: { rounds: [] },
      initialState: { phase: 'instructions', roundIndex: 0 },
    });

    expect(doc.status).toBe('in-progress');
    expect(doc.seed).toBe('abc123');
    expect(doc.initialContent).toEqual({ rounds: [] });
  });

  it('rejects a document without status', async () => {
    await expect(
      db.session_history_index.insert({
        sessionId: 'sess-002',
        profileId: 'prof-001',
        gameId: 'word-builder',
        startedAt: new Date().toISOString(),
        gradeBand: 'year1-2',
        // missing status, seed, initialContent, initialState
      } as Parameters<typeof db.session_history_index.insert>[0]),
    ).rejects.toThrow();
  });

  it('supports querying by status and profileId', async () => {
    await db.session_history_index.insert({
      sessionId: 'sess-003',
      profileId: 'prof-002',
      gameId: 'word-builder',
      startedAt: new Date().toISOString(),
      gradeBand: 'year1-2',
      status: 'in-progress',
      seed: 'xyz789',
      initialContent: { rounds: [] },
      initialState: {},
    });

    const found = await db.session_history_index
      .findOne({
        selector: { profileId: 'prof-002', status: 'in-progress' },
      })
      .exec();

    expect(found?.sessionId).toBe('sess-003');
  });
});
