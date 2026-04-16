# Service Worker, Workbox & Offline-First Implementation Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add game session resume via RxDB snapshot persistence, harden the existing
vite-plugin-pwa setup for offline-first SPA navigation, and display a version/Beta badge
throughout the app.

**Architecture:** Three parallel capabilities land in one branch. Game state persists to
`session_history_index.draftState` (RxDB, debounced) so page refresh resumes mid-game
silently. The service worker gains `navigateFallback` so all SPA routes load offline. An
`UpdateBanner` appears when a new SW is waiting, suppressed on game routes to avoid
interrupting play.

**Tech Stack:** TanStack Start, React 19, RxDB (Dexie), vite-plugin-pwa, workbox-window.

> **All commands run from inside the worktree** unless stated otherwise:
> `cd worktrees/feat/service-worker-workbox-offline-setup`

---

## File Map

### New files

| File                                                 | Purpose                                      |
| ---------------------------------------------------- | -------------------------------------------- |
| `src/components/answer-game/types.ts`                | Extended — add `AnswerGameDraftState` export |
| `src/lib/game-engine/useAnswerGameDraftSync.ts`      | Debounced draft state → RxDB hook            |
| `src/lib/game-engine/useAnswerGameDraftSync.test.ts` | Unit tests for the hook                      |
| `src/lib/service-worker/ServiceWorkerContext.ts`     | `{ updateAvailable, applyUpdate }` context   |
| `src/lib/service-worker/useServiceWorker.ts`         | workbox-window registration + update hook    |
| `src/lib/service-worker/ServiceWorkerProvider.tsx`   | Provider wrapping root                       |
| `src/components/UpdateBanner.tsx`                    | SW update notification strip                 |
| `src/lib/version.ts`                                 | `APP_VERSION`, `IS_BETA` constants           |

### Modified files

| File                                                     | Change                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `src/db/schemas/session_history_index.ts`                | v1 → v2; add `draftState` field                            |
| `src/db/create-database.ts`                              | Migration strategy 2 for `session_history_index`           |
| `src/lib/game-engine/session-finder.ts`                  | Return `{ log, draftState }` instead of bare `MoveLog`     |
| `src/lib/game-engine/session-finder.test.ts`             | Update existing tests + add `draftState` test              |
| `src/components/answer-game/AnswerGameProvider.tsx`      | `initialState` + `sessionId` props; mount hook             |
| `src/components/answer-game/AnswerGameProvider.test.tsx` | Add `initialState` tests                                   |
| `src/components/answer-game/AnswerGame/AnswerGame.tsx`   | Pass `initialState` through                                |
| `src/games/word-spell/WordSpell/WordSpell.tsx`           | Accept + forward `initialState`                            |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`     | Accept + forward `initialState`                            |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`     | Accept + forward `initialState`                            |
| `src/routes/$locale/_app/game/$gameId.tsx`               | Loader returns `draftState`; bodies skip instructions      |
| `vite.config.ts`                                         | SW hardening: `navigateFallback`, `registerType: 'prompt'` |
| `src/routes/__root.tsx`                                  | Wrap in `ServiceWorkerProvider`                            |
| `src/routes/$locale/_app.tsx`                            | Add `<UpdateBanner />`                                     |
| `src/components/Header.tsx`                              | Beta badge + version                                       |
| `src/routes/$locale/_app/parent/index.tsx`               | About section                                              |

---

## Task 1: `AnswerGameDraftState` type + schema v2 + migration

**Files:**

- Modify: `src/components/answer-game/types.ts`
- Modify: `src/db/schemas/session_history_index.ts`
- Modify: `src/db/create-database.ts`

- [ ] **Step 1.1: Add `AnswerGameDraftState` to `types.ts`**

  Append after the last export in `src/components/answer-game/types.ts`:

  ```ts
  /**
   * Snapshot of AnswerGameState persisted to session_history_index.draftState.
   * Excludes dragActiveTileId (transient) and 'game-over' phase (cleared on completion).
   */
  export interface AnswerGameDraftState {
    allTiles: TileItem[];
    bankTileIds: string[];
    zones: AnswerZone[];
    activeSlotIndex: number;
    phase: 'playing' | 'round-complete';
    roundIndex: number;
    retryCount: number;
  }
  ```

- [ ] **Step 1.2: Bump `session_history_index` schema to version 2**

  Replace the content of `src/db/schemas/session_history_index.ts` with:

  ```ts
  import type { RxJsonSchema } from 'rxdb';

  export type SessionHistoryIndexDoc = {
    sessionId: string;
    profileId: string;
    gameId: string;
    startedAt: string;
    endedAt?: string | null;
    duration?: number | null;
    finalScore?: number | null;
    totalEvents?: number;
    totalChunks?: number;
    gradeBand: string;
    // v1 additions
    status: 'in-progress' | 'completed' | 'abandoned';
    seed: string;
    initialContent: Record<string, unknown>;
    initialState: Record<string, unknown>;
    // v2 additions
    draftState?: Record<string, unknown> | null;
  };

  export const sessionHistoryIndexSchema: RxJsonSchema<SessionHistoryIndexDoc> =
    {
      version: 2,
      primaryKey: 'sessionId',
      type: 'object',
      properties: {
        sessionId: { type: 'string', maxLength: 36 },
        profileId: { type: 'string', maxLength: 36 },
        gameId: { type: 'string', maxLength: 64 },
        startedAt: { type: 'string', format: 'date-time' },
        endedAt: {
          oneOf: [
            { type: 'string', format: 'date-time' },
            { type: 'null' },
          ],
        },
        duration: {
          oneOf: [{ type: 'number', minimum: 0 }, { type: 'null' }],
        },
        finalScore: {
          oneOf: [{ type: 'number' }, { type: 'null' }],
        },
        totalEvents: {
          type: 'integer',
          minimum: 0,
          default: 0,
          multipleOf: 1,
        },
        totalChunks: {
          type: 'integer',
          minimum: 1,
          default: 1,
          multipleOf: 1,
        },
        gradeBand: { type: 'string' },
        status: {
          type: 'string',
          enum: ['in-progress', 'completed', 'abandoned'],
        },
        seed: { type: 'string' },
        initialContent: { type: 'object', additionalProperties: true },
        initialState: { type: 'object', additionalProperties: true },
        draftState: {
          oneOf: [
            { type: 'object', additionalProperties: true },
            { type: 'null' },
          ],
        },
      },
      required: [
        'sessionId',
        'profileId',
        'gameId',
        'startedAt',
        'gradeBand',
        'status',
        'seed',
        'initialContent',
        'initialState',
      ],
      additionalProperties: false,
    };
  ```

