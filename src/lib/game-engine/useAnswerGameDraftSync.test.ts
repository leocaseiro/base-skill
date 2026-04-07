import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';
import type { AnswerGameState } from '@/components/answer-game/types';
import { useAnswerGameDraftSync } from './useAnswerGameDraftSync';

const baseIndex = {
  sessionId: 'draft-sess-001',
  profileId: 'prof-draft',
  gameId: 'word-spell',
  gradeBand: 'year1-2',
  seed: 'seed-abc',
  initialContent: { rounds: [] },
  initialState: {},
  startedAt: new Date().toISOString(),
  status: 'in-progress' as const,
};

const makeTile = (id: string) => ({
  id,
  label: id,
  value: id,
});

const makeZone = (id: string) => ({
  id,
  index: 0,
  expectedValue: id,
  placedTileId: null,
  isWrong: false,
  isLocked: false,
});

const makeState = (
  overrides: Partial<AnswerGameState> = {},
): AnswerGameState => ({
  config: {
    gameId: 'word-spell',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
  },
  allTiles: [makeTile('a'), makeTile('b')],
  bankTileIds: ['a'],
  zones: [makeZone('z1')],
  activeSlotIndex: 0,
  dragActiveTileId: null,
  phase: 'playing',
  roundIndex: 0,
  retryCount: 0,
  ...overrides,
});

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  await db.session_history_index.insert(baseIndex);
  vi.useFakeTimers();
});

afterEach(async () => {
  vi.useRealTimers();
  await destroyTestDatabase(db);
});

describe('useAnswerGameDraftSync', () => {
  it('writes draftState to RxDB after 500ms debounce', async () => {
    const state = makeState();
    renderHook(() =>
      useAnswerGameDraftSync(state, 'draft-sess-001', db),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).not.toBeNull();
    const draft = doc?.draftState as Record<string, unknown>;
    expect(draft?.phase).toBe('playing');
    expect(draft?.roundIndex).toBe(0);
    expect(draft?.bankTileIds).toEqual(['a']);
  });

  it('does not fire before 500ms', async () => {
    const state = makeState();
    renderHook(() =>
      useAnswerGameDraftSync(state, 'draft-sess-001', db),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).toBeUndefined();
  });

  it('writes null when phase is game-over', async () => {
    const state = makeState({ phase: 'game-over' });
    renderHook(() =>
      useAnswerGameDraftSync(state, 'draft-sess-001', db),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).toBeNull();
  });

  it('is a no-op when sessionId is null', async () => {
    const state = makeState();
    renderHook(() => useAnswerGameDraftSync(state, null, db));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).toBeUndefined();
  });

  it('is a no-op when db is null', async () => {
    const state = makeState();
    renderHook(() =>
      useAnswerGameDraftSync(state, 'draft-sess-001', null),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).toBeUndefined();
  });

  it('flushes immediately on visibilitychange hidden', async () => {
    const state = makeState();
    renderHook(() =>
      useAnswerGameDraftSync(state, 'draft-sess-001', db),
    );

    // Not yet fired (debounce pending)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Simulate tab hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      // Allow flush promise to resolve
      await Promise.resolve();
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).not.toBeUndefined();

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });
});
