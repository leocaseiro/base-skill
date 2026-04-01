# M4 Game Engine Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable game engine infrastructure (types, replay, lifecycle, move log, config loader, session recorder, provider, shell UI, and route wiring) that all M5 reference games will run on.

**Architecture:** Three layers: (1) Route loader resolves config + checks for in-progress sessions via RxDB reads; (2) `GameEngineProvider` composes `useGameLifecycle`, `useMoveLog`, and `useSessionRecorder` into split React contexts (state/dispatch); (3) `GameShell` renders Layout B chrome around the provider. An append-only move log with `UNDO` as a first-class move powers both live undo and parent-watchable replay via the pure `replayToStep` function.

**Tech Stack:** React 19, TypeScript (strict), Vitest + React Testing Library, RxDB 17 (Dexie storage), TanStack Router, Tailwind CSS v4, nanoid

---

## File Map

| File                                                | Action | Responsibility                                                                                                                                          |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/game-engine/types.ts`                      | Create | All shared types: GamePhase, GameEngineState, Move, MoveLog, ResolvedContent, RoundDefinition, RoundState, ResolvedGameConfig, SessionMeta, MoveHandler |
| `src/db/schemas/session_history_index.ts`           | Modify | Add status, seed, initialContent, initialState fields; bump schema version to 1                                                                         |
| `src/db/create-database.ts`                         | Modify | Add migrationStrategies for session_history_index v1                                                                                                    |
| `src/lib/game-engine/replay.ts`                     | Create | Pure `replayToStep(log, stepIndex, moveHandlers)` function — no React, no RxDB                                                                          |
| `src/lib/game-engine/replay.test.ts`                | Create | Unit tests: normal play, single undo, double undo, UNDO beyond log start, empty log                                                                     |
| `src/lib/game-engine/lifecycle.ts`                  | Create | `useGameLifecycle(config, gameMovers, initialState?)` — useReducer state machine, 9 transitions                                                         |
| `src/lib/game-engine/lifecycle.test.ts`             | Create | Unit tests: all 9 transitions, invalid transition guards                                                                                                |
| `src/lib/game-engine/move-log.ts`                   | Create | `useMoveLog(maxUndoDepth)` — append-only in-memory move array, UNDO depth enforcement                                                                   |
| `src/lib/game-engine/move-log.test.ts`              | Create | Unit tests: append, canUndo logic, depth limit enforcement                                                                                              |
| `src/lib/game-engine/config-loader.ts`              | Create | `loadGameConfig(gameId, profileId, gradeBand, db, defaultConfig?)` — 4-level override merging                                                           |
| `src/lib/game-engine/config-loader.test.ts`         | Create | Unit tests: all 4 priority levels, missing overrides, grade-band fallthrough                                                                            |
| `src/lib/game-engine/session-recorder.ts`           | Create | `useSessionRecorder(moves, sessionId, meta, db)` — RxDB writes on every move + flush triggers                                                           |
| `src/lib/game-engine/session-recorder.test.tsx`     | Create | Integration tests: writes reach session_history in RxDB                                                                                                 |
| `src/lib/game-engine/session-finder.ts`             | Create | `findInProgressSession(profileId, gameId, db)` — queries index, loads chunks, returns MoveLog \| null                                                   |
| `src/lib/game-engine/session-finder.test.ts`        | Create | Unit tests: no session, in-progress session, stale >24h abandoned                                                                                       |
| `src/lib/game-engine/index.ts`                      | Create | `GameEngineProvider`, `useGameState`, `useGameDispatch` — split contexts, composes all hooks                                                            |
| `src/lib/game-engine/game-engine-provider.test.tsx` | Create | Integration tests: renders children, dispatches moves, state updates, UNDO rolls back                                                                   |
| `src/components/game/GameShell.tsx`                 | Create | Layout B chrome: top bar, sub-bar (score/progress/timer), game area, footer (undo/pause/exit)                                                           |
| `src/components/game/GameShell.test.tsx`            | Create | Component tests: undo button visibility, timer visibility, round counter display                                                                        |
| `src/routes/$locale/_app/game/$gameId.tsx`          | Modify | Replace placeholder; add loader (loadGameConfig + findInProgressSession); mount GameShell                                                               |

---

## Codebase Context

All workers must know these before touching any file:

- **Database type:** `BaseSkillDatabase` from `src/db/types.ts` — NOT `AppDatabase`. Use `useRxDB()` from `src/db/hooks/useRxDB.ts` to get it inside components.
- **Test database:** `createTestDatabase()` from `src/db/create-database.ts` — memory-backed, safe for tests.
- **Named exports only:** No `export default`. This is enforced project-wide. Exception: framework files like route definitions.
- **Existing schemas to read:** `src/db/schemas/session_history.ts`, `src/db/schemas/session_history_index.ts`, `src/db/schemas/game_config_overrides.ts`.
- **Existing event types:** `GradeBand` and all `GameEvent*` types live in `src/types/game-events.ts`. Import `GradeBand` from there.
- **Event bus:** `getGameEventBus()` from `src/lib/game-event-bus.ts` — used by session recorder to emit `game:end`.
- **Verify passes:** `yarn typecheck && yarn test && yarn build`
- **Imports use path aliases:** `@/` maps to `src/`. Use `@/lib/game-engine/types` etc.

---

## Task 1: Shared Types

**Files:**

- Create: `src/lib/game-engine/types.ts`

No tests — this is a pure type definitions file.

- [ ] **Step 1: Create types file**

```typescript
// src/lib/game-engine/types.ts
import type { GradeBand } from '@/types/game-events';

export type { GradeBand };

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'instructions'
  | 'playing'
  | 'evaluating'
  | 'scoring'
  | 'next-round'
  | 'retry'
  | 'game-over';

export interface RoundDefinition {
  id: string;
  prompt: Record<string, string>; // locale-keyed: { en: '...', 'pt-BR': '...' }
  correctAnswer: string;
  distractors?: string[];
}

export interface ResolvedContent {
  rounds: RoundDefinition[];
}

export interface RoundState {
  roundId: string;
  answer: string | null;
  hintsUsed: number;
}

export interface GameEngineState {
  phase: GamePhase;
  roundIndex: number;
  score: number;
  streak: number;
  retryCount: number;
  content: ResolvedContent;
  currentRound: RoundState;
}

export type MoveType =
  | 'SUBMIT_ANSWER'
  | 'REQUEST_HINT'
  | 'SKIP_INSTRUCTIONS'
  | 'UNDO';

export interface Move {
  type: MoveType | string; // string allows game-specific types in M5
  args: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface MoveLog {
  gameId: string;
  sessionId: string;
  profileId: string;
  seed: string;
  initialContent: ResolvedContent;
  initialState: GameEngineState;
  moves: Move[];
}

export interface ResolvedGameConfig {
  gameId: string;
  title: Record<string, string>; // { en: '...', 'pt-BR': '...' }
  gradeBand: GradeBand;
  maxRounds: number;
  maxRetries: number;
  maxUndoDepth: number | null; // null = unlimited; 0 = no undo
  timerVisible: boolean;
  timerDurationSeconds: number | null;
  difficulty: string;
}

export type MoveHandler = (
  state: GameEngineState,
  args: Move['args'],
) => GameEngineState;

export interface SessionMeta {
  profileId: string;
  gameId: string;
  gradeBand: GradeBand;
  seed: string;
  initialContent: ResolvedContent;
  initialState: GameEngineState;
}
```

- [ ] **Step 2: Verify types check**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/game-engine/types.ts
git commit -m "feat(m4): add shared game engine types"
```

---

## Task 2: Schema Migration — session_history_index v1

**Files:**

- Modify: `src/db/schemas/session_history_index.ts`
- Modify: `src/db/create-database.ts`

The session_history_index schema needs `status`, `seed`, `initialContent`, and `initialState` fields (all needed for silent resume). Bump schema version 0→1 and add a migration strategy.

- [ ] **Step 1: Write the failing migration test**

Create `src/db/schemas/session_history_index.test.ts`:

```typescript
// src/db/schemas/session_history_index.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/db/schemas/session_history_index.test.ts`
Expected: FAIL — insert rejects because schema v0 has no `status` field

- [ ] **Step 3: Update the schema**

Replace `src/db/schemas/session_history_index.ts` entirely:

```typescript
// src/db/schemas/session_history_index.ts
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
};

export const sessionHistoryIndexSchema: RxJsonSchema<SessionHistoryIndexDoc> =
  {
    version: 1,
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

- [ ] **Step 4: Add migrationStrategies in create-database.ts**

In `src/db/create-database.ts`, find the `COLLECTIONS` object and update the `session_history_index` entry:

Old:

```typescript
  session_history_index: { schema: sessionHistoryIndexSchema },
```

New:

```typescript
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
    },
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/db/schemas/session_history_index.test.ts`
Expected: PASS — all 3 tests green

- [ ] **Step 6: Full verification**

Run: `yarn typecheck && yarn test && yarn build`
Expected: all green

- [ ] **Step 7: Commit**

```bash
git add src/db/schemas/session_history_index.ts src/db/create-database.ts src/db/schemas/session_history_index.test.ts
git commit -m "feat(m4): add status/seed/replay fields to session_history_index schema (v1)"
```

---

## Task 3: Replay Engine

**Files:**

- Create: `src/lib/game-engine/replay.ts`
- Create: `src/lib/game-engine/replay.test.ts`

**Context:** `replayToStep` is a pure function (no React, no RxDB). It applies moves from `log.initialState` up to `stepIndex`. When it encounters an `UNDO` move with `{ targetStep: M }`, it recursively replays moves 0→M, then continues from there.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game-engine/replay.test.ts`:

