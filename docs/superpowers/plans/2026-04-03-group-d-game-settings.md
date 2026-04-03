# Group D: Game Settings & Type Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `inputMethod: 'type'` work (keyboard input mode); add a collapsible in-game settings panel at the game route to configure per-game options (distractors, inputMethod, range, totalRounds, etc.) live in the browser.

**Architecture:** `useKeyboardInput` (new) listens to `keypress` events globally when `config.inputMethod === 'type'`, finds the matching bank tile, and dispatches `PLACE_TILE`. `LetterTileBank` hides tiles in type mode (the keyboard is the input). A `GameConfigPanel` component in the game route (`$gameId.tsx`) holds local state for config overrides and passes them down, replacing the hardcoded `WORD_SPELL_ROUTE_CONFIG` / `NUMBER_MATCH_ROUTE_CONFIG` with state. The panel is gated behind `import.meta.env.DEV` so it never appears in production.

**Tech Stack:** React 19, TypeScript strict, Vitest + React Testing Library

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/answer-game/useKeyboardInput.ts` | Create | Listens to keypress; finds matching bank tile; dispatches PLACE_TILE |
| `src/components/answer-game/useKeyboardInput.test.tsx` | Create | Fires on keypress with correct tile; no-op in drag mode; no-op when no match |
| `src/components/answer-game/AnswerGameProvider.tsx` | Modify | Compose `useKeyboardInput` inside provider |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx` | Modify | Hide tiles when `inputMethod === 'type'`; show keyboard hint |
| `src/routes/$locale/_app/game/$gameId.tsx` | Modify | Replace hardcoded configs with `useState`; add `GameConfigPanel` (dev only) |

---

## Task 1: Create useKeyboardInput hook

**Files:**
- Create: `src/components/answer-game/useKeyboardInput.ts`
- Create: `src/components/answer-game/useKeyboardInput.test.tsx`

