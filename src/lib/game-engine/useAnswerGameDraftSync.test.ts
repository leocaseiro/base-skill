import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useAnswerGameDraftSync } from './useAnswerGameDraftSync';
import type { AnswerGameState } from '@/components/answer-game/types';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';

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
    expect(draft.phase).toBe('playing');
    expect(draft.roundIndex).toBe(0);
    expect(draft.bankTileIds).toEqual(['a']);
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

  it('resets the debounce when state changes', async () => {
    const { rerender } = renderHook(
      ({ state }: { state: AnswerGameState }) =>
        useAnswerGameDraftSync(state, 'draft-sess-001', db),
      { initialProps: { state: makeState() } },
    );

    // Advance 300ms — debounce still pending
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Change state — resets the debounce
    rerender({ state: makeState({ roundIndex: 1 }) });

    // Advance another 300ms (total 600ms from start, but only 300ms from reset)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Should still NOT have written (debounce reset, need 500ms from second render)
    const docBefore = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(docBefore?.draftState).toBeUndefined();

    // Advance remaining 200ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Allow the async setTimeout callback (findOne + incrementalPatch) to settle
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Now it should have written with the new state
    const docAfter = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    const draft = docAfter?.draftState as Record<string, unknown>;
    expect(draft.roundIndex).toBe(1);
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

    // Allow all pending promises (RxDB findOne + incrementalPatch) to settle
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const doc = await db.session_history_index
      .findOne('draft-sess-001')
      .exec();
    expect(doc?.draftState).not.toBeNull();
    const draft = doc?.draftState as Record<string, unknown>;
    expect(draft.phase).toBe('playing');

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });
});