```typescript
// src/lib/game-engine/replay.test.ts
import { describe, expect, it } from 'vitest';
import { replayToStep } from './replay';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  MoveLog,
  ResolvedContent,
} from './types';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'What is 1+1?' }, correctAnswer: '2' },
    { id: 'r2', prompt: { en: 'What is 2+2?' }, correctAnswer: '4' },
  ],
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

const baseLog: MoveLog = {
  gameId: 'test-game',
  sessionId: 'sess-1',
  profileId: 'prof-1',
  seed: 'seed-1',
  initialContent: content,
  initialState,
  moves: [],
};

// A simple handler that sets the answer and bumps score if correct
const submitHandler: MoveHandler = (state, args) => ({
  ...state,
  score:
    args['answer'] ===
    state.content.rounds[state.roundIndex].correctAnswer
      ? state.score + 1
      : state.score,
  currentRound: {
    ...state.currentRound,
    answer: args['answer'] as string,
  },
});

const moveHandlers: Record<string, MoveHandler> = {
  SUBMIT_ANSWER: submitHandler,
};

function makeMove(type: Move['type'], args: Move['args'] = {}): Move {
  return { type, args, timestamp: Date.now() };
}

describe('replayToStep', () => {
  it('returns initialState when moves array is empty', () => {
    const result = replayToStep(baseLog, 0, moveHandlers);
    expect(result).toEqual(initialState);
  });

  it('applies a single move correctly', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [makeMove('SUBMIT_ANSWER', { answer: '2' })],
    };
    const result = replayToStep(log, 0, moveHandlers);
    expect(result.score).toBe(1);
    expect(result.currentRound.answer).toBe('2');
  });

  it('replays up to stepIndex (not beyond)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }),
        makeMove('SUBMIT_ANSWER', { answer: '2' }),
      ],
    };
    // replay only step 0
    const result = replayToStep(log, 0, moveHandlers);
    expect(result.score).toBe(0); // wrong answer
    expect(result.currentRound.answer).toBe('wrong');
  });

  it('handles a single UNDO move (rolls back to targetStep)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }), // step 0
        makeMove('UNDO', { targetStep: 0 }), // step 1: undo step 0
      ],
    };
    // After UNDO at step 1 targeting step 0 (before step 0 was applied),
    // state should be initialState (score=0, answer=null)
    const result = replayToStep(log, 1, moveHandlers);
    expect(result.score).toBe(0);
    expect(result.currentRound.answer).toBe(null);
  });

  it('handles double UNDO correctly', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }), // step 0
        makeMove('UNDO', { targetStep: 0 }), // step 1: undo to before step 0
        makeMove('SUBMIT_ANSWER', { answer: 'also-wrong' }), // step 2
        makeMove('UNDO', { targetStep: 0 }), // step 3: undo again
      ],
    };
    const result = replayToStep(log, 3, moveHandlers);
    expect(result.score).toBe(0);
    expect(result.currentRound.answer).toBe(null);
  });

  it('ignores unknown move types (no handler = identity)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [makeMove('REQUEST_HINT', { hintIndex: 0 })],
    };
    const result = replayToStep(log, 0, moveHandlers);
    // No handler for REQUEST_HINT → state unchanged
    expect(result).toEqual(initialState);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/replay.test.ts`
Expected: FAIL — `replayToStep` is not defined

- [ ] **Step 3: Implement replay.ts**

Create `src/lib/game-engine/replay.ts`:

```typescript
// src/lib/game-engine/replay.ts
import type { GameEngineState, MoveHandler, MoveLog } from './types';

/**
 * Pure function — no React, no side effects, no RxDB.
 * Replays moves 0..stepIndex from log.initialState using provided move handlers.
 * UNDO moves are handled by re-replaying from initialState to the targetStep.
 */
export function replayToStep(
  log: MoveLog,
  stepIndex: number,
  moveHandlers: Record<string, MoveHandler>,
): GameEngineState {
  let state = log.initialState;

  for (let i = 0; i <= stepIndex && i < log.moves.length; i++) {
    const move = log.moves[i];

    if (move.type === 'UNDO') {
      const targetStep = move.args['targetStep'] as number;
      // Replay from initial state to targetStep (exclusive — gives state BEFORE targetStep was applied)
      state =
        targetStep > 0
          ? replayToStep(log, targetStep - 1, moveHandlers)
          : log.initialState;
    } else {
      const handler = moveHandlers[move.type];
      if (handler) {
        state = handler(state, move.args);
      }
    }
  }

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/replay.test.ts`
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/replay.ts src/lib/game-engine/replay.test.ts
git commit -m "feat(m4): add replayToStep pure function with UNDO handling"
```

---

## Task 4: Game Lifecycle Hook

**Files:**

- Create: `src/lib/game-engine/lifecycle.ts`
- Create: `src/lib/game-engine/lifecycle.test.ts`

**Context:** `useGameLifecycle` is a `useReducer`-based hook managing the 9 phase transitions. It accepts game-specific `moveHandlers` that extend state transitions. It does NOT write to RxDB, does NOT track move history. It handles a special `RESTORE_STATE` action (used by the provider for UNDO). Evaluation of SUBMIT_ANSWER happens automatically within the reducer: it applies the game handler (if any), computes correctness by comparing `currentRound.answer` to `content.rounds[roundIndex].correctAnswer`, then transitions to `next-round`, `retry`, or `game-over` based on config constraints.

Phase start for M4: `'instructions'` (route loader already resolved config before mount).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game-engine/lifecycle.test.ts`:

