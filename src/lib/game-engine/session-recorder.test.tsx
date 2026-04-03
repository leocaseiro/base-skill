// src/lib/game-engine/session-recorder.test.tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useSessionRecorder } from './session-recorder';
import type {
  GameEngineState,
  Move,
  ResolvedContent,
  SessionMeta,
} from './types';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

const content: ResolvedContent = {
  rounds: [{ id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' }],
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

const meta: SessionMeta = {
  profileId: 'prof-1',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'test-seed',
  initialContent: content,
  initialState,
};

function makeMove(type: Move['type'], args: Move['args'] = {}): Move {
  return { type, args, timestamp: Date.now() };
}

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await destroyTestDatabase(db);
});

describe('useSessionRecorder', () => {
  it('creates session_history_index document on mount with status in-progress', async () => {
    const sessionId = 'sess-recorder-001';
    renderHook(() =>
      useSessionRecorder([], sessionId, meta, db, 'playing'),
    );

    await waitFor(async () => {
      const doc = await db.session_history_index
        .findOne(sessionId)
        .exec();
      expect(doc).not.toBeNull();
      expect(doc?.status).toBe('in-progress');
      expect(doc?.seed).toBe('test-seed');
    });
  });

  it('writes moves to session_history chunk on every move addition', async () => {
    const sessionId = 'sess-recorder-002';
    const moves1: Move[] = [makeMove('SUBMIT_ANSWER', { answer: 'A' })];

    const { rerender } = renderHook(
      ({ moves, phase }: { moves: Move[]; phase: string }) =>
        useSessionRecorder(moves, sessionId, meta, db, phase),
      { initialProps: { moves: [] as Move[], phase: 'playing' } },
    );

    act(() => {
      rerender({ moves: moves1, phase: 'playing' });
    });

    await waitFor(async () => {
      const chunkId = `${sessionId}-chunk-0`;
      const chunk = await db.session_history.findOne(chunkId).exec();
      expect(chunk).not.toBeNull();
      expect(chunk?.events).toHaveLength(1);
      expect(chunk?.events[0]?.action).toBe('SUBMIT_ANSWER');
    });
  });

  it('marks session as completed and sets endedAt when phase is game-over', async () => {
    const sessionId = 'sess-recorder-003';
    const moves: Move[] = [makeMove('SUBMIT_ANSWER', { answer: 'A' })];

    const { rerender } = renderHook(
      ({ phase }: { phase: string }) =>
        useSessionRecorder(moves, sessionId, meta, db, phase),
      { initialProps: { phase: 'playing' } },
    );

    act(() => {
      rerender({ phase: 'game-over' });
    });

    await waitFor(async () => {
      const doc = await db.session_history_index
        .findOne(sessionId)
        .exec();
      expect(doc?.status).toBe('completed');
      expect(doc?.endedAt).toBeTruthy();
    });
  });

  it('starts a new chunk when 200-move limit is reached', async () => {
    const sessionId = 'sess-recorder-004';
    const moves: Move[] = Array.from({ length: 201 }, (_, i) =>
      makeMove('SUBMIT_ANSWER', { answer: `a${i}` }),
    );

    renderHook(() =>
      useSessionRecorder(moves, sessionId, meta, db, 'playing'),
    );

    await waitFor(async () => {
      const chunk1 = await db.session_history
        .findOne(`${sessionId}-chunk-1`)
        .exec();
      expect(chunk1).not.toBeNull();
    });
  });
});