- [ ] **Step 1.3: Add migration strategy 2 in `create-database.ts`**

  Find the `session_history_index` entry in `COLLECTIONS` (around line 45) and add the
  `2:` strategy:

  ```ts
  session_history_index: {
    schema: sessionHistoryIndexSchema,
    migrationStrategies: {
      1: (oldDoc: Record<string, unknown>) => ({
        ...oldDoc,
        status: 'completed',
        seed: '',
        initialContent: { rounds: [] },
        initialState: {},
      }),
      2: (oldDoc: Record<string, unknown>) => ({
        ...oldDoc,
        draftState: null,
      }),
    },
  },
  ```

- [ ] **Step 1.4: Verify TypeScript compiles**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 1.5: Commit**

  ```bash
  git add src/components/answer-game/types.ts \
          src/db/schemas/session_history_index.ts \
          src/db/create-database.ts
  git commit -m "feat(db): add AnswerGameDraftState type and session_history_index schema v2"
  ```

---

## Task 2: `useAnswerGameDraftSync` hook + unit tests

**Files:**

- Create: `src/lib/game-engine/useAnswerGameDraftSync.ts`
- Create: `src/lib/game-engine/useAnswerGameDraftSync.test.ts`

- [ ] **Step 2.1: Write the failing tests**

  Create `src/lib/game-engine/useAnswerGameDraftSync.test.ts`:

  ```ts
  import { act, renderHook, waitFor } from '@testing-library/react';
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

  vi.useFakeTimers();

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
  });

  afterEach(async () => {
    await destroyTestDatabase(db);
    vi.clearAllTimers();
  });

  describe('useAnswerGameDraftSync', () => {
    it('writes draftState to RxDB after 500ms debounce', async () => {
      const state = makeState();
      renderHook(() =>
        useAnswerGameDraftSync(state, 'draft-sess-001', db),
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(async () => {
        const doc = await db.session_history_index
          .findOne('draft-sess-001')
          .exec();
        expect(doc?.draftState).not.toBeNull();
      });

      const doc = await db.session_history_index
        .findOne('draft-sess-001')
        .exec();
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

      act(() => {
        vi.advanceTimersByTime(499);
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

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(async () => {
        const doc = await db.session_history_index
          .findOne('draft-sess-001')
          .exec();
        expect(doc?.draftState).toBeNull();
      });
    });

    it('is a no-op when sessionId is null', async () => {
      const state = makeState();
      renderHook(() => useAnswerGameDraftSync(state, null, db));

      act(() => {
        vi.advanceTimersByTime(500);
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

      act(() => {
        vi.advanceTimersByTime(500);
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
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Simulate tab hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(async () => {
        const doc = await db.session_history_index
          .findOne('draft-sess-001')
          .exec();
        expect(doc?.draftState).not.toBeUndefined();
      });

      // Restore
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
    });
  });
  ```

- [ ] **Step 2.2: Run tests to confirm they fail**

  ```bash
  yarn test src/lib/game-engine/useAnswerGameDraftSync.test.ts
  ```

  Expected: FAIL with "Cannot find module './useAnswerGameDraftSync'".

- [ ] **Step 2.3: Implement `useAnswerGameDraftSync`**

  Create `src/lib/game-engine/useAnswerGameDraftSync.ts`:

  ```ts
  import { useEffect, useRef } from 'react';
  import type {
    AnswerGameDraftState,
    AnswerGameState,
  } from '@/components/answer-game/types';
  import type { BaseSkillDatabase } from '@/db/types';

  const buildDraft = (
    state: AnswerGameState,
  ): AnswerGameDraftState | null => {
    if (state.phase === 'game-over') return null;
    return {
      allTiles: state.allTiles,
      bankTileIds: state.bankTileIds,
      zones: state.zones,
      activeSlotIndex: state.activeSlotIndex,
      phase: state.phase,
      roundIndex: state.roundIndex,
      retryCount: state.retryCount,
    };
  };

  /**
   * Persists AnswerGameState snapshots to session_history_index.draftState.
   * - Debounced 500 ms on every state change.
   * - Flushes immediately on visibilitychange → hidden.
   * - Writes null when phase === 'game-over' (clears draft on completion).
   * - No-op when sessionId or db is null.
   */
  export const useAnswerGameDraftSync = (
    state: AnswerGameState,
    sessionId: string | null,
    db: BaseSkillDatabase | null,
  ): void => {
    // Refs so event-listener callbacks always read the latest values
    const latestRef = useRef({ state, sessionId, db });
    latestRef.current = { state, sessionId, db };

    // Debounced write: resets on every state/sessionId/db change
    useEffect(() => {
      if (!sessionId || !db) return;

      const timer = setTimeout(async () => {
        const { state: s, db: d, sessionId: sid } = latestRef.current;
        if (!d || !sid) return;

        const doc = await d.session_history_index.findOne(sid).exec();
        if (!doc) return;

        const draft = buildDraft(s);
        await doc.incrementalPatch({
          draftState: draft as unknown as Record<
            string,
            unknown
          > | null,
        });
      }, 500);

      return () => clearTimeout(timer);
    }, [state, sessionId, db]); // eslint-disable-line react-hooks/exhaustive-deps

    // Immediate flush on tab hidden
    useEffect(() => {
      const flush = async () => {
        if (document.visibilityState !== 'hidden') return;
        const { state: s, db: d, sessionId: sid } = latestRef.current;
        if (!d || !sid) return;

        const doc = await d.session_history_index.findOne(sid).exec();
        if (!doc) return;

        const draft = buildDraft(s);
        await doc.incrementalPatch({
          draftState: draft as unknown as Record<
            string,
            unknown
          > | null,
        });
      };

      document.addEventListener('visibilitychange', flush);
      return () =>
        document.removeEventListener('visibilitychange', flush);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  };
  ```

- [ ] **Step 2.4: Run tests — expect all to pass**

  ```bash
  yarn test src/lib/game-engine/useAnswerGameDraftSync.test.ts
  ```

  Expected: all tests PASS.

- [ ] **Step 2.5: Commit**

  ```bash
  git add src/lib/game-engine/useAnswerGameDraftSync.ts \
          src/lib/game-engine/useAnswerGameDraftSync.test.ts
  git commit -m "feat(game-engine): add useAnswerGameDraftSync hook for session draft persistence"
  ```

---

## Task 3: Extend `findInProgressSession` + update tests

**Files:**

- Modify: `src/lib/game-engine/session-finder.ts`
- Modify: `src/lib/game-engine/session-finder.test.ts`