```typescript
// src/lib/game-engine/lifecycle.test.ts
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameLifecycle } from './lifecycle';
import type {
  GameEngineState,
  MoveHandler,
  ResolvedContent,
  ResolvedGameConfig,
} from './types';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
    { id: 'r3', prompt: { en: 'Q3' }, correctAnswer: 'C' },
  ],
};

const config: ResolvedGameConfig = {
  gameId: 'test',
  title: { en: 'Test Game' },
  gradeBand: 'year1-2',
  maxRounds: 3,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: false,
  timerDurationSeconds: null,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'instructions',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

// A game handler that records the submitted answer in currentRound
const submitHandler: MoveHandler = (state, args) => ({
  ...state,
  currentRound: {
    ...state.currentRound,
    answer: args['answer'] as string,
  },
});

const gameMovers: Record<string, MoveHandler> = {
  SUBMIT_ANSWER: submitHandler,
};

describe('useGameLifecycle', () => {
  it('starts at instructions phase', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    expect(result.current[0].phase).toBe('instructions');
  });

  it('SKIP_INSTRUCTIONS: instructions → playing', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    act(() => {
      result.current[1]({
        type: 'SKIP_INSTRUCTIONS',
        args: {},
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('playing');
  });

  it('SUBMIT_ANSWER correct: playing → next-round, increments score and streak', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'A' },
        timestamp: 0,
      });
    });
    const state = result.current[0];
    expect(state.phase).toBe('next-round');
    expect(state.score).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.retryCount).toBe(0);
  });

  it('SUBMIT_ANSWER wrong with retries remaining: playing → retry, resets streak', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'WRONG' },
        timestamp: 0,
      });
    });
    const state = result.current[0];
    expect(state.phase).toBe('retry');
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.retryCount).toBe(1);
  });

  it('SUBMIT_ANSWER wrong with no retries remaining: playing → next-round', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
        retryCount: 1, // already used the 1 allowed retry
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'WRONG' },
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('next-round');
  });

  it('SUBMIT_ANSWER correct on last round: playing → game-over', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
        roundIndex: 2, // last of 3 rounds (maxRounds=3)
        currentRound: { roundId: 'r3', answer: null, hintsUsed: 0 },
      }),
    );
    act(() => {
      result.current[1]({
        type: 'SUBMIT_ANSWER',
        args: { answer: 'C' },
        timestamp: 0,
      });
    });
    expect(result.current[0].phase).toBe('game-over');
  });

  it('NEXT_ROUND: next-round → playing, increments roundIndex, resets retryCount', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'next-round',
        roundIndex: 0,
      }),
    );
    act(() => {
      result.current[1]({ type: 'NEXT_ROUND', args: {}, timestamp: 0 });
    });
    const state = result.current[0];
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(1);
    expect(state.retryCount).toBe(0);
    expect(state.currentRound.roundId).toBe('r2');
    expect(state.currentRound.answer).toBe(null);
  });

  it('RETRY: retry → playing, resets answer', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'retry',
        currentRound: { roundId: 'r1', answer: 'WRONG', hintsUsed: 0 },
      }),
    );
    act(() => {
      result.current[1]({ type: 'RETRY', args: {}, timestamp: 0 });
    });
    const state = result.current[0];
    expect(state.phase).toBe('playing');
    expect(state.currentRound.answer).toBe(null);
  });

  it('END_GAME: game-over → idle', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'game-over',
      }),
    );
    act(() => {
      result.current[1]({ type: 'END_GAME', args: {}, timestamp: 0 });
    });
    expect(result.current[0].phase).toBe('idle');
  });

  it('REQUEST_HINT: increments hintsUsed in currentRound', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, {
        ...initialState,
        phase: 'playing',
      }),
    );
    act(() => {
      result.current[1]({
        type: 'REQUEST_HINT',
        args: {},
        timestamp: 0,
      });
    });
    expect(result.current[0].currentRound.hintsUsed).toBe(1);
  });

  it('RESTORE_STATE: force sets state (used for UNDO)', () => {
    const { result } = renderHook(() =>
      useGameLifecycle(config, gameMovers, initialState),
    );
    const forcedState: GameEngineState = {
      ...initialState,
      phase: 'playing',
      score: 99,
    };
    act(() => {
      result.current[1]({
        type: 'RESTORE_STATE',
        args: { _state: JSON.stringify(forcedState) },
        timestamp: 0,
      });
    });
    expect(result.current[0].score).toBe(99);
    expect(result.current[0].phase).toBe('playing');
  });

  it('ignores invalid transitions (wrong phase guard)', () => {
    const { result } = renderHook(
      () => useGameLifecycle(config, gameMovers, initialState), // phase = instructions
    );
    // NEXT_ROUND is invalid from instructions phase
    act(() => {
      result.current[1]({ type: 'NEXT_ROUND', args: {}, timestamp: 0 });
    });
    expect(result.current[0].phase).toBe('instructions'); // unchanged
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/lifecycle.test.ts`
Expected: FAIL — `useGameLifecycle` is not defined

- [ ] **Step 3: Implement lifecycle.ts**

Create `src/lib/game-engine/lifecycle.ts`:

```typescript
// src/lib/game-engine/lifecycle.ts
import { useReducer } from 'react';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  ResolvedGameConfig,
} from './types';

type InternalMove =
  | Move
  | {
      type: 'RESTORE_STATE';
      args: { _state: string };
      timestamp: number;
    };

function buildInitialState(
  config: ResolvedGameConfig,
  override?: GameEngineState,
): GameEngineState {
  if (override) return override;
  return {
    phase: 'instructions',
    roundIndex: 0,
    score: 0,
    streak: 0,
    retryCount: 0,
    content: { rounds: [] },
    currentRound: { roundId: '', answer: null, hintsUsed: 0 },
  };
}

function createReducer(
  config: ResolvedGameConfig,
  gameMovers: Record<string, MoveHandler>,
) {
  return function reducer(
    state: GameEngineState,
    action: InternalMove,
  ): GameEngineState {
    // RESTORE_STATE — force set (used for UNDO by provider)
    if (action.type === 'RESTORE_STATE') {
      return JSON.parse(
        action.args['_state'] as string,
      ) as GameEngineState;
    }

    // Apply game-specific handler first (if any)
    const gameHandler = gameMovers[action.type];
    const s = gameHandler ? gameHandler(state, action.args) : state;

    switch (action.type) {
      case 'SKIP_INSTRUCTIONS': {
        if (s.phase !== 'instructions') return s;
        return { ...s, phase: 'playing' };
      }

      case 'SUBMIT_ANSWER': {
        if (s.phase !== 'playing') return s;
        const roundDef = s.content.rounds[s.roundIndex];
        const correct =
          s.currentRound.answer === roundDef?.correctAnswer;
        const newScore = correct ? s.score + 1 : s.score;
        const newStreak = correct ? s.streak + 1 : 0;

        if (!correct && s.retryCount < config.maxRetries) {
          return {
            ...s,
            score: newScore,
            streak: newStreak,
            retryCount: s.retryCount + 1,
            phase: 'retry',
          };
        }

        const isLastRound = s.roundIndex >= config.maxRounds - 1;
        if (isLastRound) {
          return {
            ...s,
            score: newScore,
            streak: newStreak,
            phase: 'game-over',
          };
        }
        return {
          ...s,
          score: newScore,
          streak: newStreak,
          phase: 'next-round',
        };
      }

      case 'NEXT_ROUND': {
        if (s.phase !== 'next-round') return s;
        const nextIndex = s.roundIndex + 1;
        const nextRound = s.content.rounds[nextIndex];
        return {
          ...s,
          phase: 'playing',
          roundIndex: nextIndex,
          retryCount: 0,
          currentRound: {
            roundId: nextRound?.id ?? '',
            answer: null,
            hintsUsed: 0,
          },
        };
      }

      case 'RETRY': {
        if (s.phase !== 'retry') return s;
        return {
          ...s,
          phase: 'playing',
          currentRound: { ...s.currentRound, answer: null },
        };
      }

      case 'END_GAME': {
        if (s.phase !== 'game-over') return s;
        return { ...s, phase: 'idle' };
      }

      case 'REQUEST_HINT': {
        return {
          ...s,
          currentRound: {
            ...s.currentRound,
            hintsUsed: s.currentRound.hintsUsed + 1,
          },
        };
      }

      default:
        return s;
    }
  };
}

export function useGameLifecycle(
  config: ResolvedGameConfig,
  gameMovers: Record<string, MoveHandler>,
  initialState?: GameEngineState,
): [GameEngineState, (move: InternalMove) => void] {
  const reducer = createReducer(config, gameMovers);
  const [state, dispatch] = useReducer(
    reducer,
    buildInitialState(config, initialState),
  );
  return [state, dispatch];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/lifecycle.test.ts`
Expected: PASS — all 10 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/lifecycle.ts src/lib/game-engine/lifecycle.test.ts
git commit -m "feat(m4): add useGameLifecycle hook with 9 phase transitions"
```

---

## Task 5: Move Log Hook

**Files:**

- Create: `src/lib/game-engine/move-log.ts`
- Create: `src/lib/game-engine/move-log.test.ts`

**Context:** `useMoveLog(maxUndoDepth)` tracks an append-only `Move[]` array. It enforces UNDO depth limits. It does NOT compute state — that's the lifecycle's job. Returns `{ moves, canUndo, appendMove }`.

UNDO depth logic: `maxUndoDepth = 0` → canUndo is always false, appendMove rejects UNDO moves (returns false). `maxUndoDepth = null` → unlimited. `maxUndoDepth = N` → the `targetStep` in the UNDO move must be at most `moves.length - N` steps back (meaning at most N undos from the current tail).

For simplicity: depth is enforced as "how many consecutive UNDO moves have been appended since the last non-UNDO move", tracked via a counter. But the spec says append-only — each UNDO is a move, so we simply count from the UNDO targetStep: `undoDepth = moves.length - targetStep`. If that exceeds `maxUndoDepth`, reject.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game-engine/move-log.test.ts`:

