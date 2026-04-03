# Group C: Progress Bar + Confetti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the disconnected round progress bar so it advances as the player completes rounds; replace the CSS-dot `ScoreAnimation` with `canvas-confetti` (short burst per round, long rain on game end).

**Architecture:** Add a `GameRoundContext` (new) that `AnswerGameProvider` writes to whenever `roundIndex` or `totalRounds` changes. `GameShell` reads from `GameRoundContext` first and falls back to `GameEngineProvider` state, requiring no changes to `WordSpell` or `NumberMatch`. Replace `ScoreAnimation` with a `useConfetti` hook that fires `canvas-confetti` when its `active` prop becomes true. `GameOverOverlay` fires a long confetti rain on mount.

**Tech Stack:** React 19, TypeScript strict, `canvas-confetti`, Vitest + React Testing Library

**Install:** `yarn add canvas-confetti && yarn add -D @types/canvas-confetti`

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/game-engine/GameRoundContext.tsx` | Create | Context + hook for round progress override |
| `src/components/answer-game/AnswerGameProvider.tsx` | Modify | Populate `GameRoundContext` with current round/total |
| `src/components/game/GameShell.tsx` | Modify | Read `GameRoundContext` with fallback to GameEngine state |
| `src/components/answer-game/ScoreAnimation/ScoreAnimation.tsx` | Modify | Replace CSS dots with `canvas-confetti` short burst |
| `src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx` | Create | Verify confetti fires when visible changes to true |
| `src/components/answer-game/GameOverOverlay/GameOverOverlay.tsx` | Modify | Fire long confetti rain on mount |

---

## Task 1: Install canvas-confetti

- [ ] **Step 1: Install**

  ```bash
  yarn add canvas-confetti && yarn add -D @types/canvas-confetti
  ```

  Expected: no errors.

- [ ] **Step 2: Commit lock file**

  ```bash
  git add package.json yarn.lock
  git commit -m "chore: add canvas-confetti dependency"
  ```

---

## Task 2: Create GameRoundContext

**Files:**
- Create: `src/lib/game-engine/GameRoundContext.tsx`

- [ ] **Step 1: Create the context file**

  ```tsx
  // src/lib/game-engine/GameRoundContext.tsx
  import { createContext, useContext } from 'react';

  export interface GameRoundProgress {
    current: number; // 1-based
    total: number;
  }

  export const GameRoundContext =
    createContext<GameRoundProgress | null>(null);

  /** Returns override from AnswerGame if present; null otherwise. */
  export function useGameRoundProgress(): GameRoundProgress | null {
    return useContext(GameRoundContext);
  }
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/game-engine/GameRoundContext.tsx
  git commit -m "feat(progress): add GameRoundContext for round progress override"
  ```

---

## Task 3: Populate GameRoundContext in AnswerGameProvider

**Files:**
- Modify: `src/components/answer-game/AnswerGameProvider.tsx`

- [ ] **Step 1: Update AnswerGameProvider**

  Open `src/components/answer-game/AnswerGameProvider.tsx`. Add the import and wrap children:

  ```tsx
  import { createContext, useEffect, useReducer } from 'react';
  import { GameRoundContext } from '@/lib/game-engine/GameRoundContext';
  import {
    answerGameReducer,
    makeInitialState,
  } from './answer-game-reducer';
  import type {
    AnswerGameAction,
    AnswerGameConfig,
    AnswerGameState,
  } from './types';
  import type { Dispatch, ReactNode } from 'react';

  export const AnswerGameStateContext =
    createContext<AnswerGameState | null>(null);
  export const AnswerGameDispatchContext =
    createContext<Dispatch<AnswerGameAction> | null>(null);

  interface AnswerGameProviderProps {
    config: AnswerGameConfig;
    children: ReactNode;
  }

  export const AnswerGameProvider = ({
    config,
    children,
  }: AnswerGameProviderProps) => {
    const [state, dispatch] = useReducer(
      answerGameReducer,
      config,
      makeInitialState,
    );

    useEffect(() => {
      const tiles = config.initialTiles;
      const zones = config.initialZones;
      if (tiles?.length && zones?.length) {
        dispatch({ type: 'INIT_ROUND', tiles, zones });
      }
    }, [config.gameId, config.initialTiles, config.initialZones]);

    const roundProgress = {
      current: state.roundIndex + 1,
      total: config.totalRounds,
    };

    return (
      <GameRoundContext.Provider value={roundProgress}>
        <AnswerGameStateContext.Provider value={state}>
          <AnswerGameDispatchContext.Provider value={dispatch}>
            {children}
          </AnswerGameDispatchContext.Provider>
        </AnswerGameStateContext.Provider>
      </GameRoundContext.Provider>
    );
  };
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/answer-game/AnswerGameProvider.tsx
  git commit -m "feat(progress): AnswerGameProvider populates GameRoundContext"
  ```

---

## Task 4: GameShell reads GameRoundContext

**Files:**
- Modify: `src/components/game/GameShell.tsx`

- [ ] **Step 1: Update GameShellChrome to use GameRoundContext**

  In `src/components/game/GameShell.tsx`, add import and use the context:

  ```tsx
  import { useGameRoundProgress } from '@/lib/game-engine/GameRoundContext';
  ```

  Inside `GameShellChrome`, replace:

  ```tsx
  // BEFORE
  const roundDisplay = state.roundIndex + 1;
  // ...
  <span className="text-sm font-medium">
    Round {roundDisplay} / {config.maxRounds}
  </span>
  // ...
  <div
    className="h-full rounded-full bg-primary transition-all"
    style={{
      width: `${Math.round((roundDisplay / config.maxRounds) * 100)}%`,
    }}
  />
  ```

  ```tsx
  // AFTER
  const roundOverride = useGameRoundProgress();
  const roundCurrent = roundOverride?.current ?? state.roundIndex + 1;
  const roundTotal = roundOverride?.total ?? config.maxRounds;
  // ...
  <span className="text-sm font-medium">
    {t('shell.round', { current: roundCurrent, total: roundTotal })}
  </span>
  // ...
  <div
    className="h-full rounded-full bg-primary transition-all"
    style={{
      width: `${Math.round((roundCurrent / roundTotal) * 100)}%`,
    }}
  />
  ```

  Note: `t('shell.round', ...)` requires the games i18n keys from the Group E plan. If Group E is not yet merged, use a fallback: `` `Round ${roundCurrent} / ${roundTotal}` ``.

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5
  yarn test src/components/game/GameShell.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/game/GameShell.tsx
  git commit -m "fix(progress): GameShell reads GameRoundContext for live round progress"
  ```

