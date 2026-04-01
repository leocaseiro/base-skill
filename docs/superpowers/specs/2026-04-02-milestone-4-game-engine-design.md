# M4 Game Engine Framework — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Milestone:** 4 — Game Engine Framework
**Depends on:** M2 (RxDB, event bus, speech services), M3 (app shell, routing)

---

## 1. Overview

M4 builds the reusable game infrastructure that all 5 reference games (M5) run on. Reusable interaction components (DragAndDrop, LetterTracer, etc.) are **deferred to M5**, built alongside the games that need them.

The defining requirement beyond the milestone plan: the engine supports **parent-watchable replay**. Parents can scrub through every step their child took — including every undo — to see real learning behaviour (e.g. repeated undo to fake a better score). This is achieved via an append-only move log and a standalone replay function, similar in spirit to boardgame.io's move history and Redux DevTools.

---

## 2. Architecture

Three layers, cleanly separated:

```
GameShell  (route: /$locale/_app/game/$gameId)
└── GameEngineProvider          ← Redux-style context provider
    ├── GameStateContext         ← state only (re-renders consumers)
    ├── GameDispatchContext      ← stable dispatch ref (no re-renders)
    └── <game component>        ← useGameState() + useGameDispatch()

replayToStep(log, stepIndex)    ← standalone pure function
                                   used by: live undo + M7 parent viewer
```

### Provider internals — three composed hooks

| Hook                          | Responsibility                                                           |
| ----------------------------- | ------------------------------------------------------------------------ |
| `useGameLifecycle(config)`    | Lifecycle state machine (8 phases, 9 transitions). No RxDB, no move log. |
| `useMoveLog(maxUndoDepth)`    | Append-only move log + undo enforcement. No RxDB.                        |
| `useSessionRecorder(moveLog)` | RxDB chunked writes. Subscribes to log. Emits `game:end` on bus.         |

---

## 3. Types

```ts
// src/lib/game-engine/types.ts

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

export interface GameEngineState {
  phase: GamePhase;
  roundIndex: number;
  score: number;
  streak: number;
  retryCount: number;
  content: ResolvedContent; // pre-materialized at session start
  currentRound: RoundState;
}

export type MoveType =
  | 'SUBMIT_ANSWER'
  | 'REQUEST_HINT'
  | 'SKIP_INSTRUCTIONS'
  | 'UNDO';
// Game-specific types added in M5 per game

export interface Move {
  type: MoveType;
  args: Record<string, string | number | boolean>;
  // For UNDO: args = { targetStep: number }
  timestamp: number;
}

export interface MoveLog {
  gameId: string;
  sessionId: string;
  profileId: string;
  seed: string; // PRNG seed (stored for auditability)
  initialContent: ResolvedContent; // pre-resolved question list (fast replay, no re-generation)
  initialState: GameEngineState;
  moves: Move[];
}

export interface ResolvedContent {
  rounds: RoundDefinition[];
}

export interface RoundDefinition {
  id: string;
  prompt: Record<string, string>; // locale-keyed: { en: '...', 'pt-BR': '...' }
  correctAnswer: string;
  distractors?: string[]; // optional — not all game types use distractors
  // Extended per game type in M5
}

export interface RoundState {
  roundId: string;
  answer: string | null;
  hintsUsed: number;
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
```

---

## 4. Lifecycle State Machine

```
idle → loading → instructions → playing → evaluating → scoring
                                                          ├→ next-round → playing  (loop)
                                                          ├→ retry      → playing  (bounded by maxRetries)
                                                          └→ game-over
```

### Transitions

| Function                | From         | To                             | Trigger                             |
| ----------------------- | ------------ | ------------------------------ | ----------------------------------- |
| `load(gameId)`          | idle         | loading                        | Route loader resolves               |
| `showInstructions()`    | loading      | instructions                   | Assets ready                        |
| `startPlay()`           | instructions | playing                        | Child taps Start / instructions end |
| `submitAnswer(payload)` | playing      | evaluating                     | Child submits                       |
| `evaluate(result)`      | evaluating   | scoring                        | Engine scores answer                |
| `scoreRound(score)`     | scoring      | next-round / retry / game-over | Engine decides                      |
| `nextRound()`           | next-round   | playing                        | Advance                             |
| `retry()`               | retry        | playing                        | Replay current round                |
| `endGame()`             | game-over    | idle                           | Navigate back                       |

---

## 5. Move Log — Append-Only, UNDO as First-Class Move