- [ ] **Step 3.1: Update existing tests to use new return shape**

  The return type changes from `MoveLog | null` to
  `{ log: MoveLog; draftState: AnswerGameDraftState | null } | null`.

  In `src/lib/game-engine/session-finder.test.ts`, update all assertions that
  access `result?.` properties directly to go through `result?.log.`:

  ```ts
  // Add import at top
  import type { AnswerGameDraftState } from '@/components/answer-game/types';
  ```

  Update the test "returns a hydrated MoveLog for an in-progress session with chunks":

  ```ts
  it('returns a hydrated MoveLog for an in-progress session with chunks', async () => {
    // ... (insert setup unchanged) ...

    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );

    expect(result).not.toBeNull();
    expect(result?.log.sessionId).toBe('sess-finder-001');
    expect(result?.log.seed).toBe('seed-xyz');
    expect(result?.log.moves).toHaveLength(1);
    expect(result?.log.moves[0]?.type).toBe('SUBMIT_ANSWER');
    expect(result?.log.moves[0]?.args).toEqual({ answer: 'A' });
    expect(result?.draftState).toBeNull();
  });
  ```

  Update "merges events from multiple chunks in chunkIndex order":

  ```ts
  const result = await findInProgressSession(
    'prof-finder',
    'word-builder',
    db,
  );
  expect(result?.log.moves[0]?.type).toBe('SUBMIT_ANSWER');
  expect(result?.log.moves[1]?.type).toBe('NEXT_ROUND');
  ```

  Add a new test at the end of the `describe` block:

  ```ts
  it('returns draftState when present on the index document', async () => {
    const draft: AnswerGameDraftState = {
      allTiles: [{ id: 't1', label: 'c', value: 'c' }],
      bankTileIds: ['t1'],
      zones: [
        {
          id: 'z1',
          index: 0,
          expectedValue: 'c',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
    };

    await db.session_history_index.insert({
      ...baseIndex,
      sessionId: 'sess-with-draft',
      startedAt: new Date().toISOString(),
      status: 'in-progress',
      draftState: draft as unknown as Record<string, unknown>,
    });

    const result = await findInProgressSession(
      'prof-finder',
      'word-builder',
      db,
    );

    expect(result?.draftState).toEqual(draft);
  });
  ```

- [ ] **Step 3.2: Run tests — expect failures**

  ```bash
  yarn test src/lib/game-engine/session-finder.test.ts
  ```

  Expected: FAIL — `result?.sessionId` is undefined, `result?.log` doesn't exist yet.

- [ ] **Step 3.3: Update `findInProgressSession` implementation**

  Replace `src/lib/game-engine/session-finder.ts` with:

  ```ts
  // src/lib/game-engine/session-finder.ts
  import type {
    GameEngineState,
    Move,
    MoveLog,
    MoveType,
    ResolvedContent,
  } from './types';
  import type { AnswerGameDraftState } from '@/components/answer-game/types';
  import type { BaseSkillDatabase } from '@/db/types';

  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  export interface InProgressSession {
    log: MoveLog;
    draftState: AnswerGameDraftState | null;
  }

  export async function findInProgressSession(
    profileId: string,
    gameId: string,
    db: BaseSkillDatabase,
  ): Promise<InProgressSession | null> {
    const index = await db.session_history_index
      .findOne({
        selector: { profileId, gameId, status: 'in-progress' },
      })
      .exec();

    if (!index) return null;

    // Check staleness
    const ageMs = Date.now() - new Date(index.startedAt).getTime();
    if (ageMs > STALE_THRESHOLD_MS) {
      await index.incrementalPatch({ status: 'abandoned' });
      return null;
    }

    // Load all chunks sorted by chunkIndex
    const chunks = await db.session_history
      .find({ selector: { sessionId: index.sessionId } })
      .exec();

    const allEvents = chunks
      .toSorted((a, b) => a.chunkIndex - b.chunkIndex)
      .flatMap(
        (c) =>
          c.events as Array<{
            timestamp: string;
            action: string;
            payload: Record<string, string | number | boolean> | null;
            result: null;
          }>,
      );

    const moves: Move[] = allEvents.map((e) => ({
      type: e.action as MoveType,
      args: (e.payload ?? {}) as unknown as Record<
        string,
        string | number | boolean
      >,
      timestamp: new Date(e.timestamp).getTime(),
    }));

    const log: MoveLog = {
      gameId: index.gameId,
      sessionId: index.sessionId,
      profileId: index.profileId,
      seed: index.seed,
      initialContent:
        index.initialContent as unknown as ResolvedContent,
      initialState: index.initialState as unknown as GameEngineState,
      moves,
    };

    const draftState =
      (index.draftState as unknown as AnswerGameDraftState | null) ??
      null;

    return { log, draftState };
  }
  ```

- [ ] **Step 3.4: Run tests — expect all to pass**

  ```bash
  yarn test src/lib/game-engine/session-finder.test.ts
  ```

  Expected: all tests PASS.

- [ ] **Step 3.5: Commit**

  ```bash
  git add src/lib/game-engine/session-finder.ts \
          src/lib/game-engine/session-finder.test.ts
  git commit -m "feat(game-engine): extend findInProgressSession to return draftState"
  ```

---

## Task 4: Update `AnswerGameProvider` — `initialState` prop + draft sync

**Files:**

- Modify: `src/components/answer-game/AnswerGameProvider.tsx`
- Modify: `src/components/answer-game/AnswerGameProvider.test.tsx`

- [ ] **Step 4.1: Add tests for `initialState` prop**

  Append these tests to the `describe('AnswerGameProvider', ...)` block in
  `src/components/answer-game/AnswerGameProvider.test.tsx`:

  ```tsx
  import type { AnswerGameDraftState } from './types';

  // Add inside describe block:

  it('initialises from initialState when provided', () => {
    const draft: AnswerGameDraftState = {
      allTiles: [
        { id: 't-c', label: 'c', value: 'c' },
        { id: 't-a', label: 'a', value: 'a' },
        { id: 't-t', label: 't', value: 't' },
      ],
      bankTileIds: ['t-t'],
      zones: [
        {
          id: 'z1',
          index: 0,
          expectedValue: 'c',
          placedTileId: 't-c',
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'z2',
          index: 1,
          expectedValue: 'a',
          placedTileId: 't-a',
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'z3',
          index: 2,
          expectedValue: 't',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ],
      activeSlotIndex: 2,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
    };

    const BankReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="bank">{state.bankTileIds.join(',')}</div>
      );
    };

    render(
      <AnswerGameProvider config={gameConfig} initialState={draft}>
        <BankReader />
      </AnswerGameProvider>,
    );

    expect(screen.getByTestId('bank')).toHaveTextContent('t-t');
  });

  it('skips INIT_ROUND effect when initialState is provided', async () => {
    const draft: AnswerGameDraftState = {
      allTiles: [{ id: 'x', label: 'x', value: 'x' }],
      bankTileIds: ['x'],
      zones: [],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
    };

    const cfgWithTiles: AnswerGameConfig = {
      ...gameConfig,
      initialTiles: [{ id: 'y', label: 'y', value: 'y' }],
      initialZones: [],
    };

    const BankReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="bank">{state.bankTileIds.join(',')}</div>
      );
    };

    render(
      <AnswerGameProvider config={cfgWithTiles} initialState={draft}>
        <BankReader />
      </AnswerGameProvider>,
    );

    // Should still show draft bankTileIds ('x'), not the config tiles ('y')
    expect(screen.getByTestId('bank')).toHaveTextContent('x');
  });
  ```