---

## Task 5: Replace ScoreAnimation with canvas-confetti burst

**Files:**
- Modify: `src/components/answer-game/ScoreAnimation/ScoreAnimation.tsx`
- Create: `src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx`

- [ ] **Step 1: Write failing test**

  Create `src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx`:

  ```tsx
  import { render } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';
  import { ScoreAnimation } from './ScoreAnimation';

  vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
  }));

  describe('ScoreAnimation', () => {
    it('fires confetti when visible becomes true', async () => {
      const confetti = (await import('canvas-confetti')).default;
      const { rerender } = render(<ScoreAnimation visible={false} />);
      expect(confetti).not.toHaveBeenCalled();

      rerender(<ScoreAnimation visible={true} />);
      expect(confetti).toHaveBeenCalled();
    });

    it('does not fire confetti on re-render when already visible', async () => {
      const confetti = (await import('canvas-confetti')).default as ReturnType<typeof vi.fn>;
      confetti.mockClear();
      render(<ScoreAnimation visible={true} />);
      const callCount = confetti.mock.calls.length;
      // re-render with same visible=true
      expect(confetti.mock.calls.length).toBe(callCount);
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Rewrite `ScoreAnimation.tsx`**

  ```tsx
  import confetti from 'canvas-confetti';
  import { useEffect, useRef } from 'react';

  interface ScoreAnimationProps {
    visible: boolean;
  }

  export const ScoreAnimation = ({ visible }: ScoreAnimationProps) => {
    const prevRef = useRef(false);

    useEffect(() => {
      if (visible && !prevRef.current) {
        void confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          ticks: 80,
        });
      }
      prevRef.current = visible;
    }, [visible]);

    if (!visible) return null;

    return (
      <div
        aria-live="polite"
        aria-label="Round complete!"
        className="pointer-events-none fixed inset-0"
      />
    );
  };
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/ScoreAnimation/ScoreAnimation.tsx \
    src/components/answer-game/ScoreAnimation/ScoreAnimation.test.tsx
  git commit -m "feat(confetti): replace CSS ScoreAnimation with canvas-confetti burst"
  ```

---

## Task 6: Long confetti rain in GameOverOverlay

**Files:**
- Modify: `src/components/answer-game/GameOverOverlay/GameOverOverlay.tsx`

- [ ] **Step 1: Add confetti rain on mount**

  Open `src/components/answer-game/GameOverOverlay/GameOverOverlay.tsx`. Add:

  ```tsx
  import confetti from 'canvas-confetti';
  import { useEffect } from 'react';

  // Inside GameOverOverlay, add this effect before the return:
  useEffect(() => {
    const duration = 12_000;
    const end = Date.now() + duration;

    const frame = () => {
      void confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      void confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);

    return () => {
      // No cleanup needed — animation stops when end time passes
    };
  }, []);
  ```

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/answer-game/GameOverOverlay/GameOverOverlay.tsx
  git commit -m "feat(confetti): add 12-second confetti rain to GameOverOverlay"
  ```

---

## Task 7: Final verification

- [ ] **Step 1: Full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en/game/word-spell`:
  1. Play through round 1 → progress bar moves from ~33% to ~66%
  2. Round complete → short confetti burst appears on screen for ~1-2s
  3. Complete all 3 rounds → long confetti rain from both sides for ~12s
  4. Progress bar shows 100% at game over
