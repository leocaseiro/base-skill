# Group I: SortNumbers Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `SortNumbers` game — player arranges scrambled number tiles into ascending or descending order. Configurable range, skip-numbers toggle, quantity, and direction. Built on the `AnswerGame` primitive like WordSpell and NumberMatch.

**Architecture:** `SortNumbers` is a thin composition root over `AnswerGame`. It generates a set of number tiles from a range (optionally with gaps/skips), shuffles them, and creates ordered zones for ascending or descending sequences. `NumberSequenceSlots` (new) is the answer zone — same pattern as `OrderedLetterSlots` but renders numbers. `SortNumbersTileBank` (new) renders the scrambled number tiles. Config-to-tiles is handled by `buildSortRound.ts` (new).

**Tech Stack:** React 19, TypeScript strict, Pragmatic DnD (via AnswerGame), Tailwind CSS v4, Vitest + RTL

**Worktree:** `./worktrees/feat-word-spell-number-match`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/games/sort-numbers/types.ts` | Create | `SortNumbersConfig`, `SortNumbersRound` extending `AnswerGameConfig` |
| `src/games/sort-numbers/build-sort-round.ts` | Create | Generates tiles + zones for a round from config |
| `src/games/sort-numbers/build-sort-round.test.ts` | Create | Unit tests for ascending/descending/skip generation |
| `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx` | Create | Sequential ordered drop zones reading from AnswerGameContext |
| `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.test.tsx` | Create | Renders correct slot count, aria labels |
| `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` | Create | Draggable number tiles reading from AnswerGameContext |
| `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.test.tsx` | Create | Renders correct tiles, speaks on click |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` | Create | Composition root |
| `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx` | Create | Ascending, descending, with-skips stories |
| `src/games/registry.ts` | Modify | Add `sort-numbers` catalog entry |
| `src/routes/$locale/_app/game/$gameId.tsx` | Modify | Handle `gameId === 'sort-numbers'` in `GameBody` |
| `src/lib/i18n/locales/en/games.json` | Modify | Add `sort-numbers` title + instructions |
| `src/lib/i18n/locales/pt-BR/games.json` | Modify | Same in Portuguese |

---

## Task 1: Define SortNumbers types

**Files:**
- Create: `src/games/sort-numbers/types.ts`

- [ ] **Step 1: Create types file**

  ```ts
  // src/games/sort-numbers/types.ts
  import type { AnswerGameConfig } from '@/components/answer-game/types';

  export interface SortNumbersConfig extends AnswerGameConfig {
    component: 'SortNumbers';
    direction: 'ascending' | 'descending';
    range: { min: number; max: number };
    /** How many numbers to sort per round */
    quantity: number;
    /**
     * When true, the sequence may contain gaps (e.g. 2, 5, 8 instead of 2, 3, 4).
     * When false, numbers are always consecutive.
     */
    allowSkips: boolean;
    rounds: SortNumbersRound[];
  }

  export interface SortNumbersRound {
    /** The numbers in correct order for this round */
    sequence: number[];
  }
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/games/sort-numbers/types.ts
  git commit -m "feat(sort-numbers): add SortNumbersConfig types"
  ```

---

## Task 2: Build round generation logic