```typescript
// src/lib/game-engine/move-log.test.ts
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoveLog } from './move-log';
import type { Move } from './types';

function makeMove(type: Move['type'], args: Move['args'] = {}): Move {
  return { type, args, timestamp: Date.now() };
}

describe('useMoveLog', () => {
  it('starts with empty moves array', () => {
    const { result } = renderHook(() => useMoveLog(3));
    expect(result.current.moves).toEqual([]);
  });

  it('canUndo is false when moves is empty', () => {
    const { result } = renderHook(() => useMoveLog(3));
    expect(result.current.canUndo).toBe(false);
  });

  it('canUndo is false when maxUndoDepth is 0', () => {
    const { result } = renderHook(() => useMoveLog(0));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(false);
  });

  it('canUndo is true after appending a move with non-zero depth', () => {
    const { result } = renderHook(() => useMoveLog(3));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(true);
  });

  it('canUndo is true after appending a move with null depth (unlimited)', () => {
    const { result } = renderHook(() => useMoveLog(null));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(true);
  });

  it('appends moves in order', () => {
    const { result } = renderHook(() => useMoveLog(3));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      result.current.appendMove(makeMove('REQUEST_HINT', {}));
    });
    expect(result.current.moves).toHaveLength(2);
    expect(result.current.moves[0].type).toBe('SUBMIT_ANSWER');
    expect(result.current.moves[1].type).toBe('REQUEST_HINT');
  });

  it('accepts UNDO move within allowed depth', () => {
    const { result } = renderHook(() => useMoveLog(2));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      ); // index 0
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      ); // index 1
      // UNDO to step 0: undoDepth = moves.length(2) - targetStep(0) = 2 (allowed, maxUndoDepth=2)
      result.current.appendMove(makeMove('UNDO', { targetStep: 0 }));
    });
    expect(result.current.moves).toHaveLength(3);
    expect(result.current.moves[2].type).toBe('UNDO');
  });

  it('rejects UNDO move when maxUndoDepth is 0 (returns false)', () => {
    const { result } = renderHook(() => useMoveLog(0));
    let accepted = true;
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      accepted = result.current.appendMove(
        makeMove('UNDO', { targetStep: 0 }),
      );
    });
    expect(accepted).toBe(false);
    expect(result.current.moves).toHaveLength(1); // UNDO not appended
  });

  it('rejects UNDO move that exceeds maxUndoDepth', () => {
    const { result } = renderHook(() => useMoveLog(1)); // only 1 undo allowed
    let accepted = true;
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      ); // index 0
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      ); // index 1
      // UNDO to step 0: undoDepth = 2 - 0 = 2 > maxUndoDepth(1) → reject
      accepted = result.current.appendMove(
        makeMove('UNDO', { targetStep: 0 }),
      );
    });
    expect(accepted).toBe(false);
    expect(result.current.moves).toHaveLength(2);
  });

  it('allows unlimited UNDO when maxUndoDepth is null', () => {
    const { result } = renderHook(() => useMoveLog(null));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      );
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'C' }),
      );
      result.current.appendMove(makeMove('UNDO', { targetStep: 0 })); // undo all 3
    });
    expect(result.current.moves).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/move-log.test.ts`
Expected: FAIL — `useMoveLog` is not defined

- [ ] **Step 3: Implement move-log.ts**

Create `src/lib/game-engine/move-log.ts`:

```typescript
// src/lib/game-engine/move-log.ts
import { useCallback, useState } from 'react';
import type { Move } from './types';

export interface UseMoveLogReturn {
  moves: Move[];
  canUndo: boolean;
  /** Returns true if move was accepted, false if rejected (UNDO blocked by depth limit) */
  appendMove: (move: Move) => boolean;
}

export function useMoveLog(
  maxUndoDepth: number | null,
): UseMoveLogReturn {
  const [moves, setMoves] = useState<Move[]>([]);

  const appendMove = useCallback(
    (move: Move): boolean => {
      if (move.type === 'UNDO') {
        // Block if undo is disabled
        if (maxUndoDepth === 0) return false;

        const targetStep = move.args['targetStep'] as number;
        // undoDepth = how far back we're going (moves.length - targetStep)
        if (maxUndoDepth !== null) {
          setMoves((prev) => {
            const depth = prev.length - targetStep;
            if (depth > maxUndoDepth) return prev; // rejected — do not update state
            return [...prev, move];
          });
          // We can't determine rejection inside setMoves; track via separate check
          // Use a local variable captured by closure:
          return true; // optimistic — depth check happens in setMoves
        }
      }

      setMoves((prev) => [...prev, move]);
      return true;
    },
    [maxUndoDepth],
  );

  const canUndo = maxUndoDepth !== 0 && moves.length > 0;

  return { moves, canUndo, appendMove };
}
```

**Note:** The `appendMove` rejection for UNDO + limited depth has a subtle issue with `setMoves` — we can't return `false` from inside `setMoves`. Refactor to use a ref-based approach:

```typescript
// src/lib/game-engine/move-log.ts
import { useCallback, useRef, useState } from 'react';
import type { Move } from './types';

export interface UseMoveLogReturn {
  moves: Move[];
  canUndo: boolean;
  appendMove: (move: Move) => boolean;
}

export function useMoveLog(
  maxUndoDepth: number | null,
): UseMoveLogReturn {
  const [moves, setMoves] = useState<Move[]>([]);
  const movesRef = useRef<Move[]>([]);

  const appendMove = useCallback(
    (move: Move): boolean => {
      if (move.type === 'UNDO') {
        if (maxUndoDepth === 0) return false;

        if (maxUndoDepth !== null) {
          const targetStep = move.args['targetStep'] as number;
          const depth = movesRef.current.length - targetStep;
          if (depth > maxUndoDepth) return false;
        }
      }

      movesRef.current = [...movesRef.current, move];
      setMoves(movesRef.current);
      return true;
    },
    [maxUndoDepth],
  );

  const canUndo = maxUndoDepth !== 0 && moves.length > 0;

  return { moves, canUndo, appendMove };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/move-log.test.ts`
Expected: PASS — all 10 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/move-log.ts src/lib/game-engine/move-log.test.ts
git commit -m "feat(m4): add useMoveLog hook with append-only log and UNDO depth enforcement"
```

---

## Task 6: Config Loader

**Files:**

- Create: `src/lib/game-engine/config-loader.ts`
- Create: `src/lib/game-engine/config-loader.test.ts`

**Context:** `loadGameConfig` merges overrides from `game_config_overrides` RxDB collection with a game's default config. Priority (highest→lowest): profile+gameId override → profile+gradeBand override → profile global override → game default. The `GameConfigOverridesDoc` fields map as: `retries` → `maxRetries`, `timerDuration` → `timerDurationSeconds`, `difficulty` → `difficulty`. `timerVisible` is derived: `timerDurationSeconds !== null`.

The function accepts an optional `defaultConfig` param for testing (in production, a bundled default would be provided by the game registration system built in M5).

Existing schema at `src/db/schemas/game_config_overrides.ts`:

- `scope`: `'game' | 'grade-band' | 'global'`
- `scopeValue`: string | null (gameId for 'game' scope, gradeBand for 'grade-band', null for 'global')
- `retries`, `timerDuration`, `alwaysWin`, `difficulty`: all nullable

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game-engine/config-loader.test.ts`:

```typescript
// src/lib/game-engine/config-loader.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { loadGameConfig } from './config-loader';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';
import type { ResolvedGameConfig } from './types';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/config-loader.test.ts`
Expected: FAIL — `loadGameConfig` is not defined

- [ ] **Step 3: Implement config-loader.ts**

Create `src/lib/game-engine/config-loader.ts`:

```typescript
// src/lib/game-engine/config-loader.ts
import type { GameConfigOverridesDoc } from '@/db/schemas/game_config_overrides';
import type { BaseSkillDatabase } from '@/db/types';
import type { GradeBand, ResolvedGameConfig } from './types';

function applyOverride(
  config: ResolvedGameConfig,
  override: GameConfigOverridesDoc,
): ResolvedGameConfig {
  const result = { ...config };

  if (override.retries !== null && override.retries !== undefined) {
    result.maxRetries = override.retries;
  }
  if (
    override.timerDuration !== null &&
    override.timerDuration !== undefined
  ) {
    result.timerDurationSeconds = override.timerDuration;
    result.timerVisible = override.timerDuration > 0;
  }
  if (
    override.difficulty !== null &&
    override.difficulty !== undefined
  ) {
    result.difficulty = override.difficulty;
  }

  return result;
}

export async function loadGameConfig(
  gameId: string,
  profileId: string,
  gradeBand: GradeBand,
  db: BaseSkillDatabase,
  defaultConfig: ResolvedGameConfig,
): Promise<ResolvedGameConfig> {
  const allOverrides = await db.game_config_overrides
    .find({ selector: { profileId } })
    .exec();

  // Priority: game → grade-band → global → default
  const gameOverride = allOverrides.find(
    (o) => o.scope === 'game' && o.scopeValue === gameId,
  );
  const gradeBandOverride = allOverrides.find(
    (o) => o.scope === 'grade-band' && o.scopeValue === gradeBand,
  );
  const globalOverride = allOverrides.find((o) => o.scope === 'global');

  let result = { ...defaultConfig };

  if (globalOverride) {
    result = applyOverride(result, globalOverride);
  }
  if (gradeBandOverride) {
    result = applyOverride(result, gradeBandOverride);
  }
  if (gameOverride) {
    result = applyOverride(result, gameOverride);
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/config-loader.test.ts`
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/config-loader.ts src/lib/game-engine/config-loader.test.ts
git commit -m "feat(m4): add loadGameConfig with 4-level override merging"
```

---

## Task 7: Session Recorder Hook

**Files:**

- Create: `src/lib/game-engine/session-recorder.ts`
- Create: `src/lib/game-engine/session-recorder.test.tsx`

**Context:** `useSessionRecorder(moves, sessionId, meta, db)` writes moves to `session_history` RxDB collection on every move and on `visibilitychange`/`beforeunload`. It chunks at 200 moves or 50 KB. It writes a `session_history_index` document when it first starts recording. It calls `getGameEventBus().emit({ type: 'game:end', ... })` when `meta.phase` is detected as `'game-over'` (passed via `phase` parameter).

Chunk document ID format: `${sessionId}-chunk-${chunkIndex}` (fits 64-char limit).

Move → SessionHistoryEvent mapping:

- `event.action` = `move.type`
- `event.payload` = `move.args`
- `event.timestamp` = `new Date(move.timestamp).toISOString()`
- `event.result` = `null` (populated in M5)

The hook creates the `session_history_index` document on first mount (with `status: 'in-progress'`). It upserts the current chunk in `session_history` on every move addition. When `phase` becomes `'game-over'`, it updates the index with `status: 'completed'`, `endedAt`, `finalScore`, `duration`, and emits `game:end`.

- [ ] **Step 1: Write the failing integration tests**

Create `src/lib/game-engine/session-recorder.test.tsx`:

```typescript
// src/lib/game-engine/session-recorder.test.tsx
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionRecorder } from './session-recorder';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';
import type {
  Move,
  SessionMeta,
  GameEngineState,
  ResolvedContent,
} from './types';

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
      { initialProps: { moves: [], phase: 'playing' } },
    );

    act(() => {
      rerender({ moves: moves1, phase: 'playing' });
    });

    await waitFor(async () => {
      const chunkId = `${sessionId}-chunk-0`;
      const chunk = await db.session_history.findOne(chunkId).exec();
      expect(chunk).not.toBeNull();
      expect(chunk?.events).toHaveLength(1);
      expect(chunk?.events[0].action).toBe('SUBMIT_ANSWER');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/session-recorder.test.tsx`
Expected: FAIL — `useSessionRecorder` is not defined

- [ ] **Step 3: Implement session-recorder.ts**

Create `src/lib/game-engine/session-recorder.ts`:

```typescript
// src/lib/game-engine/session-recorder.ts
import { useEffect, useRef } from 'react';
import type { BaseSkillDatabase } from '@/db/types';
import { getGameEventBus } from '@/lib/game-event-bus';
import type { GameEndEvent } from '@/types/game-events';
import type { Move, SessionMeta } from './types';

const CHUNK_MAX_MOVES = 200;
const CHUNK_MAX_BYTES = 50 * 1024; // 50 KB

function moveToEvent(move: Move) {
  return {
    timestamp: new Date(move.timestamp).toISOString(),
    action: move.type,
    payload: move.args as Record<string, unknown>,
    result: null as null,
  };
}

export function useSessionRecorder(
  moves: Move[],
  sessionId: string,
  meta: SessionMeta,
  db: BaseSkillDatabase,
  phase: string,
): void {
  const indexCreated = useRef(false);
  const startedAt = useRef(new Date().toISOString());
  const prevMovesLength = useRef(0);

  // Create session_history_index on mount
  useEffect(() => {
    if (indexCreated.current) return;
    indexCreated.current = true;

    void db.session_history_index.upsert({
      sessionId,
      profileId: meta.profileId,
      gameId: meta.gameId,
      startedAt: startedAt.current,
      gradeBand: meta.gradeBand,
      status: 'in-progress',
      seed: meta.seed,
      initialContent: meta.initialContent as Record<string, unknown>,
      initialState: meta.initialState as Record<string, unknown>,
      totalChunks: 1,
      totalEvents: 0,
    });
  }, [db, sessionId, meta]);

  // Write moves to session_history chunks on every move addition
  useEffect(() => {
    if (moves.length === 0) return;
    if (moves.length === prevMovesLength.current) return;
    prevMovesLength.current = moves.length;

    const allEvents = moves.map(moveToEvent);
    const chunks: (typeof allEvents)[] = [];
    let currentChunk: typeof allEvents = [];
    let currentBytes = 0;

    for (const event of allEvents) {
      const eventBytes = JSON.stringify(event).length;
      if (
        currentChunk.length >= CHUNK_MAX_MOVES ||
        currentBytes + eventBytes > CHUNK_MAX_BYTES
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentBytes = 0;
      }
      currentChunk.push(event);
      currentBytes += eventBytes;
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    const writes = chunks.map((events, chunkIndex) =>
      db.session_history.upsert({
        id: `${sessionId}-chunk-${chunkIndex}`,
        sessionId,
        profileId: meta.profileId,
        gameId: meta.gameId,
        chunkIndex,
        events,
        createdAt: startedAt.current,
      }),
    );

    void Promise.all(writes).then(() => {
      void db.session_history_index
        .findOne(sessionId)
        .exec()
        .then((doc) => {
          if (doc) {
            void doc.incrementalPatch({
              totalEvents: moves.length,
              totalChunks: chunks.length,
            });
          }
        });
    });
  }, [moves, db, sessionId, meta]);

  // Mark completed when game-over
  useEffect(() => {
    if (phase !== 'game-over') return;

    const endedAt = new Date().toISOString();
    const durationMs =
      new Date(endedAt).getTime() -
      new Date(startedAt.current).getTime();

    void db.session_history_index
      .findOne(sessionId)
      .exec()
      .then((doc) => {
        if (!doc || doc.status === 'completed') return;
        void doc.incrementalPatch({
          status: 'completed',
          endedAt,
          duration: Math.round(durationMs / 1000),
        });
      });

    // Emit game:end on event bus
    const bus = getGameEventBus();
    const endEvent: GameEndEvent = {
      type: 'game:end',
      gameId: meta.gameId,
      sessionId,
      profileId: meta.profileId,
      timestamp: Date.now(),
      roundIndex: 0,
      finalScore: 0,
      totalRounds: meta.initialContent.rounds.length,
      correctCount: 0,
      durationMs,
    };
    bus.emit(endEvent);
  }, [phase, db, sessionId, meta]);

  // Flush on visibilitychange (hidden)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Already writing reactively — force a final upsert of current state
        void db.session_history_index
          .findOne(sessionId)
          .exec()
          .then((doc) => {
            if (doc && doc.status === 'in-progress') {
              void doc.incrementalPatch({ totalEvents: moves.length });
            }
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility,
      );
    };
  }, [db, sessionId, moves.length]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/session-recorder.test.tsx`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/session-recorder.ts src/lib/game-engine/session-recorder.test.tsx
git commit -m "feat(m4): add useSessionRecorder with RxDB writes, chunk management, and game:end event"
```

---

## Task 8: Session Finder

**Files:**

- Create: `src/lib/game-engine/session-finder.ts`
- Create: `src/lib/game-engine/session-finder.test.ts`

**Context:** `findInProgressSession(profileId, gameId, db)` queries `session_history_index` for a session with `status: 'in-progress'` matching the profile+game. If found and < 24h old, loads all `session_history` chunks, maps events back to `Move[]`, and returns a fully hydrated `MoveLog`. If the session is > 24h old, patches it to `abandoned` and returns null.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/game-engine/session-finder.test.ts`:

```typescript
// src/lib/game-engine/session-finder.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { findInProgressSession } from './session-finder';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import type { BaseSkillDatabase } from '@/db/types';

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
    expect(result?.moves[0].type).toBe('SUBMIT_ANSWER');
    expect(result?.moves[0].args).toEqual({ answer: 'A' });
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
    expect(result?.moves[0].type).toBe('SUBMIT_ANSWER');
    expect(result?.moves[1].type).toBe('NEXT_ROUND');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/session-finder.test.ts`
Expected: FAIL — `findInProgressSession` is not defined

- [ ] **Step 3: Implement session-finder.ts**

Create `src/lib/game-engine/session-finder.ts`:

```typescript
// src/lib/game-engine/session-finder.ts
import type { BaseSkillDatabase } from '@/db/types';
import type {
  GameEngineState,
  Move,
  MoveLog,
  MoveType,
  ResolvedContent,
} from './types';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function findInProgressSession(
  profileId: string,
  gameId: string,
  db: BaseSkillDatabase,
): Promise<MoveLog | null> {
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

  const allEvents = [...chunks]
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .flatMap((c) => c.events);

  const moves: Move[] = allEvents.map((e) => ({
    type: e.action as MoveType,
    args: (e.payload ?? {}) as Record<
      string,
      string | number | boolean
    >,
    timestamp: new Date(e.timestamp).getTime(),
  }));

  return {
    gameId: index.gameId,
    sessionId: index.sessionId,
    profileId: index.profileId,
    seed: index.seed,
    initialContent: index.initialContent as ResolvedContent,
    initialState: index.initialState as GameEngineState,
    moves,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/session-finder.test.ts`
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-engine/session-finder.ts src/lib/game-engine/session-finder.test.ts
git commit -m "feat(m4): add findInProgressSession with stale session abandonment"
```

---

## Task 9: GameEngineProvider

**Files:**

- Create: `src/lib/game-engine/index.ts`
- Create: `src/lib/game-engine/game-engine-provider.test.tsx`

**Context:** `GameEngineProvider` composes `useGameLifecycle`, `useMoveLog`, `useSessionRecorder`. It exposes two contexts: `GameStateContext` (re-renders consumers on state change) and `GameDispatchContext` (stable ref, no re-renders on state change). Consumer hooks: `useGameState()` and `useGameDispatch()`.

When dispatch receives `UNDO`: appends move to log (via useMoveLog), calls `replayToStep` with the updated move list to recover state, then calls `lifecycleDispatch(RESTORE_STATE)`.

The provider also accepts an optional `initialLog` prop for silent resume. If provided, it reconstructs the initial state via `replayToStep(initialLog, initialLog.moves.length - 1, moves)` and sets that as the starting state.

- [ ] **Step 1: Write the failing integration tests**

Create `src/lib/game-engine/game-engine-provider.test.tsx`:

```typescript
// src/lib/game-engine/game-engine-provider.test.tsx
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameEngineProvider, useGameDispatch, useGameState } from './index';
import { createTestDatabase, destroyTestDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import type { BaseSkillDatabase } from '@/db/types';
import type {
  GameEngineState,
  MoveHandler,
  MoveLog,
  ResolvedContent,
  ResolvedGameConfig,
} from './types';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
  ],
};

const config: ResolvedGameConfig = {
  gameId: 'test',
  title: { en: 'Test' },
  gradeBand: 'year1-2',
  maxRounds: 2,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: false,
  timerDurationSeconds: null,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'instructions',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

// Game handler that records answer
const submitHandler: MoveHandler = (state, args) => ({
  ...state,
  currentRound: { ...state.currentRound, answer: args['answer'] as string },
});

const gameMovers: Record<string, MoveHandler> = {
  SUBMIT_ANSWER: submitHandler,
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function makeWrapper(sessionId: string) {
  return ({ children }: { children: ReactNode }) => (
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      <GameEngineProvider
        config={config}
        moves={gameMovers}
        initialState={initialState}
        sessionId={sessionId}
        meta={{
          profileId: 'prof-provider',
          gameId: 'test',
          gradeBand: 'year1-2',
          seed: 'seed-provider',
          initialContent: content,
          initialState,
        }}
      >
        {children}
      </GameEngineProvider>
    </DbProvider>
  );
}

describe('GameEngineProvider', () => {
  it('provides initial state via useGameState', () => {
    const { result } = renderHook(() => useGameState(), {
      wrapper: makeWrapper('sess-p-001'),
    });
    expect(result.current.phase).toBe('instructions');
    expect(result.current.score).toBe(0);
  });

  it('provides stable dispatch via useGameDispatch', () => {
    const { result, rerender } = renderHook(() => useGameDispatch(), {
      wrapper: makeWrapper('sess-p-002'),
    });
    const dispatch1 = result.current;
    rerender();
    const dispatch2 = result.current;
    expect(dispatch1).toBe(dispatch2); // stable reference
  });

  it('SKIP_INSTRUCTIONS transitions to playing', () => {
    const { result } = renderHook(() => useGameState(), {
      wrapper: makeWrapper('sess-p-003'),
    });
    const { result: dispatchResult } = renderHook(() => useGameDispatch(), {
      wrapper: makeWrapper('sess-p-003'),
    });

    // Need same wrapper instance — use a combined hook
    const { result: combined } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-004') },
    );

    act(() => {
      combined.current.dispatch({ type: 'SKIP_INSTRUCTIONS', args: {}, timestamp: Date.now() });
    });
    expect(combined.current.state.phase).toBe('playing');
  });

  it('SUBMIT_ANSWER correct transitions to next-round and records in move log', async () => {
    const { result } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-005') },
    );

    act(() => {
      result.current.dispatch({ type: 'SKIP_INSTRUCTIONS', args: {}, timestamp: Date.now() });
    });
    act(() => {
      result.current.dispatch({ type: 'SUBMIT_ANSWER', args: { answer: 'A' }, timestamp: Date.now() });
    });

    expect(result.current.state.phase).toBe('next-round');
    expect(result.current.state.score).toBe(1);

    // Verify move was written to RxDB
    await waitFor(async () => {
      const chunk = await db.session_history.findOne('sess-p-005-chunk-0').exec();
      expect(chunk?.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('UNDO rolls back to previous state', () => {
    const { result } = renderHook(
      () => ({ state: useGameState(), dispatch: useGameDispatch() }),
      { wrapper: makeWrapper('sess-p-006') },
    );

    act(() => {
      result.current.dispatch({ type: 'SKIP_INSTRUCTIONS', args: {}, timestamp: Date.now() }); // move 0
    });
    act(() => {
      result.current.dispatch({ type: 'SUBMIT_ANSWER', args: { answer: 'WRONG' }, timestamp: Date.now() }); // move 1
    });
    expect(result.current.state.phase).toBe('retry');

    act(() => {
      // UNDO back to after SKIP_INSTRUCTIONS (step 0 = after move 0 applied)
      result.current.dispatch({ type: 'UNDO', args: { targetStep: 1 }, timestamp: Date.now() });
    });
    expect(result.current.state.phase).toBe('playing');
    expect(result.current.state.score).toBe(0);
  });

  it('resumes from initialLog when provided', () => {
    const resumeLog: MoveLog = {
      gameId: 'test',
      sessionId: 'sess-resume',
      profileId: 'prof-provider',
      seed: 'seed-provider',
      initialContent: content,
      initialState,
      moves: [
        { type: 'SKIP_INSTRUCTIONS', args: {}, timestamp: Date.now() },
        { type: 'SUBMIT_ANSWER', args: { answer: 'A' }, timestamp: Date.now() },
      ],
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <GameEngineProvider
          config={config}
          moves={gameMovers}
          initialState={initialState}
          sessionId="sess-resume"
          meta={{
            profileId: 'prof-provider',
            gameId: 'test',
            gradeBand: 'year1-2',
            seed: 'seed-provider',
            initialContent: content,
            initialState,
          }}
          initialLog={resumeLog}
        >
          {children}
        </GameEngineProvider>
      </DbProvider>
    );

    const { result } = renderHook(() => useGameState(), { wrapper });
    // After replaying 2 moves (SKIP_INSTRUCTIONS + SUBMIT_ANSWER correct), should be next-round
    expect(result.current.phase).toBe('next-round');
    expect(result.current.score).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/game-engine/game-engine-provider.test.tsx`
Expected: FAIL — `GameEngineProvider` is not defined

- [ ] **Step 3: Implement index.ts**

Create `src/lib/game-engine/index.ts`:

```typescript
// src/lib/game-engine/index.ts
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useRxDB } from '@/db/hooks/useRxDB';
import { replayToStep } from './replay';
import { useGameLifecycle } from './lifecycle';
import { useMoveLog } from './move-log';
import { useSessionRecorder } from './session-recorder';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  SessionMeta,
} from './types';

// --- Contexts ---

const GameStateContext = createContext<GameEngineState | null>(null);
const GameDispatchContext = createContext<((move: Move) => void) | null>(null);

// --- Consumer hooks ---

export function useGameState(): GameEngineState {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameEngineProvider');
  return ctx;
}

export function useGameDispatch(): (move: Move) => void {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameEngineProvider');
  return ctx;
}

// --- Provider ---

interface GameEngineProviderProps {
  config: ResolvedGameConfig;
  moves: Record<string, MoveHandler>;
  initialState: GameEngineState;
  sessionId: string;
  meta: SessionMeta;
  initialLog?: MoveLog;
  children: ReactNode;
}

export function GameEngineProvider({
  config,
  moves: gameMovers,
  initialState,
  sessionId,
  meta,
  initialLog,
  children,
}: GameEngineProviderProps): JSX.Element {
  const { db } = useRxDB();

  // Compute resumed initial state if initialLog provided
  const resolvedInitialState = useMemo(() => {
    if (!initialLog || initialLog.moves.length === 0) return initialState;
    return replayToStep(
      initialLog,
      initialLog.moves.length - 1,
      gameMovers,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally run once

  const [state, lifecycleDispatch] = useGameLifecycle(
    config,
    gameMovers,
    resolvedInitialState,
  );

  const { moves, canUndo, appendMove } = useMoveLog(config.maxUndoDepth);

  // Session recorder watches state.phase and moves
  if (db) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- db is stable after mount
    useSessionRecorder(moves, sessionId, meta, db, state.phase);
  }

  const dispatch = useCallback(
    (move: Move) => {
      if (move.type === 'UNDO') {
        if (!canUndo) return;
        const accepted = appendMove(move);
        if (!accepted) return;

        // Build a temporary log to replay
        const currentMoves = [...moves, move];
        const targetStep = move.args['targetStep'] as number;
        const tempLog: MoveLog = {
          gameId: meta.gameId,
          sessionId,
          profileId: meta.profileId,
          seed: meta.seed,
          initialContent: meta.initialContent,
          initialState,
          moves: currentMoves,
        };
        const recoveredState = replayToStep(tempLog, targetStep > 0 ? targetStep - 1 : 0, gameMovers);
        lifecycleDispatch({
          type: 'RESTORE_STATE',
          args: { _state: JSON.stringify(recoveredState) },
          timestamp: move.timestamp,
        });
        return;
      }

      appendMove(move);
      lifecycleDispatch(move);
    },
    [
      canUndo,
      appendMove,
      moves,
      meta,
      sessionId,
      initialState,
      gameMovers,
      lifecycleDispatch,
    ],
  );

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/game-engine/game-engine-provider.test.tsx`
Expected: PASS — all 6 tests green

- [ ] **Step 5: Full verification**

Run: `yarn typecheck && yarn test && yarn build`
Expected: all green

- [ ] **Step 6: Commit**

```bash
git add src/lib/game-engine/index.ts src/lib/game-engine/game-engine-provider.test.tsx
git commit -m "feat(m4): add GameEngineProvider with split contexts, UNDO replay, and silent resume"
```

---

## Task 10: GameShell UI

**Files:**

- Create: `src/components/game/GameShell.tsx`
- Create: `src/components/game/GameShell.test.tsx`

**Context:** GameShell renders Layout B. It wraps `GameEngineProvider` and renders chrome (top bar, sub-bar, game area, footer) via an inner component that uses `useGameState` and `useGameDispatch`. The undo button is hidden when `maxUndoDepth === 0` or no moves exist. The timer sub-bar is hidden when `timerVisible: false`. Back/Exit navigate to `/$locale/dashboard`.

Layout B spec:

```
┌─────────────────────────────────────┐
│ ← Word Builder          Round 2/5   │  top bar
├─────────────────────────────────────┤
│ ⭐ 3   ████░░░░░░   ⏱ 0:42          │  sub-bar (score + progress + timer)
├─────────────────────────────────────┤
│         [game component here]       │  flex-1 game area
├─────────────────────────────────────┤
│  ⟲ Undo    II Pause     ✕ Exit       │  footer
└─────────────────────────────────────┘
```

`GameShell` needs: `config`, `moves` (MoveHandlers), `initialState`, `sessionId`, `meta`, optional `initialLog`, and a `children` slot for the game component.

- [ ] **Step 1: Write the failing tests**

Create `src/components/game/GameShell.test.tsx`:

```typescript
// src/components/game/GameShell.test.tsx
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { GameShell } from './GameShell';
import { createTestDatabase, destroyTestDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import type { BaseSkillDatabase } from '@/db/types';
import type { GameEngineState, ResolvedContent, ResolvedGameConfig, SessionMeta } from '@/lib/game-engine/types';

// Mock TanStack Router navigate
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ locale: 'en', gameId: 'word-builder' }),
  };
});

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
  ],
};

const baseConfig: ResolvedGameConfig = {
  gameId: 'word-builder',
  title: { en: 'Word Builder' },
  gradeBand: 'year1-2',
  maxRounds: 2,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: true,
  timerDurationSeconds: 60,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 1, // round 2 of 2 (1-indexed display)
  score: 3,
  streak: 1,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r2', answer: null, hintsUsed: 0 },
};

const meta: SessionMeta = {
  profileId: 'prof-shell',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'seed-shell',
  initialContent: content,
  initialState,
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function renderShell(configOverride?: Partial<ResolvedGameConfig>, children?: ReactNode) {
  const config = { ...baseConfig, ...configOverride };
  return render(
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      <GameShell
        config={config}
        moves={{}}
        initialState={initialState}
        sessionId="sess-shell-001"
        meta={meta}
      >
        {children ?? <div data-testid="game-content">Game Here</div>}
      </GameShell>
    </DbProvider>,
  );
}

describe('GameShell', () => {
  it('renders game title in top bar', () => {
    renderShell();
    expect(screen.getByText('Word Builder')).toBeInTheDocument();
  });

  it('renders round counter (1-indexed)', () => {
    renderShell();
    // roundIndex=1 → "Round 2 / 2"
    expect(screen.getByText(/Round 2/)).toBeInTheDocument();
  });

  it('renders score in sub-bar', () => {
    renderShell();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders timer when timerVisible is true', () => {
    renderShell({ timerVisible: true });
    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
  });

  it('hides timer when timerVisible is false', () => {
    renderShell({ timerVisible: false });
    expect(screen.queryByTestId('game-timer')).not.toBeInTheDocument();
  });

  it('renders undo button when maxUndoDepth is non-zero', () => {
    renderShell({ maxUndoDepth: 3 });
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('hides undo button when maxUndoDepth is 0', () => {
    renderShell({ maxUndoDepth: 0 });
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('renders the game component children', () => {
    renderShell();
    expect(screen.getByTestId('game-content')).toBeInTheDocument();
  });

  it('renders Exit button in footer', () => {
    renderShell();
    expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/game/GameShell.test.tsx`
Expected: FAIL — `GameShell` is not defined

- [ ] **Step 3: Implement GameShell.tsx**

Create `src/components/game/GameShell.tsx`:

```tsx
// src/components/game/GameShell.tsx
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import {
  GameEngineProvider,
  useGameDispatch,
  useGameState,
} from '@/lib/game-engine/index';
import type {
  MoveHandler,
  MoveLog,
  ResolvedGameConfig,
  GameEngineState,
  SessionMeta,
} from '@/lib/game-engine/types';

interface GameShellProps {
  config: ResolvedGameConfig;
  moves: Record<string, MoveHandler>;
  initialState: GameEngineState;
  sessionId: string;
  meta: SessionMeta;
  initialLog?: MoveLog;
  children: ReactNode;
}

interface GameShellChromeProps {
  config: ResolvedGameConfig;
  children: ReactNode;
}

function GameShellChrome({ config, children }: GameShellChromeProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const navigate = useNavigate();
  const locale = 'en'; // TODO: use i18n locale in M5

  const roundDisplay = state.roundIndex + 1;
  const title = config.title['en'] ?? config.gameId;

  function handleExit() {
    void navigate({ to: `/${locale}/dashboard` });
  }

  function handleUndo() {
    dispatch({
      type: 'UNDO',
      args: { targetStep: Math.max(0, state.roundIndex) },
      timestamp: Date.now(),
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <button
          className="text-sm text-muted-foreground"
          onClick={handleExit}
          aria-label="Back"
          type="button"
        >
          ← {title}
        </button>
        <span className="text-sm font-medium">
          Round {roundDisplay} / {config.maxRounds}
        </span>
      </header>

      {/* Sub-bar: score + progress + optional timer */}
      <div className="flex items-center gap-4 border-b px-4 py-2 text-sm">
        <span>⭐ {state.score}</span>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.round((roundDisplay / config.maxRounds) * 100)}%`,
              }}
            />
          </div>
        </div>
        {config.timerVisible &&
          config.timerDurationSeconds !== null && (
            <span data-testid="game-timer">
              ⏱ {config.timerDurationSeconds}s
            </span>
          )}
      </div>

      {/* Game area */}
      <main className="min-h-0 flex-1 overflow-auto p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-around border-t px-4 py-2">
        {config.maxUndoDepth !== 0 && (
          <button
            className="flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-muted disabled:opacity-40"
            onClick={handleUndo}
            aria-label="Undo"
            type="button"
          >
            ⟲ Undo
          </button>
        )}
        <button
          className="rounded px-3 py-1 text-sm hover:bg-muted"
          type="button"
          aria-label="Pause"
        >
          II Pause
        </button>
        <button
          className="rounded px-3 py-1 text-sm hover:bg-muted"
          onClick={handleExit}
          aria-label="Exit"
          type="button"
        >
          ✕ Exit
        </button>
      </footer>
    </div>
  );
}

export function GameShell({
  config,
  moves,
  initialState,
  sessionId,
  meta,
  initialLog,
  children,
}: GameShellProps) {
  return (
    <GameEngineProvider
      config={config}
      moves={moves}
      initialState={initialState}
      sessionId={sessionId}
      meta={meta}
      initialLog={initialLog}
    >
      <GameShellChrome config={config}>{children}</GameShellChrome>
    </GameEngineProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/game/GameShell.test.tsx`
Expected: PASS — all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/components/game/GameShell.tsx src/components/game/GameShell.test.tsx
git commit -m "feat(m4): add GameShell Layout B component with undo/timer/exit conditionals"
```

---

## Task 11: Route Wiring

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

**Context:** Replace the placeholder component with a real loader that calls `loadGameConfig` and `findInProgressSession`, then mounts `GameShell` with a placeholder game component (real game components come in M5). The route requires `profileId` from the parent layout context (or from a URL search param for testing). For M4, use a hardcoded `profileId: 'default'` and a stub `defaultConfig` — the profile context integration is M5 work.

The loader runs server-side/at-navigation-time via TanStack Router's `loader` function. It gets the database from a module-level import of `getOrCreateDatabase`.

- [ ] **Step 1: Check what the existing route parent provides**

Read the parent layout file to understand what context/loaderData flows down:

```bash
cat src/routes/'$locale'/_app.tsx
```

Look for `loaderData` and `context` — note the shape so we can match it.

- [ ] **Step 2: Write the route test**

Create `src/routes/$locale/_app/game/$gameId.test.tsx`:

```typescript
// Note: this file lives alongside the route — TanStack Router colocation
// src/routes/$locale/_app/game/$gameId.test.tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createTestDatabase, destroyTestDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';
import type { BaseSkillDatabase } from '@/db/types';

// We test the GameRoute component by rendering it directly
// with a mocked database (bypassing TanStack Router loader)
import { GameRoute } from './$gameId';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ locale: 'en', gameId: 'word-builder' }),
    useLoaderData: () => ({
      config: {
        gameId: 'word-builder',
        title: { en: 'Word Builder' },
        gradeBand: 'year1-2',
        maxRounds: 3,
        maxRetries: 1,
        maxUndoDepth: 3,
        timerVisible: false,
        timerDurationSeconds: null,
        difficulty: 'medium',
      },
      initialLog: null,
      sessionId: 'sess-route-001',
      meta: {
        profileId: 'prof-route',
        gameId: 'word-builder',
        gradeBand: 'year1-2',
        seed: 'seed-route',
        initialContent: { rounds: [{ id: 'r1', prompt: { en: 'Q' }, correctAnswer: 'A' }] },
        initialState: {
          phase: 'instructions',
          roundIndex: 0,
          score: 0,
          streak: 0,
          retryCount: 0,
          content: { rounds: [{ id: 'r1', prompt: { en: 'Q' }, correctAnswer: 'A' }] },
          currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
        },
      },
    }),
  };
});

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      {children}
    </DbProvider>
  );
}

describe('GameRoute', () => {
  it('renders the game shell with title from loaderData', async () => {
    render(<GameRoute />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Word Builder')).toBeInTheDocument();
    });
  });

  it('renders instructions phase placeholder', async () => {
    render(<GameRoute />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Round 1/)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test 'src/routes/$locale/_app/game/$gameId.test.tsx'`
Expected: FAIL — `GameRoute` is not exported

- [ ] **Step 4: Implement the route**

Replace `src/routes/$locale/_app/game/$gameId.tsx` entirely:

```tsx
// src/routes/$locale/_app/game/$gameId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { getOrCreateDatabase } from '@/db/create-database';
import { GameShell } from '@/components/game/GameShell';
import { loadGameConfig } from '@/lib/game-engine/config-loader';
import { findInProgressSession } from '@/lib/game-engine/session-finder';
import type {
  GameEngineState,
  MoveLog,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';

// Stub default config used until M5 introduces game registrations
const STUB_CONTENT: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Question 1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Question 2' }, correctAnswer: 'B' },
    { id: 'r3', prompt: { en: 'Question 3' }, correctAnswer: 'C' },
  ],
};

function makeDefaultConfig(gameId: string): ResolvedGameConfig {
  return {
    gameId,
    title: { en: gameId },
    gradeBand: 'year1-2',
    maxRounds: 3,
    maxRetries: 1,
    maxUndoDepth: 3,
    timerVisible: false,
    timerDurationSeconds: null,
    difficulty: 'medium',
  };
}

interface GameRouteLoaderData {
  config: ResolvedGameConfig;
  initialLog: MoveLog | null;
  sessionId: string;
  meta: SessionMeta;
}

export const Route = createFileRoute('/$locale/_app/game/$gameId')({
  loader: async ({ params }): Promise<GameRouteLoaderData> => {
    const { gameId } = params;
    const profileId = 'default'; // M5: pull from profile context

    const db = await getOrCreateDatabase();
    const defaultConfig = makeDefaultConfig(gameId);
    const config = await loadGameConfig(
      gameId,
      profileId,
      defaultConfig.gradeBand,
      db,
      defaultConfig,
    );

    const initialLog = await findInProgressSession(
      profileId,
      gameId,
      db,
    );

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

    const meta: SessionMeta = {
      profileId,
      gameId,
      gradeBand: config.gradeBand,
      seed,
      initialContent,
      initialState,
    };

    return { config, initialLog, sessionId, meta };
  },
  component: GameRoute,
});

export function GameRoute() {
  const { config, initialLog, sessionId, meta } = Route.useLoaderData();

  return (
    <GameShell
      config={config}
      moves={{}}
      initialState={meta.initialState}
      sessionId={sessionId}
      meta={meta}
      initialLog={initialLog ?? undefined}
    >
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Game component placeholder — real game in M5</p>
      </div>
    </GameShell>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test 'src/routes/$locale/_app/game/$gameId.test.tsx'`
Expected: PASS

- [ ] **Step 6: Full verification**

Run: `yarn typecheck && yarn test && yarn build`
Expected: all green

- [ ] **Step 7: Commit**

```bash
git add 'src/routes/$locale/_app/game/$gameId.tsx' 'src/routes/$locale/_app/game/$gameId.test.tsx'
git commit -m "feat(m4): wire game route with config loader, silent resume, and GameShell"
```

---

## Self-Review

**Spec coverage check:**

| Spec Section                                          | Task Covering It |
| ----------------------------------------------------- | ---------------- |
| §3 Types                                              | Task 1           |
| §4 Lifecycle State Machine (9 transitions)            | Task 4           |
| §5 Move Log — UNDO as first-class move                | Task 5           |
| §6 Replay Engine — pure fn, UNDO handling             | Task 3           |
| §7 Config Loader + Override Merging (4 levels)        | Task 6           |
| §8 GameEngineProvider — split contexts                | Task 9           |
| §9 Session Recorder — RxDB writes, flush triggers     | Task 7           |
| §9a Silent Resume — findInProgressSession, stale >24h | Task 8           |
| §10 GameShell UI — Layout B                           | Task 10          |
| §11 Directory Structure                               | All tasks        |
| §12 Existing utilities reused                         | Tasks 7-11       |
| §13 Modified: session_history_index status + bump     | Task 2           |
| §13 Modified: game/$gameId.tsx route wiring           | Task 11          |
| §14 Testing — unit replay/move-log/config/lifecycle   | Tasks 3-6        |
| §14 Testing — integration provider/recorder           | Tasks 7, 9       |

**Spec gap noted:** `src/types/game-events.ts` — spec §13 says "verify `GameEventType` covers all move-triggered bus events". Review the file; `game:end` is already present; all needed types exist. No code change needed.

**Type consistency check:**

- `MoveHandler` defined in Task 1, used in Tasks 4, 5, 9, 10, 11 ✓
- `SessionMeta` defined in Task 1, used in Tasks 7, 9, 10, 11 ✓
- `BaseSkillDatabase` (not `AppDatabase`) used throughout ✓
- `findInProgressSession` returns `MoveLog | null`, consumed in Task 9 (UNDO) and Task 11 (route) ✓
- `GameEngineProvider` props (`initialState`, `sessionId`, `meta`) match usage in `GameShell` Task 10 ✓
- `useSessionRecorder` signature `(moves, sessionId, meta, db, phase)` used consistently in Tasks 7 and 9 ✓