The log is **never mutated**. Undo appends an `UNDO` entry rather than removing the previous move. This means the parent always sees the full history including every undo the child used.

Example — child undid twice to get a correct answer:

```
move[0]  SUBMIT_ANSWER  { answer: 'B' }    ← wrong
move[1]  UNDO           { targetStep: 0 }  ← undo back to start of round 1
move[2]  SUBMIT_ANSWER  { answer: 'C' }    ← wrong again
move[3]  UNDO           { targetStep: 0 }  ← undo again
move[4]  SUBMIT_ANSWER  { answer: 'A' }    ← correct
```

The final score looks good; the move log tells the full story.

---

## 6. Replay Engine

```ts
// src/lib/game-engine/replay.ts

// Pure function — no React, no side effects, no RxDB
export function replayToStep(
  log: MoveLog,
  stepIndex: number,
): GameEngineState;
```

**UNDO handling:** When `replayToStep` encounters an `UNDO` move at position N with `{ targetStep: M }`, it replays moves `0 → M` to recover state at M, then continues applying moves `N+1 → stepIndex` on top. No snapshots required — short sessions (10–50 moves) make this trivially cheap.

**Used by:**

1. `useMoveLog` — live undo during gameplay
2. M7 parent session history viewer — scrub to any step without mounting a GameShell

---

## 7. Config Loader + Override Merging

```ts
// src/lib/game-engine/config-loader.ts

export async function loadGameConfig(
  gameId: string,
  profileId: string,
  gradeBand: GradeBand,
  db: AppDatabase,
): Promise<ResolvedGameConfig>;
```

Priority chain (highest → lowest):

1. **Profile override** — from `game_config_overrides` collection (profileId + gameId match)
2. **Grade-band override** — from `game_config_overrides` (profileId + gradeBand match)
3. **Global override** — from `game_config_overrides` (profileId, applies to all games)
4. **Game default** — from the game's bundled JSON config

Called in the TanStack Router `loader` for `/$locale/_app/game/$gameId` so config is resolved before the component mounts.

---

## 8. GameEngineProvider

```ts
// src/lib/game-engine/index.ts

interface GameEngineProviderProps {
  config: ResolvedGameConfig;
  moves: Record<
    string,
    (state: GameEngineState, args: Move['args']) => GameEngineState
  >;
  children: ReactNode;
}

export function GameEngineProvider({
  config,
  moves,
  children,
}: GameEngineProviderProps): JSX.Element;

// Consumer hooks
export function useGameState(): GameEngineState;
export function useGameDispatch(): (move: Move) => void;
```

Split contexts prevent unnecessary re-renders: components that only dispatch (e.g. answer buttons) don't re-render when state changes.

---

## 9. Session Recorder

```ts
// src/lib/game-engine/session-recorder.ts

export function useSessionRecorder(
  moves: Move[],
  sessionId: string,
  meta: SessionMeta,
): void;
```

**Write triggers (all must flush to RxDB):**

1. **Every move** — write the latest move to the current in-progress chunk immediately
2. **`visibilitychange` → hidden** — flush in-progress buffer; browser may be closed
3. **`beforeunload`** — synchronous flush via `navigator.sendBeacon` or `indexedDB` direct write
4. **Chunk boundary** — open a new chunk document when current exceeds 200 moves or 50 KB
5. **`game-over` phase** — flush final chunk, write `session_history_index` summary, emit `game:end` on `TypedGameEventBus`

**`session_history_index` status field:**

The index document gains a `status` field to distinguish complete from interrupted sessions:

```ts
status: 'in-progress' | 'completed' | 'abandoned';
// 'in-progress'  → game started, not yet finished (browser close mid-session)
// 'completed'    → game:end reached normally
// 'abandoned'    → child exited via the Exit button before game-over
```

Move log stored as-is (includes seed + initialContent + all moves including UNDOs).

---

## 9a. Silent Resume

When a child navigates to a game, the TanStack Router `loader` checks for an `in-progress` session for this `(profileId, gameId)` pair in `session_history_index`. If found, the move log is loaded from `session_history` chunks and `replayToStep` reconstructs the state at the last recorded move. The child lands directly back in the game at the correct round — no prompt.

```ts
// In the loader for /$locale/_app/game/$gameId
const resumeLog = await findInProgressSession(profileId, gameId, db);
// resumeLog is null (no resume) or a fully hydrated MoveLog

// Passed into GameEngineProvider as optional initialLog prop:
// If present → engine calls replayToStep(resumeLog, resumeLog.moves.length - 1)
// If absent  → engine starts fresh, generates new sessionId + seed
```

