# Group F+G: WordSpell Click Bug + Game Instructions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the click-mode bug where tiles skip to the last slot when middle slots are empty; add a guard preventing `EJECT_TILE` from ejecting correctly-placed tiles; add an `InstructionsOverlay` shown before the first round that reads instructions aloud.

**Architecture:** Two reducer fixes: (1) `EJECT_TILE` checks `zone.isWrong` before ejecting — prevents ejecting a correctly-placed tile if a stale eject timer fires; (2) `useAutoNextSlot.placeInNextSlot` skips locked zones by scanning forward rather than blindly using `activeSlotIndex`. `InstructionsOverlay` is a full-screen overlay shown when a `showInstructions` flag is true; it has a "Let's go!" button and calls `speakPrompt` via TTS. Each game session starts with instructions shown.

**Tech Stack:** React 19, TypeScript strict, react-i18next, Vitest + React Testing Library

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/answer-game/answer-game-reducer.ts` | Modify | Guard EJECT_TILE: only eject if zone.isWrong; fix PLACE_TILE wrong branch for lock-manual |
| `src/components/answer-game/answer-game-reducer.test.ts` | Modify | Add tests for EJECT_TILE guard and lock-manual bank cleanup |
| `src/components/answer-game/useAutoNextSlot.ts` | Modify | Skip locked zones when finding target slot |
| `src/components/answer-game/useAutoNextSlot.test.tsx` | Modify | Add test for skipping locked zone |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` | Create | Full-screen overlay with instructions text + TTS + "Let's go!" button |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` | Create | Renders text, calls speakPrompt on mount, dismisses on button click |
| `src/games/word-spell/WordSpell/WordSpell.tsx` | Modify | Show InstructionsOverlay before first round |
| `src/games/number-match/NumberMatch/NumberMatch.tsx` | Modify | Same |
| `src/lib/i18n/locales/en/games.json` | Modify | Add instructions strings for word-spell and number-match |
| `src/lib/i18n/locales/pt-BR/games.json` | Modify | Same in Portuguese |

---

## Task 1: Fix EJECT_TILE reducer guard

**Files:**
- Modify: `src/components/answer-game/answer-game-reducer.ts`
- Modify: `src/components/answer-game/answer-game-reducer.test.ts`

- [ ] **Step 1: Write failing test**

  In `src/components/answer-game/answer-game-reducer.test.ts`, add:

  ```ts
  describe('EJECT_TILE', () => {
    it('does NOT eject a zone that is not wrong (correct tile placed after stale timer)', () => {
      const state = makeInitialState({
        gameId: 'test',
        inputMethod: 'drag',
        wrongTileBehavior: 'lock-auto-eject',
        tileBankMode: 'exact',
        totalRounds: 1,
        ttsEnabled: false,
      });
      // Zone 0 has a correctly placed tile (isWrong: false)
      const stateWithCorrectTile: AnswerGameState = {
        ...state,
        allTiles: [{ id: 't1', label: 'c', value: 'c' }],
        bankTileIds: [],
        zones: [
          {
            id: 'z0',
            index: 0,
            expectedValue: 'c',
            placedTileId: 't1',
            isWrong: false,
            isLocked: false,
          },
        ],
      };

      const result = answerGameReducer(stateWithCorrectTile, {
        type: 'EJECT_TILE',
        zoneIndex: 0,
      });

      // Tile should NOT be ejected
      expect(result.zones[0].placedTileId).toBe('t1');
      expect(result.bankTileIds).not.toContain('t1');
    });

    it('still ejects a zone that is wrong', () => {
      const state = makeInitialState({
        gameId: 'test',
        inputMethod: 'drag',
        wrongTileBehavior: 'lock-manual',
        tileBankMode: 'exact',
        totalRounds: 1,
        ttsEnabled: false,
      });
      const stateWithWrongTile: AnswerGameState = {
        ...state,
        allTiles: [{ id: 't1', label: 'a', value: 'a' }],
        bankTileIds: [],
        zones: [
          {
            id: 'z0',
            index: 0,
            expectedValue: 'c',
            placedTileId: 't1',
            isWrong: true,
            isLocked: true,
          },
        ],
      };

      const result = answerGameReducer(stateWithWrongTile, {
        type: 'EJECT_TILE',
        zoneIndex: 0,
      });

      expect(result.zones[0].placedTileId).toBeNull();
      expect(result.bankTileIds).toContain('t1');
    });
  });
  ```

  Run to confirm the first test FAILS:

  ```bash
  yarn test src/components/answer-game/answer-game-reducer.test.ts 2>&1 | tail -15
  ```

- [ ] **Step 2: Fix EJECT_TILE in reducer**

  In `src/components/answer-game/answer-game-reducer.ts`, update the `EJECT_TILE` case:

  ```ts
  case 'EJECT_TILE': {
    const zone = state.zones[action.zoneIndex];
    if (!zone) return state;

    // Only eject if the zone is actually in a wrong state.
    // This prevents a stale auto-eject timer from removing a correctly-placed tile.
    if (!zone.isWrong && !zone.isLocked) return state;

    if (zone.placedTileId) {
      return {
        ...state,
        zones: state.zones.map((z, i) =>
          i === action.zoneIndex
            ? {
                ...z,
                placedTileId: null,
                isWrong: false,
                isLocked: false,
              }
            : z,
        ),
        bankTileIds: [...state.bankTileIds, zone.placedTileId],
      };
    }

    return {
      ...state,
      zones: state.zones.map((z, i) =>
        i === action.zoneIndex
          ? { ...z, placedTileId: null, isWrong: false, isLocked: false }
          : z,
      ),
    };
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/answer-game-reducer.test.ts 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/answer-game-reducer.ts \
    src/components/answer-game/answer-game-reducer.test.ts
  git commit -m "fix(reducer): EJECT_TILE guard — never eject correctly-placed tiles"
  ```

---

## Task 2: Fix useAutoNextSlot to skip locked zones

**Files:**
- Modify: `src/components/answer-game/useAutoNextSlot.ts`
- Modify: `src/components/answer-game/useAutoNextSlot.test.tsx`

- [ ] **Step 1: Write failing test**

  In `src/components/answer-game/useAutoNextSlot.test.tsx`, add:

  ```tsx
  it('skips locked zones and places in the next available slot', () => {
    // Setup: activeSlotIndex = 0, zone 0 is locked (isLocked: true, placedTileId: null)
    // zone 1 is empty and unlocked
    // Calling placeInNextSlot should place in zone 1, not zone 0
    // ... (render hook with mock context providing the above state)
    // expect dispatch called with { type: 'PLACE_TILE', zoneIndex: 1 }
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/useAutoNextSlot.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Update `useAutoNextSlot.ts`**

  ```ts
  import { useCallback } from 'react';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import { useTileEvaluation } from './useTileEvaluation';

  export interface AutoNextSlot {
    placeInNextSlot: (tileId: string) => void;
  }

  export function useAutoNextSlot(): AutoNextSlot {
    const { activeSlotIndex, zones } = useAnswerGameContext();
    const { placeTile } = useTileEvaluation();

    const placeInNextSlot = useCallback(
      (tileId: string) => {
        // Find the first available slot: at or after activeSlotIndex,
        // not locked, not already correctly filled.
        const targetIndex = zones.findIndex(
          (z, i) =>
            i >= activeSlotIndex &&
            z.placedTileId === null &&
            !z.isLocked,
        );
        if (targetIndex === -1) return;
        placeTile(tileId, targetIndex);
      },
      [placeTile, activeSlotIndex, zones],
    );

    return { placeInNextSlot };
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useAutoNextSlot.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/useAutoNextSlot.ts \
    src/components/answer-game/useAutoNextSlot.test.tsx
  git commit -m "fix(wordspell): useAutoNextSlot skips locked zones to prevent slot-skip bug"
  ```

---

## Task 3: Add instructions strings to i18n

**Files:**
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Add instructions to `en/games.json`**

  ```json
  {
    "word-spell": "Word Spell",
    "number-match": "Number Match",
    "shell": {
      "round": "Round {{current}} / {{total}}",
      "undo": "Undo",
      "pause": "Pause",
      "exit": "Exit"
    },
    "instructions": {
      "word-spell": "Drag the letters into the boxes to spell the word. Tap the picture or the speaker to hear the word.",
      "number-match": "Drag the tiles to match each number. Tap the number to hear it.",
      "lets-go": "Let's go!"
    },
    "ui": {
      "choose-a-letter": "Choose a letter",
      "almost-try-again": "Almost! Try again.",
      "great-job": "Great job!",
      "hear-the-question": "Hear the question",
      "tap-to-hear": "tap to hear"
    }
  }
  ```

  Note: if Group E plan's `shell` keys are not yet added, add them here too.

- [ ] **Step 2: Add instructions to `pt-BR/games.json`**

  ```json
  {
    "word-spell": "Soletrar Palavras",
    "number-match": "Combinação de Números",
    "shell": {
      "round": "Rodada {{current}} / {{total}}",
      "undo": "Desfazer",
      "pause": "Pausar",
      "exit": "Sair"
    },
    "instructions": {
      "word-spell": "Arraste as letras para as caixas e forme a palavra. Toque na imagem ou no alto-falante para ouvir a palavra.",
      "number-match": "Arraste as peças para combinar cada número. Toque no número para ouvir.",
      "lets-go": "Vamos lá!"
    },
    "ui": {
      "choose-a-letter": "Escolha uma letra",
      "almost-try-again": "Quase! Tente de novo.",
      "great-job": "Muito bem!",
      "hear-the-question": "Ouvir a pergunta",
      "tap-to-hear": "toque para ouvir"
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
  git commit -m "feat(i18n): add instructions strings for word-spell and number-match"
  ```

---

## Task 4: Create InstructionsOverlay component

**Files:**
- Create: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Create: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

- [ ] **Step 1: Write failing tests**

  Create `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { describe, expect, it, vi } from 'vitest';
  import { InstructionsOverlay } from './InstructionsOverlay';

  describe('InstructionsOverlay', () => {
    it('renders instructions text', () => {
      render(
        <InstructionsOverlay
          text="Drag the letters to spell the word."
          onStart={vi.fn()}
          ttsEnabled={false}
        />,
      );
      expect(
        screen.getByText('Drag the letters to spell the word.'),
      ).toBeInTheDocument();
    });

    it('calls onStart when "Let\'s go!" button is clicked', async () => {
      const onStart = vi.fn();
      render(
        <InstructionsOverlay
          text="Instructions here."
          onStart={onStart}
          ttsEnabled={false}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: /let's go/i }));
      expect(onStart).toHaveBeenCalledOnce();
    });

    it('renders the "Let\'s go!" button', () => {
      render(
        <InstructionsOverlay
          text="Instructions."
          onStart={vi.fn()}
          ttsEnabled={false}
        />,
      );
      expect(screen.getByRole('button', { name: /let's go/i })).toBeInTheDocument();
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Create `InstructionsOverlay.tsx`**

  ```tsx
  import { useEffect } from 'react';
  import { useTranslation } from 'react-i18next';
  import { useGameTTS } from '@/components/answer-game/useGameTTS';

  interface InstructionsOverlayProps {
    text: string;
    onStart: () => void;
    ttsEnabled: boolean;
  }

  export const InstructionsOverlay = ({
    text,
    onStart,
    ttsEnabled,
  }: InstructionsOverlayProps) => {
    const { t } = useTranslation('games');
    const { speakPrompt } = useGameTTS();

    useEffect(() => {
      if (ttsEnabled) speakPrompt(text);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        role="dialog"
        aria-label="Game instructions"
        className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/95 px-6 text-center"
      >
        <span className="text-6xl" aria-hidden="true">
          🎮
        </span>
        <p className="max-w-sm text-lg font-medium text-foreground">
          {text}
        </p>
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-primary px-10 py-4 text-xl font-bold text-primary-foreground shadow-md active:scale-95"
        >
          {t('instructions.lets-go')}
        </button>
      </div>
    );
  };
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx \
    src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
  git commit -m "feat(instructions): add InstructionsOverlay component"
  ```

---

## Task 5: Add InstructionsOverlay to WordSpell + NumberMatch

**Files:**
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Add instructions state to `WordSpell`**

  In `src/games/word-spell/WordSpell/WordSpell.tsx`, at the top of `WordSpellSession`:

  ```tsx
  import { useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';

  const WordSpellSession = ({
    wordSpellConfig,
    roundOrder,
    onRestartSession,
  }: { ... }) => {
    const { phase, roundIndex, retryCount } = useAnswerGameContext();
    const dispatch = useAnswerGameDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation('games');
    const [showInstructions, setShowInstructions] = useState(true);
    const completionToken = useRef(0);

    // ... existing round resolution logic ...

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.word-spell')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={wordSpellConfig.ttsEnabled}
        />
      );
    }

    // ... existing return with AnswerGame.Question/Answer/Choices ...
  };
  ```

- [ ] **Step 2: Add instructions state to `NumberMatch`**

  Same pattern in `src/games/number-match/NumberMatch/NumberMatch.tsx`:

  ```tsx
  import { useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';

  const NumberMatchSession = (...) => {
    // ... existing hooks ...
    const { t } = useTranslation('games');
    const [showInstructions, setShowInstructions] = useState(true);

    // ... existing logic ...

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.number-match')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={numberMatchConfig.ttsEnabled}
        />
      );
    }

    // ... existing return ...
  };
  ```

- [ ] **Step 3: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test 2>&1 | tail -15
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/word-spell/WordSpell/WordSpell.tsx \
    src/games/number-match/NumberMatch/NumberMatch.tsx
  git commit -m "feat(instructions): show InstructionsOverlay at game start for both games"
  ```

---

## Task 6: Final verification

- [ ] **Step 1: Full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en/game/word-spell`:
  1. Instructions overlay appears first with "Drag the letters..." text
  2. TTS reads instruction aloud (if TTS enabled)
  3. Click "Let's go!" → overlay dismissed, game starts
  4. Place correct tile in slot 0, then quickly place another tile → second tile goes to slot 1 (not last slot)
  5. Place wrong tile → slot briefly shows wrong state → tile bounces back after 1s
  6. Immediately place correct tile in same slot → it stays (not ejected by stale timer)
