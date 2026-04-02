// src/lib/game-engine/session-finder.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findInProgressSession } from './session-finder';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

let db: BaseSkillDatabase;

const baseIndex = {
  sessionId: 'sess-finder-001',
  profileId: 'prof-finder',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'seed-xyz',
  initialContent: {
    rounds: [{ id: 'r1', prompt: { en: 'Q' }, correctAnswer: 'A' }],
  },
  initialState: {
    phase: 'playing',
    roundIndex: 0,
    score: 0,
    streak: 0,
    retryCount: 0,
  },
};

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('findInProgressSession', () => {
  it('returns null when no in-progress session exists', async () => {
    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );
    expect(result).toBeNull();
  });

  it('returns null for a completed session', async () => {
    await db.session_history_index.insert({
      ...baseIndex,
      startedAt: new Date().toISOString(),
      status: 'completed',
    });
    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );
    expect(result).toBeNull();
  });

  it('returns a hydrated MoveLog for an in-progress session with chunks', async () => {
    const startedAt = new Date().toISOString();
    await db.session_history_index.insert({
      ...baseIndex,
      startedAt,
      status: 'in-progress',
    });
    await db.session_history.insert({
      id: 'sess-finder-001-chunk-0',
      sessionId: 'sess-finder-001',
      profileId: 'prof-finder',
      gameId: 'word-builder',
      chunkIndex: 0,
      events: [
        {
          timestamp: new Date().toISOString(),
          action: 'SUBMIT_ANSWER',
          payload: { answer: 'A' },
          result: null,
        },
      ],
      createdAt: startedAt,
    });

    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );

    expect(result).not.toBeNull();
    expect(result?.sessionId).toBe('sess-finder-001');
    expect(result?.seed).toBe('seed-xyz');
    expect(result?.moves).toHaveLength(1);
    expect(result?.moves[0]?.type).toBe('SUBMIT_ANSWER');
    expect(result?.moves[0]?.args).toEqual({ answer: 'A' });
  });

  it('returns null and marks session abandoned if startedAt is older than 24h', async () => {
    const staleDate = new Date(
      Date.now() - 25 * 60 * 60 * 1000,
    ).toISOString();
    await db.session_history_index.insert({
      ...baseIndex,
      sessionId: 'sess-stale',
      startedAt: staleDate,
      status: 'in-progress',
    });

    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );
    expect(result).toBeNull();

    const doc = await db.session_history_index
      .findOne('sess-stale')
      .exec();
    expect(doc?.status).toBe('abandoned');
  });

  it('returns null for a different profileId', async () => {
    await db.session_history_index.insert({
      ...baseIndex,
      startedAt: new Date().toISOString(),
      status: 'in-progress',
    });
    const result = await findInProgressSession(
      'other-prof',
      'word-builder',
      db,
    );
    expect(result).toBeNull();
  });

  it('merges events from multiple chunks in chunkIndex order', async () => {
    const startedAt = new Date().toISOString();
    await db.session_history_index.insert({
      ...baseIndex,
      sessionId: 'sess-chunks',
      startedAt,
      status: 'in-progress',
    });
    await db.session_history.bulkInsert([
      {
        id: 'sess-chunks-chunk-1',
        sessionId: 'sess-chunks',
        profileId: 'prof-finder',
        gameId: 'word-builder',
        chunkIndex: 1,
        events: [
          {
            timestamp: new Date().toISOString(),
            action: 'NEXT_ROUND',
            payload: {},
            result: null,
          },
        ],
        createdAt: startedAt,
      },
      {
        id: 'sess-chunks-chunk-0',
        sessionId: 'sess-chunks',
        profileId: 'prof-finder',
        gameId: 'word-builder',
        chunkIndex: 0,
        events: [
          {
            timestamp: new Date().toISOString(),
            action: 'SUBMIT_ANSWER',
            payload: { answer: 'A' },
            result: null,
          },
        ],
        createdAt: startedAt,
      },
    ]);

    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );
    expect(result?.moves[0]?.type).toBe('SUBMIT_ANSWER');
    expect(result?.moves[1]?.type).toBe('NEXT_ROUND');
  });
});