**Files:**
- Create: `src/games/sort-numbers/build-sort-round.ts`
- Create: `src/games/sort-numbers/build-sort-round.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `src/games/sort-numbers/build-sort-round.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { buildSortRound, generateSortRounds } from './build-sort-round';

  describe('buildSortRound', () => {
    it('creates zones in ascending order for ascending direction', () => {
      const { zones } = buildSortRound([3, 1, 2], 'ascending');
      expect(zones.map((z) => z.expectedValue)).toEqual(['1', '2', '3']);
    });

    it('creates zones in descending order for descending direction', () => {
      const { zones } = buildSortRound([3, 1, 2], 'descending');
      expect(zones.map((z) => z.expectedValue)).toEqual(['3', '2', '1']);
    });

    it('creates tiles shuffled (not in sorted order)', () => {
      // Tiles should contain all numbers but not necessarily sorted
      const { tiles } = buildSortRound([1, 2, 3], 'ascending');
      expect(tiles.map((t) => t.value).sort()).toEqual(['1', '2', '3']);
      expect(tiles).toHaveLength(3);
    });

    it('each tile has a unique id', () => {
      const { tiles } = buildSortRound([1, 2, 3], 'ascending');
      const ids = tiles.map((t) => t.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('generateSortRounds', () => {
    it('generates consecutive rounds without skips', () => {
      const rounds = generateSortRounds({
        range: { min: 1, max: 10 },
        quantity: 3,
        allowSkips: false,
        totalRounds: 2,
      });
      expect(rounds).toHaveLength(2);
      // Each round has 3 consecutive numbers
      for (const round of rounds) {
        expect(round.sequence).toHaveLength(3);
        const diffs = round.sequence
          .slice(1)
          .map((n, i) => n - round.sequence[i]);
        expect(diffs.every((d) => d === 1)).toBe(true);
      }
    });

    it('generates rounds with gaps when allowSkips is true', () => {
      const rounds = generateSortRounds({
        range: { min: 1, max: 20 },
        quantity: 4,
        allowSkips: true,
        totalRounds: 3,
      });
      expect(rounds).toHaveLength(3);
      for (const round of rounds) {
        expect(round.sequence).toHaveLength(4);
        // Numbers should be within range
        for (const n of round.sequence) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(20);
        }
      }
    });

    it('all numbers in a round are unique', () => {
      const rounds = generateSortRounds({
        range: { min: 1, max: 10 },
        quantity: 5,
        allowSkips: false,
        totalRounds: 1,
      });
      const seq = rounds[0].sequence;
      expect(new Set(seq).size).toBe(seq.length);
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/games/sort-numbers/build-sort-round.test.ts 2>&1 | tail -10
  ```

- [ ] **Step 2: Create `build-sort-round.ts`**

  ```ts
  // src/games/sort-numbers/build-sort-round.ts
  import { nanoid } from 'nanoid';
  import type { AnswerZone, TileItem } from '@/components/answer-game/types';
  import type { SortNumbersRound } from './types';

  export function buildSortRound(
    numbers: number[],
    direction: 'ascending' | 'descending',
  ): { tiles: TileItem[]; zones: AnswerZone[] } {
    const sorted = [...numbers].sort((a, b) =>
      direction === 'ascending' ? a - b : b - a,
    );

    const zones: AnswerZone[] = sorted.map((n, i) => ({
      id: `z${i}`,
      index: i,
      expectedValue: String(n),
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    }));

    // Shuffle the tiles (Fisher-Yates)
    const shuffled = [...numbers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }

    const tiles: TileItem[] = shuffled.map((n) => ({
      id: nanoid(),
      label: String(n),
      value: String(n),
    }));

    return { tiles, zones };
  }

  interface GenerateOptions {
    range: { min: number; max: number };
    quantity: number;
    allowSkips: boolean;
    totalRounds: number;
  }

  export function generateSortRounds(
    options: GenerateOptions,
  ): SortNumbersRound[] {
    const { range, quantity, allowSkips, totalRounds } = options;

    return Array.from({ length: totalRounds }, () => {
      if (allowSkips) {
        // Pick `quantity` unique random numbers from the range
        const pool = Array.from(
          { length: range.max - range.min + 1 },
          (_, i) => range.min + i,
        );
        const picked: number[] = [];
        const available = [...pool];
        for (let i = 0; i < quantity && available.length > 0; i++) {
          const idx = Math.floor(Math.random() * available.length);
          picked.push(available[idx]!);
          available.splice(idx, 1);
        }
        return { sequence: picked };
      }

      // Consecutive: pick a random start such that start + quantity - 1 <= max
      const maxStart = range.max - quantity + 1;
      const start =
        Math.floor(Math.random() * (maxStart - range.min + 1)) +
        range.min;
      const sequence = Array.from({ length: quantity }, (_, i) => start + i);
      return { sequence };
    });
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/games/sort-numbers/build-sort-round.test.ts 2>&1 | tail -10
  ```

  Expected: all PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/sort-numbers/build-sort-round.ts \
    src/games/sort-numbers/build-sort-round.test.ts
  git commit -m "feat(sort-numbers): add buildSortRound and generateSortRounds"
  ```

---

## Task 3: Create NumberSequenceSlots

**Files:**
- Create: `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx`
- Create: `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.test.tsx`

- [ ] **Step 1: Write failing tests**

  Create `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, expect, it } from 'vitest';
  import { NumberSequenceSlots } from './NumberSequenceSlots';
  // Wrap in a mock AnswerGameContext with 3 zones and no tiles placed

  describe('NumberSequenceSlots', () => {
    it('renders one slot per zone', () => {
      // render with 3 zones
      // expect 3 list items
    });

    it('shows placed tile label in slot', () => {
      // render with zone 0 having placedTileId = 't1', allTiles = [{id:'t1', label:'3'}]
      // expect '3' visible in slot 0
    });

    it('slot aria-label includes slot number', () => {
      // expect aria-label "Slot 1, empty" on first empty slot
    });
  });
  ```

  Run to confirm FAIL.

- [ ] **Step 2: Create `NumberSequenceSlots.tsx`**

  This is identical in structure to `OrderedLetterSlots` but styled for numbers:

  ```tsx
  import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import { useEffect, useRef } from 'react';
  import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
  import { useTileEvaluation } from '@/components/answer-game/useTileEvaluation';

  const NumberSlot = ({
    zoneIndex,
    label,
    isActive,
    isWrong,
  }: {
    zoneIndex: number;
    label: string | null;
    isActive: boolean;
    isWrong: boolean;
  }) => {
    const ref = useRef<HTMLLIElement>(null);
    const { placeTile } = useTileEvaluation();

    useEffect(() => {
      const element = ref.current;
      if (!element) return;
      return dropTargetForElements({
        element,
        getData: () => ({ zoneIndex }),
        onDrop: ({ source }) => {
          const tileId = source.data['tileId'];
          if (typeof tileId === 'string') placeTile(tileId, zoneIndex);
        },
      });
    }, [zoneIndex, placeTile]);

    const ariaLabel = label
      ? `Slot ${zoneIndex + 1}, filled with ${label}`
      : `Slot ${zoneIndex + 1}, empty`;

    return (
      <li
        ref={ref}
        aria-label={ariaLabel}
        data-active={isActive || undefined}
        data-wrong={isWrong || undefined}
        className={[
          'flex size-16 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all',
          'border-border',
          isActive && !label
            ? 'ring-2 ring-primary ring-offset-2 animate-pulse'
            : '',
          isWrong
            ? 'border-destructive bg-destructive/10 text-destructive'
            : '',
          label && !isWrong
            ? 'border-primary bg-primary/10 text-primary'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label ?? ''}
      </li>
    );
  };

  export const NumberSequenceSlots = () => {
    const { zones, activeSlotIndex, allTiles } = useAnswerGameContext();

    return (
      <ol
        aria-label="Number sequence slots"
        className="flex flex-wrap justify-center gap-3"
      >
        {zones.map((zone, i) => {
          const placedTile = zone.placedTileId
            ? allTiles.find((t) => t.id === zone.placedTileId)
            : null;
          return (
            <NumberSlot
              key={zone.id}
              zoneIndex={i}
              label={placedTile?.label ?? null}
              isActive={i === activeSlotIndex && zone.placedTileId === null}
              isWrong={zone.isWrong}
            />
          );
        })}
      </ol>
    );
  };
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/games/sort-numbers/NumberSequenceSlots/ 2>&1 | tail -10
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/sort-numbers/NumberSequenceSlots/
  git commit -m "feat(sort-numbers): add NumberSequenceSlots component"
  ```

---

## Task 4: Create SortNumbersTileBank

**Files:**
- Create: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`
- Create: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.test.tsx`

- [ ] **Step 1: Write failing tests**

  Create `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, expect, it } from 'vitest';
  import { SortNumbersTileBank } from './SortNumbersTileBank';

  describe('SortNumbersTileBank', () => {
    it('renders bank tiles', () => {
      // Mock context: allTiles = [{id:'t1', label:'3', value:'3'}, ...], bankTileIds = ['t1']
      // expect '3' to be visible
    });

    it('does not render placed tiles (not in bank)', () => {
      // bankTileIds = [] (tile placed)
      // expect '3' NOT visible
    });
  });
  ```

  Run to confirm FAIL.

- [ ] **Step 2: Create `SortNumbersTileBank.tsx`**

  ```tsx
  import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import { useEffect, useRef } from 'react';
  import type { TileItem } from '@/components/answer-game/types';
  import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
  import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
  import { useGameTTS } from '@/components/answer-game/useGameTTS';

  const NumberTile = ({ tile }: { tile: TileItem }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const { placeInNextSlot } = useAutoNextSlot();
    const { speakTile } = useGameTTS();
    const speakTileRef = useRef(speakTile);

    useEffect(() => {
      speakTileRef.current = speakTile;
    }, [speakTile]);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;
      return draggable({
        element,
        getInitialData: () => ({ tileId: tile.id }),
        onDragStart: () => speakTileRef.current(tile.label),
      });
    }, [tile.id, tile.label]);

    const handleClick = () => {
      speakTile(tile.label);
      placeInNextSlot(tile.id);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Number ${tile.label}`}
        className="flex size-16 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
        onClick={handleClick}
      >
        {tile.label}
      </button>
    );
  };

  export const SortNumbersTileBank = () => {
    const { allTiles, bankTileIds } = useAnswerGameContext();
    const bankTiles = allTiles.filter((t) => bankTileIds.includes(t.id));

    return (
      <div className="flex flex-wrap justify-center gap-3">
        {bankTiles.map((tile) => (
          <NumberTile key={tile.id} tile={tile} />
        ))}
      </div>
    );
  };
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/games/sort-numbers/SortNumbersTileBank/ 2>&1 | tail -10
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/sort-numbers/SortNumbersTileBank/
  git commit -m "feat(sort-numbers): add SortNumbersTileBank component"
  ```

---

## Task 5: Create SortNumbers composition root

**Files:**
- Create: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Create `SortNumbers.tsx`**

  ```tsx
  import { useNavigate, useParams } from '@tanstack/react-router';
  import { useEffect, useMemo, useRef, useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { buildSortRound } from '../build-sort-round';
  import { NumberSequenceSlots } from '../NumberSequenceSlots/NumberSequenceSlots';
  import { SortNumbersTileBank } from '../SortNumbersTileBank/SortNumbersTileBank';
  import type { SortNumbersConfig } from '../types';
  import type {
    AnswerGameConfig,
    AnswerZone,
    TileItem,
  } from '@/components/answer-game/types';
  import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
  import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
  import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';
  import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
  import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
  import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
  import { useGameSounds } from '@/components/answer-game/useGameSounds';
  import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
  import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
  import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';
  import { buildRoundOrder } from '@/games/build-round-order';

  interface SortNumbersProps {
    config: SortNumbersConfig;
  }

  const SortNumbersSession = ({
    sortConfig,
    roundOrder,
    onRestartSession,
  }: {
    sortConfig: SortNumbersConfig;
    roundOrder: readonly number[];
    onRestartSession: () => void;
  }) => {
    const { phase, roundIndex, retryCount } = useAnswerGameContext();
    const dispatch = useAnswerGameDispatch();
    const navigate = useNavigate();
    const { locale } = useParams({ from: '/$locale' });
    const { t } = useTranslation('games');
    const [showInstructions, setShowInstructions] = useState(true);
    const completionToken = useRef(0);

    const configRoundIndex = roundOrder[roundIndex];
    const round =
      configRoundIndex === undefined
        ? undefined
        : sortConfig.rounds[configRoundIndex];

    // Auto-speak the sequence description
    const promptText = round
      ? t('sort-numbers.arrange', {
          direction: sortConfig.direction,
          count: round.sequence.length,
        })
      : '';
    useRoundTTS(promptText);
    useGameSounds();

    const handleHome = () => {
      void navigate({ to: '/$locale', params: { locale } });
    };

    useEffect(() => {
      if (phase !== 'round-complete') return;
      const token = ++completionToken.current;
      const timer = globalThis.setTimeout(() => {
        if (completionToken.current !== token) return;
        const isLastRound = roundIndex >= roundOrder.length - 1;
        if (isLastRound) {
          dispatch({ type: 'COMPLETE_GAME' });
          return;
        }
        const nextConfigIndex = roundOrder[roundIndex + 1];
        const nextRound =
          nextConfigIndex === undefined
            ? undefined
            : sortConfig.rounds[nextConfigIndex];
        if (!nextRound) {
          dispatch({ type: 'COMPLETE_GAME' });
          return;
        }
        const { tiles, zones } = buildSortRound(
          nextRound.sequence,
          sortConfig.direction,
        );
        dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
      }, 750);
      return () => globalThis.clearTimeout(timer);
    }, [phase, roundIndex, dispatch, roundOrder, sortConfig]);

    if (!round) return null;

    if (showInstructions) {
      return (
        <InstructionsOverlay
          text={t('instructions.sort-numbers')}
          onStart={() => setShowInstructions(false)}
          ttsEnabled={sortConfig.ttsEnabled}
        />
      );
    }

    return (
      <>
        <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
          <AnswerGame.Question>
            <TextQuestion
              text={
                sortConfig.direction === 'ascending'
                  ? t('sort-numbers.ascending-label')
                  : t('sort-numbers.descending-label')
              }
            />
            <AudioButton prompt={promptText} />
          </AnswerGame.Question>
          <AnswerGame.Answer>
            <NumberSequenceSlots />
          </AnswerGame.Answer>
          <AnswerGame.Choices>
            <SortNumbersTileBank />
          </AnswerGame.Choices>
        </div>
        <ScoreAnimation visible={phase === 'round-complete'} />
        {phase === 'game-over' ? (
          <GameOverOverlay
            retryCount={retryCount}
            onPlayAgain={onRestartSession}
            onHome={handleHome}
          />
        ) : null}
      </>
    );
  };

  export const SortNumbers = ({ config }: SortNumbersProps) => {
    const roundsInOrder = config.roundsInOrder === true;
    const [sessionEpoch, setSessionEpoch] = useState(0);

    const roundOrder = useMemo(() => {
      void sessionEpoch;
      return buildRoundOrder(config.rounds.length, roundsInOrder);
    }, [config.rounds.length, roundsInOrder, sessionEpoch]);

    const firstConfigIndex = roundOrder[0];
    const round0 =
      firstConfigIndex === undefined
        ? undefined
        : config.rounds[firstConfigIndex];

    const { tiles, zones } = useMemo((): {
      tiles: TileItem[];
      zones: AnswerZone[];
    } => {
      if (!round0) return { tiles: [], zones: [] };
      return buildSortRound(round0.sequence, config.direction);
    }, [round0, config.direction]);

    const answerGameConfig = useMemo(
      (): AnswerGameConfig => ({
        gameId: config.gameId,
        inputMethod: config.inputMethod,
        wrongTileBehavior: config.wrongTileBehavior,
        tileBankMode: config.tileBankMode,
        distractorCount: config.distractorCount,
        totalRounds: config.rounds.length,
        roundsInOrder: config.roundsInOrder,
        ttsEnabled: config.ttsEnabled,
        initialTiles: tiles,
        initialZones: zones,
      }),
      [config, tiles, zones],
    );

    if (!round0) return null;

    return (
      <AnswerGame config={answerGameConfig}>
        <SortNumbersSession
          sortConfig={config}
          roundOrder={roundOrder}
          onRestartSession={() => setSessionEpoch((e) => e + 1)}
        />
      </AnswerGame>
    );
  };
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
  git commit -m "feat(sort-numbers): add SortNumbers composition root"
  ```

---

## Task 6: Add i18n strings for SortNumbers

**Files:**
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Add to `en/games.json`**

  Add under `instructions`:

  ```json
  "instructions": {
    "word-spell": "Drag the letters into the boxes to spell the word. Tap the picture or the speaker to hear the word.",
    "number-match": "Drag the tiles to match each number. Tap the number to hear it.",
    "sort-numbers": "Put the numbers in order! Drag each number to the right place.",
    "lets-go": "Let's go!"
  },
  "sort-numbers": "Sort Numbers",
  "sort-numbers": {
    "ascending-label": "Smallest → Biggest",
    "descending-label": "Biggest → Smallest",
    "arrange": "Put {{count}} numbers in {{direction}} order"
  }
  ```

  Note: merge the top-level `sort-numbers` key with the object. Final `en/games.json` structure:

  ```json
  {
    "word-spell": "Word Spell",
    "number-match": "Number Match",
    "sort-numbers": "Sort Numbers",
    "shell": {
      "round": "Round {{current}} / {{total}}",
      "undo": "Undo",
      "pause": "Pause",
      "exit": "Exit"
    },
    "instructions": {
      "word-spell": "Drag the letters into the boxes to spell the word. Tap the picture or the speaker to hear the word.",
      "number-match": "Drag the tiles to match each number. Tap the number to hear it.",
      "sort-numbers": "Put the numbers in order! Drag each number to the right place.",
      "lets-go": "Let's go!"
    },
    "sort-numbers-ui": {
      "ascending-label": "Smallest → Biggest",
      "descending-label": "Biggest → Smallest",
      "arrange": "Put {{count}} numbers in {{direction}} order"
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

  Update `SortNumbers.tsx` to use `t('sort-numbers-ui.ascending-label')` etc.

- [ ] **Step 2: Add to `pt-BR/games.json`**

  ```json
  "sort-numbers": "Ordenar Números",
  "sort-numbers-ui": {
    "ascending-label": "Menor → Maior",
    "descending-label": "Maior → Menor",
    "arrange": "Coloque {{count}} números em ordem {{direction}}"
  },
  "instructions": {
    "sort-numbers": "Coloque os números em ordem! Arraste cada número para o lugar certo."
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
  git commit -m "feat(i18n): add SortNumbers translation strings"
  ```

---

## Task 7: Register SortNumbers in catalog + game route

**Files:**
- Modify: `src/games/registry.ts`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Add to registry**

  In `src/games/registry.ts`:

  ```ts
  export const GAME_CATALOG: GameCatalogEntry[] = [
    {
      id: 'word-spell',
      titleKey: 'word-spell',
      levels: ['PK', 'K', '1'],
      subject: 'reading',
    },
    {
      id: 'number-match',
      titleKey: 'number-match',
      levels: ['1', '2'],
      subject: 'math',
    },
    {
      id: 'sort-numbers',
      titleKey: 'sort-numbers',
      levels: ['K', '1', '2'],
      subject: 'math',
    },
  ];
  ```

- [ ] **Step 2: Handle sort-numbers in GameBody**

  In `src/routes/$locale/_app/game/$gameId.tsx`, add a default config and import:

  ```tsx
  import { SortNumbers } from '@/games/sort-numbers/SortNumbers/SortNumbers';
  import { generateSortRounds } from '@/games/sort-numbers/build-sort-round';
  import type { SortNumbersConfig } from '@/games/sort-numbers/types';

  const makeDefaultSortNumbersConfig = (): SortNumbersConfig => ({
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    roundsInOrder: false,
    ttsEnabled: true,
    direction: 'ascending',
    range: { min: 1, max: 20 },
    quantity: 4,
    allowSkips: false,
    rounds: generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 4,
      allowSkips: false,
      totalRounds: 3,
    }),
  });
  ```

  In `GameBody`, add:

  ```tsx
  const [sortNumbersConfig, setSortNumbersConfig] =
    useState<SortNumbersConfig>(makeDefaultSortNumbersConfig);

  if (gameId === 'sort-numbers') {
    return (
      <>
        {import.meta.env.DEV && (
          <SortNumbersConfigPanel
            config={sortNumbersConfig}
            onChange={setSortNumbersConfig}
          />
        )}
        <SortNumbers config={sortNumbersConfig} />
      </>
    );
  }
  ```

  Add a minimal `SortNumbersConfigPanel`:

  ```tsx
  const SortNumbersConfigPanel = ({
    config,
    onChange,
  }: {
    config: SortNumbersConfig;
    onChange: (c: SortNumbersConfig) => void;
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <details
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="fixed right-4 top-20 z-50 w-72 rounded-lg border bg-background p-3 text-sm shadow-lg"
      >
        <summary className="cursor-pointer font-medium">⚙️ SortNumbers Config</summary>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            Direction
            <select
              value={config.direction}
              onChange={(e) =>
                onChange({ ...config, direction: e.target.value as SortNumbersConfig['direction'] })
              }
              className="rounded border px-2 py-1"
            >
              <option value="ascending">ascending</option>
              <option value="descending">descending</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Quantity per round
            <input
              type="number" min={2} max={10}
              value={config.quantity}
              onChange={(e) => onChange({ ...config, quantity: Number(e.target.value) })}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Range min
            <input
              type="number" min={0} max={50}
              value={config.range.min}
              onChange={(e) => onChange({ ...config, range: { ...config.range, min: Number(e.target.value) } })}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Range max
            <input
              type="number" min={1} max={100}
              value={config.range.max}
              onChange={(e) => onChange({ ...config, range: { ...config.range, max: Number(e.target.value) } })}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.allowSkips}
              onChange={(e) => onChange({ ...config, allowSkips: e.target.checked })}
            />
            Allow gaps/skips
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.ttsEnabled}
              onChange={(e) => onChange({ ...config, ttsEnabled: e.target.checked })}
            />
            TTS enabled
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                rounds: generateSortRounds({
                  range: config.range,
                  quantity: config.quantity,
                  allowSkips: config.allowSkips,
                  totalRounds: config.totalRounds,
                }),
              })
            }
            className="rounded bg-primary px-3 py-1 text-primary-foreground"
          >
            Regenerate rounds
          </button>
        </div>
      </details>
    );
  };
  ```

- [ ] **Step 3: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test 2>&1 | tail -15
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/registry.ts "src/routes/\$locale/_app/game/\$gameId.tsx" \
    src/games/sort-numbers/
  git commit -m "feat(sort-numbers): register game in catalog and game route"
  ```

---

## Task 8: Final verification

- [ ] **Step 1: Full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`, navigate to `/en`:
  1. "Sort Numbers" appears in catalog grid
  2. Click to play → instructions overlay shows
  3. Click "Let's go!" → 4 scrambled number tiles appear with 4 empty slots
  4. Drag tiles into slots in ascending order → slots highlight correctly
  5. Wrong tile → bounces back → correct tile → placed
  6. Complete all 3 rounds → confetti rain + game-over overlay
  7. Open ⚙️ Config panel → switch direction to "descending" → new round generates with reversed expected order
  8. Enable "Allow gaps" + Regenerate → tiles have non-consecutive numbers