- [ ] **Step 1: Write failing tests**

  Create `src/components/answer-game/useKeyboardInput.test.tsx`:

  ```tsx
  import { fireEvent } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';

  // These tests need a wrapper that provides AnswerGameContext.
  // Use a helper that renders the hook inside a mock AnswerGameProvider.

  describe('useKeyboardInput', () => {
    it('dispatches PLACE_TILE for the matching bank tile when a key is pressed in type mode', () => {
      // Setup: zones = [expectedValue:'c'], bankTiles = [{id:'t1', value:'c', label:'C'}]
      // config.inputMethod = 'type', activeSlotIndex = 0
      // Press 'c' key
      // Expect dispatch called with { type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 }
    });

    it('does nothing when config.inputMethod is not "type"', () => {
      // config.inputMethod = 'drag'
      // Press 'c' key
      // Expect dispatch NOT called
    });

    it('does nothing when no bank tile matches the pressed key', () => {
      // bankTiles has no tile with value 'x'
      // Press 'x'
      // Expect dispatch NOT called
    });

    it('is case-insensitive — pressing uppercase key finds lowercase tile', () => {
      // bankTiles = [{value: 'c'}], press 'C' (shift held)
      // Expect dispatch called
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/useKeyboardInput.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Create `src/components/answer-game/useKeyboardInput.ts`**

  ```ts
  import { useEffect } from 'react';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import { useAnswerGameDispatch } from './useAnswerGameDispatch';

  export function useKeyboardInput(): void {
    const state = useAnswerGameContext();
    const dispatch = useAnswerGameDispatch();

    useEffect(() => {
      if (state.config.inputMethod !== 'type') return;

      const handleKeyPress = (event: KeyboardEvent) => {
        // Ignore if focus is on an input/textarea (user typing elsewhere)
        const tag = (event.target as HTMLElement).tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        const char = event.key.toLowerCase();
        if (char.length !== 1) return;

        const matchingTile = state.allTiles.find(
          (t) =>
            state.bankTileIds.includes(t.id) &&
            t.value.toLowerCase() === char,
        );
        if (!matchingTile) return;

        dispatch({
          type: 'PLACE_TILE',
          tileId: matchingTile.id,
          zoneIndex: state.activeSlotIndex,
        });
      };

      window.addEventListener('keypress', handleKeyPress);
      return () => window.removeEventListener('keypress', handleKeyPress);
    }, [
      state.config.inputMethod,
      state.allTiles,
      state.bankTileIds,
      state.activeSlotIndex,
      dispatch,
    ]);
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useKeyboardInput.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/useKeyboardInput.ts \
    src/components/answer-game/useKeyboardInput.test.tsx
  git commit -m "feat(type-mode): add useKeyboardInput hook for keyboard tile placement"
  ```

---

## Task 2: Compose useKeyboardInput in AnswerGameProvider

**Files:**
- Modify: `src/components/answer-game/AnswerGameProvider.tsx`

- [ ] **Step 1: Add useKeyboardInput to provider**

  `useKeyboardInput` needs context, so it must be called by a component inside the provider tree. Create an inner component `KeyboardInputAdapter`:

  ```tsx
  import { useKeyboardInput } from './useKeyboardInput';

  const KeyboardInputAdapter = () => {
    useKeyboardInput();
    return null;
  };

  // Inside AnswerGameProvider's return, add after dispatch context:
  export const AnswerGameProvider = (...) => {
    // ... existing code

    return (
      <GameRoundContext.Provider value={roundProgress}>
        <AnswerGameStateContext.Provider value={state}>
          <AnswerGameDispatchContext.Provider value={dispatch}>
            <KeyboardInputAdapter />
            {children}
          </AnswerGameDispatchContext.Provider>
        </AnswerGameStateContext.Provider>
      </GameRoundContext.Provider>
    );
  };
  ```

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test src/components/answer-game/ 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/answer-game/AnswerGameProvider.tsx
  git commit -m "feat(type-mode): compose useKeyboardInput inside AnswerGameProvider"
  ```

---

## Task 3: Hide LetterTileBank in type mode + show hint

**Files:**
- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`

- [ ] **Step 1: Update LetterTileBank to handle type mode**

  In `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`, read `inputMethod` from config and render a keyboard hint instead of tiles:

  ```tsx
  export const LetterTileBank = () => {
    const { allTiles, bankTileIds, config } = useAnswerGameContext();

    if (config.inputMethod === 'type') {
      return (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          ⌨️ Type the letters on your keyboard
        </p>
      );
    }

    const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

    return (
      <div className="flex flex-wrap justify-center gap-3">
        {bankTiles.map((tile) => (
          <LetterTile key={tile.id} tile={tile} />
        ))}
      </div>
    );
  };
  ```

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test src/games/word-spell/ 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/games/word-spell/LetterTileBank/LetterTileBank.tsx
  git commit -m "feat(type-mode): hide LetterTileBank and show keyboard hint in type mode"
  ```

---

## Task 4: Add GameConfigPanel (dev-only) to game route

**Files:**
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Replace hardcoded configs with useState**

  In `src/routes/$locale/_app/game/$gameId.tsx`, change `GameBody` to accept mutable configs and add a dev-only panel.

  The full updated `GameBody` and surrounding code:

  ```tsx
  import { useState } from 'react';
  import type { NumberMatchConfig } from '@/games/number-match/types';
  import type { WordSpellConfig } from '@/games/word-spell/types';

  const DEFAULT_WORD_SPELL_CONFIG: WordSpellConfig = {
    gameId: 'word-spell',
    component: 'WordSpell',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    roundsInOrder: false,
    ttsEnabled: true,
    mode: 'picture',
    tileUnit: 'letter',
    rounds: [
      { word: 'cat', emoji: '🐱' },
      { word: 'dog', emoji: '🐶' },
      { word: 'sun', emoji: '☀️' },
      { word: 'pin', emoji: '📌' },
      { word: 'sad', emoji: '☹️' },
      { word: 'ant', emoji: '🐜' },
      { word: 'can', emoji: '🥫' },
      { word: 'mum', emoji: '🤱' },
    ],
  };

  const NUMBER_MATCH_RANGE = { min: 1, max: 12 } as const;

  const generateRandomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const generateXRounds = (min: number, max: number, x: number): number[] =>
    Array.from({ length: x }, () => generateRandomNumber(min, max));

  const makeDefaultNumberMatchConfig = (): NumberMatchConfig => ({
    gameId: 'number-match',
    component: 'NumberMatch',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'distractors',
    distractorCount: 5,
    totalRounds: 3,
    roundsInOrder: false,
    ttsEnabled: true,
    mode: 'numeral-to-group',
    tileStyle: 'dots',
    range: { min: NUMBER_MATCH_RANGE.min, max: NUMBER_MATCH_RANGE.max },
    rounds: generateXRounds(NUMBER_MATCH_RANGE.min, NUMBER_MATCH_RANGE.max, 3).map(
      (value) => ({ value }),
    ),
  });
  ```

  Then replace `GameBody` with a stateful version:

  ```tsx
  const GameBody = ({ gameId }: { gameId: string }): JSX.Element => {
    const [wordSpellConfig, setWordSpellConfig] = useState<WordSpellConfig>(
      DEFAULT_WORD_SPELL_CONFIG,
    );
    const [numberMatchConfig, setNumberMatchConfig] =
      useState<NumberMatchConfig>(makeDefaultNumberMatchConfig);

    if (gameId === 'word-spell') {
      return (
        <>
          {import.meta.env.DEV && (
            <WordSpellConfigPanel
              config={wordSpellConfig}
              onChange={setWordSpellConfig}
            />
          )}
          <WordSpell config={wordSpellConfig} />
        </>
      );
    }
    if (gameId === 'number-match') {
      return (
        <>
          {import.meta.env.DEV && (
            <NumberMatchConfigPanel
              config={numberMatchConfig}
              onChange={setNumberMatchConfig}
            />
          )}
          <NumberMatch config={numberMatchConfig} />
        </>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Game component placeholder — real game in M5</p>
      </div>
    );
  };
  ```

- [ ] **Step 2: Add WordSpellConfigPanel component**

  Add this component to the same file (above `GameBody`):

  ```tsx
  const WordSpellConfigPanel = ({
    config,
    onChange,
  }: {
    config: WordSpellConfig;
    onChange: (c: WordSpellConfig) => void;
  }) => {
    const [open, setOpen] = useState(false);

    return (
      <details
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
      >
        <summary className="cursor-pointer font-medium">⚙️ Game Config</summary>
        <div className="mt-3 flex flex-col gap-3">

          <label className="flex flex-col gap-1">
            Input method
            <select
              value={config.inputMethod}
              onChange={(e) =>
                onChange({ ...config, inputMethod: e.target.value as WordSpellConfig['inputMethod'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="drag">drag</option>
              <option value="type">type</option>
              <option value="both">both</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            Mode
            <select
              value={config.mode}
              onChange={(e) =>
                onChange({ ...config, mode: e.target.value as WordSpellConfig['mode'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="picture">picture</option>
              <option value="scramble">scramble</option>
              <option value="recall">recall</option>
              <option value="sentence-gap">sentence-gap</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            Tile bank
            <select
              value={config.tileBankMode}
              onChange={(e) =>
                onChange({ ...config, tileBankMode: e.target.value as WordSpellConfig['tileBankMode'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="exact">exact</option>
              <option value="distractors">distractors</option>
            </select>
          </label>

          {config.tileBankMode === 'distractors' && (
            <label className="flex flex-col gap-1">
              Distractor count
              <input
                type="number"
                min={1}
                max={8}
                value={config.distractorCount ?? 3}
                onChange={(e) =>
                  onChange({ ...config, distractorCount: Number(e.target.value) })
                }
                className="rounded border px-2 py-1"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            Wrong tile behaviour
            <select
              value={config.wrongTileBehavior}
              onChange={(e) =>
                onChange({ ...config, wrongTileBehavior: e.target.value as WordSpellConfig['wrongTileBehavior'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="reject">reject</option>
              <option value="lock-manual">lock-manual</option>
              <option value="lock-auto-eject">lock-auto-eject</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.ttsEnabled}
              onChange={(e) => onChange({ ...config, ttsEnabled: e.target.checked })}
            />
            TTS enabled
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.roundsInOrder ?? false}
              onChange={(e) => onChange({ ...config, roundsInOrder: e.target.checked })}
            />
            Rounds in order
          </label>

        </div>
      </details>
    );
  };
  ```

- [ ] **Step 3: Add NumberMatchConfigPanel component**

  Add above `GameBody`:

  ```tsx
  const NumberMatchConfigPanel = ({
    config,
    onChange,
  }: {
    config: NumberMatchConfig;
    onChange: (c: NumberMatchConfig) => void;
  }) => {
    const [open, setOpen] = useState(false);

    return (
      <details
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
      >
        <summary className="cursor-pointer font-medium">⚙️ Game Config</summary>
        <div className="mt-3 flex flex-col gap-3">

          <label className="flex flex-col gap-1">
            Mode
            <select
              value={config.mode}
              onChange={(e) =>
                onChange({ ...config, mode: e.target.value as NumberMatchConfig['mode'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="numeral-to-group">numeral-to-group</option>
              <option value="group-to-numeral">group-to-numeral</option>
              <option value="numeral-to-word">numeral-to-word</option>
              <option value="word-to-numeral">word-to-numeral</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            Tile style
            <select
              value={config.tileStyle}
              onChange={(e) =>
                onChange({ ...config, tileStyle: e.target.value as NumberMatchConfig['tileStyle'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="dots">dots</option>
              <option value="objects">objects</option>
              <option value="fingers">fingers</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            Range min
            <input
              type="number"
              min={0}
              max={20}
              value={config.range.min}
              onChange={(e) =>
                onChange({ ...config, range: { ...config.range, min: Number(e.target.value) } })
              }
              className="rounded border px-2 py-1"
            />
          </label>

          <label className="flex flex-col gap-1">
            Range max
            <input
              type="number"
              min={1}
              max={20}
              value={config.range.max}
              onChange={(e) =>
                onChange({ ...config, range: { ...config.range, max: Number(e.target.value) } })
              }
              className="rounded border px-2 py-1"
            />
          </label>

          <label className="flex flex-col gap-1">
            Tile bank
            <select
              value={config.tileBankMode}
              onChange={(e) =>
                onChange({ ...config, tileBankMode: e.target.value as NumberMatchConfig['tileBankMode'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="exact">exact</option>
              <option value="distractors">distractors</option>
            </select>
          </label>

          {config.tileBankMode === 'distractors' && (
            <label className="flex flex-col gap-1">
              Distractor count
              <input
                type="number"
                min={1}
                max={8}
                value={config.distractorCount ?? 3}
                onChange={(e) =>
                  onChange({ ...config, distractorCount: Number(e.target.value) })
                }
                className="rounded border px-2 py-1"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            Wrong tile behaviour
            <select
              value={config.wrongTileBehavior}
              onChange={(e) =>
                onChange({ ...config, wrongTileBehavior: e.target.value as NumberMatchConfig['wrongTileBehavior'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="reject">reject</option>
              <option value="lock-manual">lock-manual</option>
              <option value="lock-auto-eject">lock-auto-eject</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.ttsEnabled}
              onChange={(e) => onChange({ ...config, ttsEnabled: e.target.checked })}
            />
            TTS enabled
          </label>

        </div>
      </details>
    );
  };
  ```

- [ ] **Step 4: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add "src/routes/\$locale/_app/game/\$gameId.tsx"
  git commit -m "feat(dev): add per-game config panel (dev only) to game route"
  ```

---

## Task 5: Final verification

- [ ] **Step 1: Run full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en/game/word-spell`:
  1. Click "⚙️ Game Config" panel (visible in dev mode) → change Input method to "type"
  2. Game re-renders → tile bank replaced with "⌨️ Type the letters on your keyboard"
  3. Type 'c', 'a', 't' on keyboard → letters fill into slots sequentially
  4. Correct slots → word completes, round advances
  5. Change Input method back to "drag" → tiles reappear
  6. Navigate to `/en/game/number-match` → config panel shows NumberMatch options