- [ ] **Step 4.2: Run tests — expect new tests to fail**

  ```bash
  yarn test src/components/answer-game/AnswerGameProvider.test.tsx
  ```

  Expected: 2 new tests FAIL (prop not accepted yet).

- [ ] **Step 4.3: Update `AnswerGameProvider.tsx`**

  Replace the content of `src/components/answer-game/AnswerGameProvider.tsx`:

  ```tsx
  import {
    createContext,
    useContext,
    useEffect,
    useReducer,
  } from 'react';
  import {
    answerGameReducer,
    makeInitialState,
  } from './answer-game-reducer';
  import { HiddenKeyboardInput } from './HiddenKeyboardInput';
  import { TouchKeyboardContext } from './TouchKeyboardContext';
  import { useKeyboardInput } from './useKeyboardInput';
  import { useTouchKeyboardInput } from './useTouchKeyboardInput';
  import type {
    AnswerGameAction,
    AnswerGameConfig,
    AnswerGameDraftState,
    AnswerGameState,
  } from './types';
  import type { Dispatch, ReactNode } from 'react';
  import { GameRoundContext } from '@/lib/game-engine/GameRoundContext';
  import { useAnswerGameDraftSync } from '@/lib/game-engine/useAnswerGameDraftSync';
  import { DbContext } from '@/providers/DbProvider';

  export const AnswerGameStateContext =
    createContext<AnswerGameState | null>(null);
  export const AnswerGameDispatchContext =
    createContext<Dispatch<AnswerGameAction> | null>(null);

  const KeyboardInputAdapter = () => {
    useKeyboardInput();
    return null;
  };

  const TouchKeyboardAdapter = ({
    inputMode,
    children,
  }: {
    inputMode: NonNullable<AnswerGameConfig['touchKeyboardInputMode']>;
    children: ReactNode;
  }) => {
    const { hiddenInputRef, focusKeyboard } = useTouchKeyboardInput();
    return (
      <TouchKeyboardContext.Provider value={focusKeyboard}>
        <HiddenKeyboardInput
          inputRef={hiddenInputRef}
          inputMode={inputMode}
        />
        {children}
      </TouchKeyboardContext.Provider>
    );
  };

  interface AnswerGameProviderProps {
    config: AnswerGameConfig;
    /** When provided, state is restored from snapshot; INIT_ROUND effect is skipped. */
    initialState?: AnswerGameDraftState;
    /** Session ID used by useAnswerGameDraftSync to find the RxDB document. */
    sessionId?: string;
    children: ReactNode;
  }

  export const AnswerGameProvider = ({
    config,
    initialState,
    sessionId,
    children,
  }: AnswerGameProviderProps) => {
    const [state, dispatch] = useReducer(
      answerGameReducer,
      initialState ?? makeInitialState(config),
    );

    // Mount draft sync — no-op if sessionId/db is absent (unit tests, Storybook)
    const dbCtx = useContext(DbContext);
    useAnswerGameDraftSync(state, sessionId ?? null, dbCtx?.db ?? null);

    useEffect(() => {
      // Skip INIT_ROUND when resuming from a snapshot
      if (initialState) return;
      const tiles = config.initialTiles;
      const zones = config.initialZones;
      if (tiles?.length && zones?.length) {
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      }
    }, [
      config.gameId,
      config.initialTiles,
      config.initialZones,
      initialState,
    ]);

    const roundProgress = {
      current: state.roundIndex + 1,
      total: config.totalRounds,
    };

    const usesTouchKeyboard =
      navigator.maxTouchPoints > 0 && config.inputMethod !== 'drag';

    return (
      <GameRoundContext.Provider value={roundProgress}>
        <AnswerGameStateContext.Provider value={state}>
          <AnswerGameDispatchContext.Provider value={dispatch}>
            {usesTouchKeyboard ? (
              <TouchKeyboardAdapter
                inputMode={config.touchKeyboardInputMode ?? 'text'}
              >
                {children}
              </TouchKeyboardAdapter>
            ) : (
              <TouchKeyboardContext.Provider value={null}>
                <KeyboardInputAdapter />
                {children}
              </TouchKeyboardContext.Provider>
            )}
          </AnswerGameDispatchContext.Provider>
        </AnswerGameStateContext.Provider>
      </GameRoundContext.Provider>
    );
  };
  ```

- [ ] **Step 4.4: Run all `AnswerGameProvider` tests — expect all to pass**

  ```bash
  yarn test src/components/answer-game/AnswerGameProvider.test.tsx
  ```

  Expected: all tests PASS (existing + new).

- [ ] **Step 4.5: Commit**

  ```bash
  git add src/components/answer-game/AnswerGameProvider.tsx \
          src/components/answer-game/AnswerGameProvider.test.tsx
  git commit -m "feat(answer-game): add initialState + sessionId props to AnswerGameProvider; mount draft sync"
  ```

---

## Task 5: Pass `initialState` through `AnswerGame` and game components

**Files:**