**Edge case:** If the in-progress session is more than 24 hours old, treat it as `abandoned` (update status, start fresh). Stale sessions should not silently resume days later.

---

## 10. GameShell UI — Layout B

```
┌─────────────────────────────────────┐
│ ← Word Builder          Round 2/5   │  top bar: back button, game title, round counter
├─────────────────────────────────────┤
│ ⭐ 3   ████░░░░░░   ⏱ 0:42          │  sub-bar: score, progress bar, timer (hideable)
├─────────────────────────────────────┤
│                                     │
│         [game component here]       │  game area: flex-1, max available height
│                                     │
├─────────────────────────────────────┤
│  ⟲ Undo        II Pause     ✕ Exit  │  footer: undo (hidden if maxUndoDepth=0)
└─────────────────────────────────────┘
```

**Undo button:** renders only when `maxUndoDepth !== 0` and `moves.length > 0`
**Timer:** hidden when `timerVisible: false` in `ResolvedGameConfig`
**Back / Exit:** both navigate to `/$locale/dashboard` after confirming end of session

---

## 11. Directory Structure

```
src/
  lib/
    game-engine/
      types.ts            ← all shared types
      replay.ts           ← replayToStep() pure fn
      lifecycle.ts        ← useGameLifecycle hook
      move-log.ts         ← useMoveLog hook (append-only + undo)
      session-recorder.ts ← useSessionRecorder hook (RxDB writes)
      config-loader.ts    ← loadGameConfig (override merging)
      index.ts            ← GameEngineProvider, useGameState, useGameDispatch
  components/
    game/
      GameShell.tsx       ← Layout B shell component
```

---

## 12. Existing Utilities to Reuse

| Utility                                   | Path                                      | Used By                                 |
| ----------------------------------------- | ----------------------------------------- | --------------------------------------- |
| `TypedGameEventBus` / `getGameEventBus()` | `src/lib/game-event-bus.ts`               | `useSessionRecorder` — emits `game:end` |
| `GameEvent` types, `GradeBand`            | `src/types/game-events.ts`                | `types.ts` imports `GradeBand`          |
| `useRxDB()`                               | `src/db/hooks/useRxDB.ts`                 | `useSessionRecorder` — RxDB access      |
| `session_history` schema                  | `src/db/schemas/session_history.ts`       | `useSessionRecorder`                    |
| `session_history_index` schema            | `src/db/schemas/session_history_index.ts` | `useSessionRecorder`                    |
| `game_config_overrides` schema            | `src/db/schemas/game_config_overrides.ts` | `loadGameConfig`                        |

---

## 13. Files to Create / Modify

### New (create)

- `src/lib/game-engine/types.ts`
- `src/lib/game-engine/replay.ts`
- `src/lib/game-engine/lifecycle.ts`
- `src/lib/game-engine/move-log.ts`
- `src/lib/game-engine/session-recorder.ts`
- `src/lib/game-engine/config-loader.ts`
- `src/lib/game-engine/index.ts`
- `src/components/game/GameShell.tsx`

### Modified

- `src/routes/$locale/_app/game/$gameId.tsx` — replace placeholder with real GameShell + loader; add resume logic in `loader`
- `src/types/game-events.ts` — verify `GameEventType` covers all move-triggered bus events
- `src/db/schemas/session_history_index.ts` — add `status: 'in-progress' | 'completed' | 'abandoned'` field + schema version bump

---

## 14. Testing Strategy

### Unit (Vitest)

- `replay.ts`: normal play, single undo, double undo, UNDO beyond log start, empty log
- `move-log.ts`: append, undo at depth 0/1/unlimited, depth limit enforcement
- `config-loader.ts`: all 4 priority levels, missing override cases, grade-band fallthrough
- `lifecycle.ts`: all 9 transitions, invalid transition guards

### Integration (Vitest + RTL)

- `GameEngineProvider`: renders game component, dispatches moves, state updates correctly
- `useSessionRecorder`: move log writes reach `session_history` in RxDB

### E2E (Playwright)

- Full game session: instructions → 3 rounds → game-over
- Undo during play: move log contains `UNDO` entries, state rolls back correctly
- Config override: `maxUndoDepth: 0` hides undo button; `timerVisible: false` hides timer
- Silent resume: play 2 rounds → simulate browser close (clear in-memory state) → reload game route → child lands on round 3 with correct score
- Stale resume: in-progress session older than 24 h → marked `abandoned`, fresh session starts

### Verification

```bash
yarn typecheck && yarn test && yarn build
```