- Modify: `src/components/answer-game/AnswerGame/AnswerGame.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 5.1: Update `AnswerGame.tsx` to forward `initialState` + `sessionId`**

  Replace `src/components/answer-game/AnswerGame/AnswerGame.tsx`:

  ```tsx
  import { AnswerGameProvider } from '../AnswerGameProvider';
  import type {
    AnswerGameConfig,
    AnswerGameDraftState,
  } from '../types';
  import type { ReactNode } from 'react';

  interface AnswerGameProps {
    config: AnswerGameConfig;
    initialState?: AnswerGameDraftState;
    sessionId?: string;
    children: ReactNode;
  }

  const AnswerGameRoot = ({
    config,
    initialState,
    sessionId,
    children,
  }: AnswerGameProps) => (
    <AnswerGameProvider
      config={config}
      initialState={initialState}
      sessionId={sessionId}
    >
      <div className="flex min-h-0 w-full flex-col items-center">
        {children}
      </div>
    </AnswerGameProvider>
  );

  const Question = ({ children }: { children?: ReactNode }) => (
    <div className="game-question-zone flex flex-col items-center gap-4 px-4 py-6">
      {children}
    </div>
  );

  const Answer = ({ children }: { children?: ReactNode }) => (
    <div className="game-answer-zone flex flex-wrap justify-center gap-2 px-4 py-4">
      {children}
    </div>
  );

  const Choices = ({ children }: { children?: ReactNode }) => (
    <div className="game-choices-zone flex flex-wrap justify-center gap-3 px-4 py-4">
      {children}
    </div>
  );

  export const AnswerGame = Object.assign(AnswerGameRoot, {
    Question,
    Answer,
    Choices,
  });
  ```

- [ ] **Step 5.2: Update `WordSpell.tsx` to accept and forward `initialState` + `sessionId`**

  In `src/games/word-spell/WordSpell/WordSpell.tsx`, find the `WordSpellProps`
  interface (around line ~20) and the export near the bottom. Add the new props:

  The current interface has `config: WordSpellConfig`. Extend it:

  ```tsx
  // Add import
  import type { AnswerGameDraftState } from '@/components/answer-game/types';

  // Update the interface (find the existing WordSpellProps interface)
  interface WordSpellProps {
    config: WordSpellConfig;
    initialState?: AnswerGameDraftState;
    sessionId?: string;
  }
  ```

  Update the export to destructure and forward the new props. Find the line
  `export const WordSpell = ({ config }: WordSpellProps)` and change to:

  ```tsx
  export const WordSpell = ({
    config,
    initialState,
    sessionId,
  }: WordSpellProps) => {
  ```

  Find the `<AnswerGame config={answerGameConfig}>` JSX near the bottom of the
  component and add the new props:

  ```tsx
  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <WordSpellSession
        wordSpellConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
  ```

- [ ] **Step 5.3: Update `NumberMatch.tsx` to accept and forward `initialState` + `sessionId`**

  In `src/games/number-match/NumberMatch/NumberMatch.tsx`:

  ```tsx
  // Add import
  import type { AnswerGameDraftState } from '@/components/answer-game/types';

  // Update interface (find NumberMatchProps)
  interface NumberMatchProps {
    config: NumberMatchConfig;
    initialState?: AnswerGameDraftState;
    sessionId?: string;
  }

  // Update export signature
  export const NumberMatch = ({
    config,
    initialState,
    sessionId,
  }: NumberMatchProps) => {
  ```

  Find `<AnswerGame config={answerGameConfig}>` and update:

  ```tsx
  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <NumberMatchSession
        numberMatchConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
  ```

- [ ] **Step 5.4: Update `SortNumbers.tsx` to accept and forward `initialState` + `sessionId`**

  In `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`:

  ```tsx
  // Add import
  import type { AnswerGameDraftState } from '@/components/answer-game/types';

  // Update interface (find SortNumbersProps)
  interface SortNumbersProps {
    config: SortNumbersConfig;
    initialState?: AnswerGameDraftState;
    sessionId?: string;
  }

  // Update export signature
  export const SortNumbers = ({
    config,
    initialState,
    sessionId,
  }: SortNumbersProps) => {
  ```

  Find `<AnswerGame config={answerGameConfig}>` and update:

  ```tsx
  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <SortNumbersSession
        sortNumbersConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
  ```

- [ ] **Step 5.5: Verify TypeScript**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 5.6: Run unit tests**

  ```bash
  yarn test
  ```

  Expected: all tests PASS.

- [ ] **Step 5.7: Commit**

  ```bash
  git add src/components/answer-game/AnswerGame/AnswerGame.tsx \
          src/games/word-spell/WordSpell/WordSpell.tsx \
          src/games/number-match/NumberMatch/NumberMatch.tsx \
          src/games/sort-numbers/SortNumbers/SortNumbers.tsx
  git commit -m "feat(games): forward initialState and sessionId through AnswerGame and game components"
  ```

---

## Task 6: Wire `draftState` in the game route

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 6.1: Update `GameRouteLoaderData`, the loader, and game body components**

  The game route file is long; make these targeted changes:

  **6.1a — Add import for `AnswerGameDraftState` and `InProgressSession`:**

  ```tsx
  import type { AnswerGameDraftState } from '@/components/answer-game/types';
  import type { InProgressSession } from '@/lib/game-engine/session-finder';
  ```

  **6.1b — Extend `GameRouteLoaderData` interface** (around line 59):

  ```tsx
  interface GameRouteLoaderData {
    config: ResolvedGameConfig;
    initialLog: MoveLog | null;
    draftState: AnswerGameDraftState | null; // NEW
    sessionId: string;
    meta: SessionMeta;
    gameSpecificConfig: Record<string, unknown> | null;
    custom gameId: string | null;
    custom gameName: string | null;
    custom gameColor: string | null;
  }
  ```

  **6.1c — Update the loader** (around line 556). Replace:

  ```ts
  const initialLog = await findInProgressSession(profileId, gameId, db);
  ```

  With:

  ```ts
  const inProgressSession: InProgressSession | null =
    await findInProgressSession(profileId, gameId, db);
  const initialLog = inProgressSession?.log ?? null;
  const draftState = inProgressSession?.draftState ?? null;
  ```

  Update the session ID, seed, and content resolution (replace lines that use
  `initialLog?.sessionId` etc.):

  ```ts
  const sessionId = initialLog?.sessionId ?? nanoid();
  const seed = initialLog?.seed ?? nanoid();
  const initialContent = initialLog?.initialContent ?? STUB_CONTENT;
  const initialState: GameEngineState = initialLog?.initialState ?? {
    phase: 'instructions',
    roundIndex: 0,
    score: 0,
    streak: 0,
    retryCount: 0,
    content: initialContent,
    currentRound: {
      roundId: initialContent.rounds[0]?.id ?? '',
      answer: null,
      hintsUsed: 0,
    },
  };
  ```

  Update the return statement to include `draftState`:

  ```ts
  return {
    config,
    initialLog,
    draftState,
    sessionId,
    meta,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  };
  ```

  **6.1d — Update `WordSpellGameBody`** to receive and use `draftState`:

  Find the `WordSpellGameBody` component and update its props interface and body:

  ```tsx
  const WordSpellGameBody = ({
    gameId,
    sessionId,
    draftState,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  }: {
    gameId: string;
    sessionId: string;
    draftState: AnswerGameDraftState | null;
    gameSpecificConfig: Record<string, unknown> | null;
    custom gameId: string | null;
    custom gameName: string | null;
    custom gameColor: string | null;
  }): JSX.Element => {
    const { t } = useTranslation('games');
    const { save, updateConfig } = useSavedConfigs();
    const initial = useMemo(
      () => resolveWordSpellConfig(gameSpecificConfig),
      [gameSpecificConfig],
    );
    const [cfg, setCfg] = useState(initial);
    const [showInstructions, setShowInstructions] = useState(
      draftState === null, // false when resuming — skip instructions overlay
    );
    useEffect(() => {
      setCfg(initial);
    }, [initial]);
    usePersistLastGameConfig(
      gameId,
      cfg as unknown as Record<string, unknown>,
    );

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.word-spell')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('word-spell')}
          custom gameName={custom gameName ?? undefined}
          custom gameColor={
            (custom gameColor ?? undefined) as Custom gameColorKey | undefined
          }
          subject="reading"
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}
          onSaveCustom game={async (name, color) => {
            await save({
              gameId,
              name,
              color,
              config: cfg as unknown as Record<string, unknown>,
            });
          }}
          onUpdateCustom game={
            custom gameId
              ? async (name, config) => {
                  await updateConfig(custom gameId, config, name);
                }
              : undefined
          }
          configFields={wordSpellConfigFields}
        />
      );
    }

    return (
      <WordSpell
        key={cfg.inputMethod}
        config={cfg}
        initialState={draftState ?? undefined}
        sessionId={sessionId}
      />
    );
  };
  ```

  **6.1e — Update `NumberMatchGameBody`** similarly:

  ```tsx
  const NumberMatchGameBody = ({
    gameId,
    sessionId,
    draftState,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  }: {
    gameId: string;
    sessionId: string;
    draftState: AnswerGameDraftState | null;
    gameSpecificConfig: Record<string, unknown> | null;
    custom gameId: string | null;
    custom gameName: string | null;
    custom gameColor: string | null;
  }): JSX.Element => {
    const { t } = useTranslation('games');
    const { save, updateConfig } = useSavedConfigs();
    const initial = useMemo(
      () => resolveNumberMatchConfig(gameSpecificConfig),
      [gameSpecificConfig],
    );
    const [cfg, setCfg] = useState(initial);
    const [showInstructions, setShowInstructions] = useState(
      draftState === null,
    );
    useEffect(() => {
      setCfg(initial);
    }, [initial]);
    usePersistLastGameConfig(
      gameId,
      cfg as unknown as Record<string, unknown>,
    );

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.number-match')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('number-match')}
          custom gameName={custom gameName ?? undefined}
          custom gameColor={
            (custom gameColor ?? undefined) as Custom gameColorKey | undefined
          }
          subject="math"
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveNumberMatchConfig(c))}
          onSaveCustom game={async (name, color) => {
            await save({
              gameId,
              name,
              color,
              config: cfg as unknown as Record<string, unknown>,
            });
          }}
          onUpdateCustom game={
            custom gameId
              ? async (name, config) => {
                  await updateConfig(custom gameId, config, name);
                }
              : undefined
          }
          configFields={numberMatchConfigFields}
        />
      );
    }

    return (
      <NumberMatch
        key={cfg.inputMethod}
        config={cfg}
        initialState={draftState ?? undefined}
        sessionId={sessionId}
      />
    );
  };
  ```

  **6.1f — Update `SortNumbersGameBody`** similarly:

  ```tsx
  const SortNumbersGameBody = ({
    gameId,
    sessionId,
    draftState,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  }: {
    gameId: string;
    sessionId: string;
    draftState: AnswerGameDraftState | null;
    gameSpecificConfig: Record<string, unknown> | null;
    custom gameId: string | null;
    custom gameName: string | null;
    custom gameColor: string | null;
  }): JSX.Element => {
    const { t } = useTranslation('games');
    const { save, updateConfig } = useSavedConfigs();
    const initial = useMemo(
      () => resolveSortNumbersConfig(gameSpecificConfig),
      [gameSpecificConfig],
    );
    const [cfg, setCfg] = useState(initial);
    const [showInstructions, setShowInstructions] = useState(
      draftState === null,
    );
    useEffect(() => {
      setCfg(initial);
    }, [initial]);
    usePersistLastGameConfig(
      gameId,
      cfg as unknown as Record<string, unknown>,
    );

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.sort-numbers')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={cfg.ttsEnabled}
          gameTitle={t('sort-numbers')}
          custom gameName={custom gameName ?? undefined}
          custom gameColor={
            (custom gameColor ?? undefined) as Custom gameColorKey | undefined
          }
          subject="math"
          config={cfg as unknown as Record<string, unknown>}
          onConfigChange={(c) => setCfg(resolveSortNumbersConfig(c))}
          onSaveCustom game={async (name, color) => {
            await save({
              gameId,
              name,
              color,
              config: cfg as unknown as Record<string, unknown>,
            });
          }}
          onUpdateCustom game={
            custom gameId
              ? async (name, config) => {
                  await updateConfig(custom gameId, config, name);
                }
              : undefined
          }
          configFields={sortNumbersConfigFields}
        />
      );
    }

    return (
      <SortNumbers
        key={cfg.inputMethod}
        config={cfg}
        initialState={draftState ?? undefined}
        sessionId={sessionId}
      />
    );
  };
  ```

  **6.1g — Update `GameBody`** to pass `sessionId` and `draftState`:

  ```tsx
  const GameBody = ({
    gameId,
    sessionId,
    draftState,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  }: {
    gameId: string;
    sessionId: string;
    draftState: AnswerGameDraftState | null;
    gameSpecificConfig: Record<string, unknown> | null;
    custom gameId: string | null;
    custom gameName: string | null;
    custom gameColor: string | null;
  }): JSX.Element => {
    if (gameId === 'sort-numbers') {
      return (
        <SortNumbersGameBody
          gameId={gameId}
          sessionId={sessionId}
          draftState={draftState}
          gameSpecificConfig={gameSpecificConfig}
          custom gameId={custom gameId}
          custom gameName={custom gameName}
          custom gameColor={custom gameColor}
        />
      );
    }

    if (gameId === 'word-spell') {
      return (
        <WordSpellGameBody
          gameId={gameId}
          sessionId={sessionId}
          draftState={draftState}
          gameSpecificConfig={gameSpecificConfig}
          custom gameId={custom gameId}
          custom gameName={custom gameName}
          custom gameColor={custom gameColor}
        />
      );
    }

    if (gameId === 'number-match') {
      return (
        <NumberMatchGameBody
          gameId={gameId}
          sessionId={sessionId}
          draftState={draftState}
          gameSpecificConfig={gameSpecificConfig}
          custom gameId={custom gameId}
          custom gameName={custom gameName}
          custom gameColor={custom gameColor}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Game not found</p>
      </div>
    );
  };
  ```

  **6.1h — Update `GameRoute`** to pass `sessionId` and `draftState` to `GameBody`:

  ```tsx
  export const GameRoute = ({
    config,
    initialLog,
    draftState,
    sessionId,
    meta,
    gameSpecificConfig,
    custom gameId,
    custom gameName,
    custom gameColor,
  }: GameRouteLoaderData): JSX.Element => (
    <GameShell
      config={config}
      moves={{}}
      initialState={meta.initialState}
      sessionId={sessionId}
      meta={meta}
      initialLog={initialLog ?? undefined}
    >
      <GameBody
        gameId={config.gameId}
        sessionId={sessionId}
        draftState={draftState}
        gameSpecificConfig={gameSpecificConfig}
        custom gameId={custom gameId}
        custom gameName={custom gameName}
        custom gameColor={custom gameColor}
      />
    </GameShell>
  );
  ```

- [ ] **Step 6.2: Verify TypeScript**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 6.3: Run unit tests**

  ```bash
  yarn test
  ```

  Expected: all tests PASS.

- [ ] **Step 6.4: Commit**

  ```bash
  git add src/routes/'$locale'/_app/game/'$gameId'.tsx
  git commit -m "feat(game-route): wire draftState from loader through GameBody; skip instructions on resume"
  ```

---

## Task 7: Update `vite.config.ts` for SW hardening

**Files:**

- Modify: `vite.config.ts`

- [ ] **Step 7.1: Update `VitePWA` options**

  In `vite.config.ts`, replace the `VitePWA({...})` call:

  ```ts
  VitePWA({
    registerType: 'prompt',
    strategies: 'generateSW',
    injectRegister: null,
    workbox: {
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/\/api\//],
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    manifest: false,
  }),
  ```

- [ ] **Step 7.2: Verify TypeScript**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 7.3: Commit**

  ```bash
  git add vite.config.ts
  git commit -m "feat(pwa): harden vite-plugin-pwa with navigateFallback, cleanupOutdatedCaches, prompt registration"
  ```

---

## Task 8: Service Worker infrastructure

**Files:**

- Create: `src/lib/service-worker/ServiceWorkerContext.ts`
- Create: `src/lib/service-worker/useServiceWorker.ts`
- Create: `src/lib/service-worker/ServiceWorkerProvider.tsx`

- [ ] **Step 8.1: Create `ServiceWorkerContext.ts`**

  ```ts
  // src/lib/service-worker/ServiceWorkerContext.ts
  import { createContext } from 'react';

  export interface ServiceWorkerContextValue {
    updateAvailable: boolean;
    applyUpdate: () => void;
  }

  export const ServiceWorkerContext =
    createContext<ServiceWorkerContextValue>({
      updateAvailable: false,
      applyUpdate: () => {},
    });
  ```

- [ ] **Step 8.2: Create `useServiceWorker.ts`**

  ```ts
  // src/lib/service-worker/useServiceWorker.ts
  import { useEffect, useRef, useState } from 'react';
  import { Workbox } from 'workbox-window';
  import type { ServiceWorkerContextValue } from './ServiceWorkerContext';

  /**
   * Registers the service worker via workbox-window and surfaces update state.
   * SW only activates in production builds — this hook is a no-op in dev.
   */
  export const useServiceWorker = (): ServiceWorkerContextValue => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const wbRef = useRef<Workbox | null>(null);

    useEffect(() => {
      if (!('serviceWorker' in navigator)) return;

      const wb = new Workbox('/base-skill/sw.js');
      wbRef.current = wb;

      wb.addEventListener('waiting', () => {
        setUpdateAvailable(true);
      });

      void wb.register();
    }, []);

    const applyUpdate = () => {
      const wb = wbRef.current;
      if (!wb) return;
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      void wb.messageSkipWaiting();
    };

    return { updateAvailable, applyUpdate };
  };
  ```

- [ ] **Step 8.3: Create `ServiceWorkerProvider.tsx`**

  ```tsx
  // src/lib/service-worker/ServiceWorkerProvider.tsx
  import type { ReactNode } from 'react';
  import { ServiceWorkerContext } from './ServiceWorkerContext';
  import { useServiceWorker } from './useServiceWorker';

  export const ServiceWorkerProvider = ({
    children,
  }: {
    children: ReactNode;
  }) => {
    const value = useServiceWorker();
    return (
      <ServiceWorkerContext.Provider value={value}>
        {children}
      </ServiceWorkerContext.Provider>
    );
  };
  ```

- [ ] **Step 8.4: Verify TypeScript**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 8.5: Commit**

  ```bash
  git add src/lib/service-worker/
  git commit -m "feat(service-worker): add ServiceWorkerContext, useServiceWorker hook, and ServiceWorkerProvider"
  ```

---

## Task 9: `UpdateBanner` component + wire into root and app layout

**Files:**

- Create: `src/components/UpdateBanner.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/$locale/_app.tsx`

- [ ] **Step 9.1: Create `UpdateBanner.tsx`**

  ```tsx
  // src/components/UpdateBanner.tsx
  import { useContext, useState } from 'react';
  import { useLocation } from '@tanstack/react-router';
  import { ServiceWorkerContext } from '@/lib/service-worker/ServiceWorkerContext';

  export const UpdateBanner = () => {
    const { updateAvailable, applyUpdate } = useContext(
      ServiceWorkerContext,
    );
    const location = useLocation();
    const [dismissed, setDismissed] = useState(false);

    const isGameRoute = location.pathname.includes('/game/');

    if (!updateAvailable || isGameRoute || dismissed) return null;

    return (
      <div
        role="alert"
        className="flex items-center justify-between bg-[var(--sea-ink)] px-4 py-2 text-sm text-white"
      >
        <span>New version available — tap to update</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={applyUpdate}
          >
            Update
          </button>
          <button
            type="button"
            aria-label="Dismiss update notification"
            className="opacity-70 hover:opacity-100"
            onClick={() => setDismissed(true)}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };
  ```

- [ ] **Step 9.2: Wrap `RootDocument` in `ServiceWorkerProvider`**

  In `src/routes/__root.tsx`, add the import and wrap the body content:

  ```tsx
  import { ServiceWorkerProvider } from '@/lib/service-worker/ServiceWorkerProvider';

  const RootDocument = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
  ```

- [ ] **Step 9.3: Add `<UpdateBanner />` to app layout**

  In `src/routes/$locale/_app.tsx`, import and render `UpdateBanner` between
  `<OfflineIndicator />` and `<main>`:

  ```tsx
  import { UpdateBanner } from '@/components/UpdateBanner';

  const AppLayout = () => (
    <DbProvider onDatabaseReady={seedThemesOnce}>
      <I18nextProvider i18n={i18n}>
        <ThemeRuntimeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <OfflineIndicator />
            <UpdateBanner />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </ThemeRuntimeProvider>
      </I18nextProvider>
    </DbProvider>
  );
  ```

- [ ] **Step 9.4: Verify TypeScript and run tests**

  ```bash
  yarn typecheck && yarn test
  ```

  Expected: no errors, all tests PASS.

- [ ] **Step 9.5: Commit**

  ```bash
  git add src/components/UpdateBanner.tsx \
          src/routes/__root.tsx \
          src/routes/'$locale'/_app.tsx
  git commit -m "feat(pwa): add UpdateBanner and mount ServiceWorkerProvider in root"
  ```

---

## Task 10: Version constants + Header Beta badge

**Files:**

- Create: `src/lib/version.ts`
- Modify: `src/components/Header.tsx`

- [ ] **Step 10.1: Create `src/lib/version.ts`**

  ```ts
  // src/lib/version.ts

  /** App version injected from package.json at build time. */
  export const APP_VERSION: string =
    (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';

  /** Set to false when exiting beta. */
  export const IS_BETA = true;
  ```

- [ ] **Step 10.2: Add Beta badge and version to `Header.tsx`**

  In `src/components/Header.tsx`, add the import at the top:

  ```tsx
  import { APP_VERSION, IS_BETA } from '@/lib/version';
  ```

  Find the `<Link>` for the app name (around line 261):

  ```tsx
  <Link
    to="/$locale"
    params={{ locale }}
    className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
  >
    {t('appName')}
  </Link>
  ```

  Replace it with:

  ```tsx
  <Link
    to="/$locale"
    params={{ locale }}
    className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
  >
    {t('appName')}
  </Link>;
  {
    IS_BETA && (
      <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        Beta
      </span>
    );
  }
  <span className="flex-shrink-0 text-xs text-muted-foreground">
    v{APP_VERSION}
  </span>;
  ```

- [ ] **Step 10.3: Verify TypeScript and run tests**

  ```bash
  yarn typecheck && yarn test
  ```

  Expected: no errors, all tests PASS.

- [ ] **Step 10.4: Commit**

  ```bash
  git add src/lib/version.ts src/components/Header.tsx
  git commit -m "feat(version): add APP_VERSION and IS_BETA constants; display Beta badge and version in Header"
  ```

---

## Task 11: Parent About section

**Files:**

- Modify: `src/routes/$locale/_app/parent/index.tsx`

- [ ] **Step 11.1: Update `parent/index.tsx` with About section**

  Replace `src/routes/$locale/_app/parent/index.tsx`:

  ```tsx
  import { createFileRoute } from '@tanstack/react-router';
  import { useRxQuery } from '@/db/hooks/useRxQuery';
  import { useRxDB } from '@/db/hooks/useRxDB';
  import { useMemo } from 'react';
  import { EMPTY } from 'rxjs';
  import { APP_VERSION, IS_BETA } from '@/lib/version';
  import type { AppMetaDoc } from '@/db/schemas/app-meta';

  const AboutSection = () => {
    const { db } = useRxDB();

    const meta$ = useMemo(
      () => (db ? db.app_meta.findOne('singleton').$ : EMPTY),
      [db],
    );
    const meta = useRxQuery<{ toJSON: () => AppMetaDoc } | null>(
      meta$,
      null,
    );
    const metaDoc = meta?.toJSON();

    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold">About</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Version</dt>
          <dd>v{APP_VERSION}</dd>

          <dt className="text-muted-foreground">Channel</dt>
          <dd>{IS_BETA ? 'Beta' : 'Stable'}</dd>

          {metaDoc?.installId && (
            <>
              <dt className="text-muted-foreground">Install ID</dt>
              <dd className="font-mono text-xs">{metaDoc.installId}</dd>
            </>
          )}

          {metaDoc?.rxdbSchemaVersion !== undefined && (
            <>
              <dt className="text-muted-foreground">Schema version</dt>
              <dd>{metaDoc.rxdbSchemaVersion}</dd>
            </>
          )}
        </dl>
      </section>
    );
  };

  const ParentHome = () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Parent Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage learner profiles and app configuration.
      </p>
      <AboutSection />
    </div>
  );

  export const Route = createFileRoute('/$locale/_app/parent/')({
    component: ParentHome,
  });
  ```

- [ ] **Step 11.2: Verify TypeScript**

  ```bash
  yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 11.3: Run all unit tests**

  ```bash
  yarn test
  ```

  Expected: all tests PASS.

- [ ] **Step 11.4: Commit**

  ```bash
  git add src/routes/'$locale'/_app/parent/index.tsx
  git commit -m "feat(parent): add About section with version, channel, install ID, and schema version"
  ```

---

## Task 12: Fix markdown and final verification

- [ ] **Step 12.1: Fix markdown**

  ```bash
  yarn fix:md
  ```

- [ ] **Step 12.2: Run full lint + typecheck + unit tests**

  ```bash
  yarn lint && yarn typecheck && yarn test
  ```

  Expected: all PASS with no errors.

- [ ] **Step 12.3: Commit plan doc**

  ```bash
  git add docs/superpowers/plans/2026-04-07-service-worker-workbox-offline-plan.md
  git commit -m "docs(plans): add service worker offline implementation plan"
  ```

- [ ] **Step 12.4: Push and open PR**

  ```bash
  SKIP_STORYBOOK=1 SKIP_VR=1 SKIP_E2E=1 git push -u origin feat/service-worker-workbox-offline-setup
  ```

  Then open a PR from `feat/service-worker-workbox-offline-setup` → `master`.

  > **Note:** Storybook, VR, and E2E tests are skipped on push because they require a
  > running dev server and Docker. Run them manually before merging:
  >
  > ```bash
  > # In worktree directory
  > START_STORYBOOK=1 yarn test:storybook
  > yarn test:vr          # requires Docker
  > yarn test:e2e         # requires yarn dev running
  > ```

---

## Spec Coverage Check

| Spec requirement                                                                       | Task(s) |
| -------------------------------------------------------------------------------------- | ------- |
| `AnswerGameDraftState` type                                                            | Task 1  |
| `session_history_index` schema v1→v2                                                   | Task 1  |
| RxDB migration v2: `draftState: null`                                                  | Task 1  |
| `useAnswerGameDraftSync` hook (debounced, flush, null on game-over)                    | Task 2  |
| `findInProgressSession` returns `{ log, draftState }`                                  | Task 3  |
| `AnswerGameProvider` `initialState` prop; guard `INIT_ROUND`                           | Task 4  |
| `AnswerGame` + game components forward `initialState`                                  | Task 5  |
| Game route loader returns `draftState`; game bodies skip instructions on resume        | Task 6  |
| `vite.config.ts`: `navigateFallback`, `registerType: 'prompt'`, `injectRegister: null` | Task 7  |
| `ServiceWorkerContext`, `useServiceWorker`, `ServiceWorkerProvider`                    | Task 8  |
| `UpdateBanner` suppressed on `/game/` routes                                           | Task 9  |
| `ServiceWorkerProvider` mounted in `__root.tsx`                                        | Task 9  |
| `UpdateBanner` in `_app.tsx` above `<Outlet>`                                          | Task 9  |
| `src/lib/version.ts` with `APP_VERSION` + `IS_BETA`                                    | Task 10 |
| Header Beta badge + version                                                            | Task 10 |
| Parent Settings > About section                                                        | Task 11 |
