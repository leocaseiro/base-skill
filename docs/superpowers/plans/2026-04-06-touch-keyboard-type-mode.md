# Touch Keyboard for Type Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix type mode on touch devices by focusing a hidden native `<input>` when a slot is tapped, triggering the device keyboard, and capturing typed characters via the `input` event.

**Architecture:** A `TouchKeyboardContext` provides `focusKeyboard` to slot components. `AnswerGameProvider` conditionally renders either a `TouchKeyboardAdapter` (touch) or the existing `KeyboardInputAdapter` (desktop). Slot components are consolidated into a shared `OrderedSlots` component that handles both the tap-to-focus and scroll-into-view behaviours once.

**Tech Stack:** React, TypeScript, Vitest + @testing-library/react, TailwindCSS, @atlaskit/pragmatic-drag-and-drop

---

## File Map

| File                                                                 | Action                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/components/answer-game/types.ts`                                | Add `touchKeyboardInputMode` to `AnswerGameConfig`            |
| `src/components/answer-game/useKeyboardInput.ts`                     | Update `HTMLInputElement` guard for `data-touch-keyboard`     |
| `src/components/answer-game/useKeyboardInput.test.tsx`               | Add guard test                                                |
| `src/components/answer-game/TouchKeyboardContext.ts`                 | **New** — context providing `focusKeyboard \| null`           |
| `src/components/answer-game/useTouchKeyboardInput.ts`                | **New** — hook: hidden input ref + `input`-event → PLACE_TILE |
| `src/components/answer-game/useTouchKeyboardInput.test.tsx`          | **New**                                                       |
| `src/components/answer-game/HiddenKeyboardInput.tsx`                 | **New** — the off-screen `<input>` element                    |
| `src/components/answer-game/AnswerGameProvider.tsx`                  | Conditionally render touch vs desktop adapter                 |
| `src/components/answer-game/AnswerGameProvider.test.tsx`             | Add touch-path test                                           |
| `src/components/answer-game/OrderedSlots/OrderedSlots.tsx`           | **New** — shared `AnswerSlot` + `OrderedSlots`                |
| `src/components/answer-game/OrderedSlots/OrderedSlots.test.tsx`      | **New**                                                       |
| `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx`     | Re-export `OrderedSlots`                                      |
| `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx` | Re-export `OrderedSlots`                                      |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`             | Update type-mode hint for touch vs desktop                    |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                       | Pass `touchKeyboardInputMode: 'text'`                         |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`                 | Pass `touchKeyboardInputMode: 'numeric'`                      |

---

## Task 1 — Worktree Setup

- [ ] **Create worktree and install deps**

```bash
git worktree add ./worktrees/feat/touch-keyboard -b feat/touch-keyboard
cd ./worktrees/feat/touch-keyboard && yarn install
```

---

## Task 2 — Add `touchKeyboardInputMode` to `AnswerGameConfig`

**Files:**

- Modify: `src/components/answer-game/types.ts`

- [ ] **Open `src/components/answer-game/types.ts` and add the field after `ttsEnabled`**

```ts
export interface AnswerGameConfig {
  gameId: string;
  /** @default 'drag' */
  inputMethod: 'drag' | 'type' | 'both';
  /** @default 'lock-auto-eject' */
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  tileBankMode: 'exact' | 'distractors';
  distractorCount?: number;
  totalRounds: number;
  roundsInOrder?: boolean;
  ttsEnabled: boolean;
  /**
   * Controls the OS keyboard type shown on touch devices in type/both mode.
   * @default 'text'
   */
  touchKeyboardInputMode?: 'text' | 'numeric' | 'none';
  initialTiles?: TileItem[];
  initialZones?: AnswerZone[];
}
```

- [ ] **Run the full test suite to verify no regressions**

```bash
yarn test
```

Expected: all existing tests pass (field is optional, no consumers need updating yet).

- [ ] **Commit**

```bash
git add src/components/answer-game/types.ts
git commit -m "feat(types): add touchKeyboardInputMode to AnswerGameConfig"
```

---

## Task 3 — Update `useKeyboardInput` Guard

**Files:**

- Modify: `src/components/answer-game/useKeyboardInput.ts`
- Modify: `src/components/answer-game/useKeyboardInput.test.tsx`

- [ ] **Write the failing test** — add to the `describe` block in `useKeyboardInput.test.tsx`:

```ts
it('fires when target is the data-touch-keyboard input', () => {
  const { unmount } = renderHook(() => useKeyboardInput(), {
    wrapper: makeWrapper('type'),
  });

  const fakeInput = document.createElement('input');
  fakeInput.dataset['touchKeyboard'] = 'true';

  act(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'c',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: fakeInput });
    globalThis.dispatchEvent(event);
  });

  expect(mockDispatch).toHaveBeenCalledWith({
    type: 'PLACE_TILE',
    tileId: 't1',
    zoneIndex: 0,
  });

  unmount();
});
```

- [ ] **Run to verify it fails**

```bash
yarn test src/components/answer-game/useKeyboardInput.test.tsx
```

Expected: FAIL — the guard currently returns early for all `HTMLInputElement` targets.

- [ ] **Update the guard in `useKeyboardInput.ts`** — change the two guard lines:

```ts
// before
if (event.target instanceof HTMLInputElement) return;
if (event.target instanceof HTMLTextAreaElement) return;

// after
if (
  event.target instanceof HTMLInputElement &&
  !(event.target as HTMLInputElement).dataset['touchKeyboard']
)
  return;
if (event.target instanceof HTMLTextAreaElement) return;
```

- [ ] **Run tests to verify they pass**

```bash
yarn test src/components/answer-game/useKeyboardInput.test.tsx
```

Expected: 5 tests pass.

- [ ] **Commit**

```bash
git add src/components/answer-game/useKeyboardInput.ts \
        src/components/answer-game/useKeyboardInput.test.tsx
git commit -m "fix: allow data-touch-keyboard input through useKeyboardInput guard"
```

---

## Task 4 — Create `TouchKeyboardContext`

**Files:**

- Create: `src/components/answer-game/TouchKeyboardContext.ts`

- [ ] **Create the file**

```ts
import { createContext, useContext } from 'react';

export const TouchKeyboardContext = createContext<(() => void) | null>(
  null,
);

export const useTouchKeyboard = (): (() => void) | null =>
  useContext(TouchKeyboardContext);
```

- [ ] **Run the full test suite to verify no regressions**

```bash
yarn test
```

- [ ] **Commit**

```bash
git add src/components/answer-game/TouchKeyboardContext.ts
git commit -m "feat: add TouchKeyboardContext for slot-tap → keyboard focus"
```

---

## Task 5 — Create `useTouchKeyboardInput`

**Files:**

- Create: `src/components/answer-game/useTouchKeyboardInput.ts`
- Create: `src/components/answer-game/useTouchKeyboardInput.test.tsx`

- [ ] **Create the test file**

```tsx
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTouchKeyboardInput } from './useTouchKeyboardInput';
import { AnswerGameProvider } from './AnswerGameProvider';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const mockDispatch = vi.fn();

vi.mock('./useAnswerGameDispatch', () => ({
  useAnswerGameDispatch: () => mockDispatch,
}));

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'c' },
  { id: 't2', label: 'A', value: 'a' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'a',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'type',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: tiles,
  initialZones: zones,
};

// Renders the hook and a real <input> connected to the ref so we can fire input events.
const TestHarness = () => {
  const { hiddenInputRef } = useTouchKeyboardInput();
  return <input ref={hiddenInputRef} data-testid="hidden" />;
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
);

describe('useTouchKeyboardInput', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dispatches PLACE_TILE when a matching key is typed into the hidden input', () => {
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId('hidden') as HTMLInputElement;

    fireEvent.input(input, {
      target: { value: 'c' },
      nativeEvent: { data: 'c' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });

  it('clears the input value after each key', () => {
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId('hidden') as HTMLInputElement;

    fireEvent.input(input, {
      target: { value: 'c' },
      nativeEvent: { data: 'c' },
    });

    expect(input.value).toBe('');
  });

  it('does nothing when no bank tile matches the typed character', () => {
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId('hidden') as HTMLInputElement;

    fireEvent.input(input, {
      target: { value: 'z' },
      nativeEvent: { data: 'z' },
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('is case-insensitive — uppercase input matches lowercase tile value', () => {
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId('hidden') as HTMLInputElement;

    fireEvent.input(input, {
      target: { value: 'C' },
      nativeEvent: { data: 'C' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });
});
```

- [ ] **Run to verify it fails**

```bash
yarn test src/components/answer-game/useTouchKeyboardInput.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Create `useTouchKeyboardInput.ts`**

```ts
import { useCallback, useEffect, useRef } from 'react';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import type { RefObject } from 'react';

export interface TouchKeyboardInput {
  hiddenInputRef: RefObject<HTMLInputElement | null>;
  focusKeyboard: () => void;
}

export const useTouchKeyboardInput = (): TouchKeyboardInput => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const state = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  useEffect(() => {
    const input = hiddenInputRef.current;
    if (!input) return;

    const handleInput = (event: Event) => {
      const data = (event as InputEvent).data?.toLowerCase();
      if (!data) return;

      const matchingTile = state.allTiles.find(
        (t) =>
          state.bankTileIds.includes(t.id) &&
          t.value.toLowerCase() === data,
      );

      if (matchingTile) {
        dispatch({
          type: 'PLACE_TILE',
          tileId: matchingTile.id,
          zoneIndex: state.activeSlotIndex,
        });
      }

      input.value = '';
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [
    state.allTiles,
    state.bankTileIds,
    state.activeSlotIndex,
    dispatch,
  ]);

  const focusKeyboard = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  return { hiddenInputRef, focusKeyboard };
};
```

- [ ] **Run tests to verify they pass**

```bash
yarn test src/components/answer-game/useTouchKeyboardInput.test.tsx
```

Expected: 4 tests pass.

- [ ] **Commit**

```bash
git add src/components/answer-game/useTouchKeyboardInput.ts \
        src/components/answer-game/useTouchKeyboardInput.test.tsx
git commit -m "feat: add useTouchKeyboardInput hook for touch keyboard capture"
```

---

## Task 6 — Create `HiddenKeyboardInput`

**Files:**

- Create: `src/components/answer-game/HiddenKeyboardInput.tsx`

No dedicated test — the component is a thin wrapper with no logic; it's exercised by `AnswerGameProvider` tests in Task 7.

- [ ] **Create the file**

```tsx
import type { RefObject } from 'react';
import type { AnswerGameConfig } from './types';

interface HiddenKeyboardInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  inputMode: NonNullable<AnswerGameConfig['touchKeyboardInputMode']>;
}

export const HiddenKeyboardInput = ({
  inputRef,
  inputMode,
}: HiddenKeyboardInputProps) => (
  <input
    ref={inputRef}
    type="text"
    inputMode={inputMode}
    data-touch-keyboard="true"
    aria-hidden="true"
    tabIndex={-1}
    style={{
      position: 'absolute',
      opacity: 0,
      pointerEvents: 'none',
      width: 1,
      height: 1,
      top: 0,
      left: 0,
    }}
  />
);
```

- [ ] **Run the full test suite**

```bash
yarn test
```

- [ ] **Commit**

```bash
git add src/components/answer-game/HiddenKeyboardInput.tsx
git commit -m "feat: add HiddenKeyboardInput component for touch keyboard trigger"
```

---

## Task 7 — Modify `AnswerGameProvider`

**Files:**

- Modify: `src/components/answer-game/AnswerGameProvider.tsx`
- Modify: `src/components/answer-game/AnswerGameProvider.test.tsx`

- [ ] **Add a new test** at the bottom of the `describe` block in `AnswerGameProvider.test.tsx`

This verifies the `TouchKeyboardContext` value is `null` on non-touch (the default JSDOM environment has `navigator.maxTouchPoints === 0`):

```tsx
it('provides null TouchKeyboardContext on non-touch devices', () => {
  const FocusReader = () => {
    const focusKeyboard = useTouchKeyboard();
    return (
      <div data-testid="has-focus">
        {focusKeyboard === null ? 'null' : 'fn'}
      </div>
    );
  };

  render(
    <AnswerGameProvider config={{ ...gameConfig, inputMethod: 'type' }}>
      <FocusReader />
    </AnswerGameProvider>,
  );

  expect(screen.getByTestId('has-focus')).toHaveTextContent('null');
});
```

Add the import for `useTouchKeyboard` at the top of the test file:

```ts
import { useTouchKeyboard } from './TouchKeyboardContext';
```

- [ ] **Run to verify it fails**

```bash
yarn test src/components/answer-game/AnswerGameProvider.test.tsx
```

Expected: FAIL — `useTouchKeyboard` import fails (context not used in provider yet, but import should resolve).

Actually if the context file exists, the import will succeed and the test will pass trivially. Run it to see the current state.

- [ ] **Replace `AnswerGameProvider.tsx` with the updated version**

```tsx
import { createContext, useEffect, useReducer } from 'react';
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
  AnswerGameState,
} from './types';
import type { Dispatch, ReactNode } from 'react';
import { GameRoundContext } from '@/lib/game-engine/GameRoundContext';

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

- [ ] **Run all provider tests**

```bash
yarn test src/components/answer-game/AnswerGameProvider.test.tsx
```

Expected: 5 tests pass.

- [ ] **Run full suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/components/answer-game/AnswerGameProvider.tsx \
        src/components/answer-game/AnswerGameProvider.test.tsx
git commit -m "feat: wire TouchKeyboardAdapter into AnswerGameProvider"
```

---

## Task 8 — Create Shared `OrderedSlots`

**Files:**

- Create: `src/components/answer-game/OrderedSlots/OrderedSlots.tsx`
- Create: `src/components/answer-game/OrderedSlots/OrderedSlots.test.tsx`

- [ ] **Create the test file**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderedSlots } from './OrderedSlots';
import { TouchKeyboardContext } from '@/components/answer-game/TouchKeyboardContext';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'c', value: 'c' },
  { id: 't2', label: 'a', value: 'a' },
  { id: 't3', label: 't', value: 't' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'a',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 't',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const Initialiser = ({ children }: { children: ReactNode }) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('OrderedSlots', () => {
  it('renders one slot per zone', () => {
    render(<OrderedSlots />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('slot 1 has aria-label "Slot 1, empty"', () => {
    render(<OrderedSlots />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    ).toBeInTheDocument();
  });

  it('filled slot shows placed tile label', () => {
    const TestWithPlacement = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <OrderedSlots />;
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlacement />
      </AnswerGameProvider>,
    );
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, filled with c' }),
    ).toBeInTheDocument();
  });

  it('tapping an empty slot calls focusKeyboard from context', async () => {
    const user = userEvent.setup();
    const focusKeyboard = vi.fn();

    render(
      <AnswerGameProvider config={config}>
        <Initialiser>
          <TouchKeyboardContext.Provider value={focusKeyboard}>
            <OrderedSlots />
          </TouchKeyboardContext.Provider>
        </Initialiser>
      </AnswerGameProvider>,
    );

    await user.click(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    );
    expect(focusKeyboard).toHaveBeenCalledOnce();
  });

  it('tapping a filled slot does not call focusKeyboard', async () => {
    const user = userEvent.setup();
    const focusKeyboard = vi.fn();

    const TestWithFilled = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return (
        <TouchKeyboardContext.Provider value={focusKeyboard}>
          <OrderedSlots />
        </TouchKeyboardContext.Provider>
      );
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithFilled />
      </AnswerGameProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Slot 1, filled with c' }),
    );
    expect(focusKeyboard).not.toHaveBeenCalled();
  });
});
```

- [ ] **Run to verify it fails**

```bash
yarn test src/components/answer-game/OrderedSlots/OrderedSlots.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Create `OrderedSlots/OrderedSlots.tsx`**

```tsx
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef } from 'react';
import { useTouchKeyboard } from '../TouchKeyboardContext';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { useSlotTileDrag } from '../useSlotTileDrag';
import { useTileEvaluation } from '../useTileEvaluation';

const AnswerSlot = ({
  zoneIndex,
  tileId,
  label,
  isActive,
  isWrong,
}: {
  zoneIndex: number;
  tileId: string | null;
  label: string | null;
  isActive: boolean;
  isWrong: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { placeTile } = useTileEvaluation();
  const dispatch = useAnswerGameDispatch();
  const focusKeyboard = useTouchKeyboard();

  // Drop target for HTML5 DnD (bank tiles dragged in via desktop)
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      getData: () => ({ zoneIndex }),
      onDrop: ({ source }) => {
        const sourceTileId = source.data['tileId'];
        if (typeof sourceTileId === 'string')
          placeTile(sourceTileId, zoneIndex);
      },
    });
  }, [zoneIndex, placeTile]);

  // Drag source for placed tiles — touch drag & HTML5 DnD
  const {
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useSlotTileDrag({
    tileId,
    label,
    zoneIndex,
    onDrop: (droppedTileId, targetZoneIndex) =>
      placeTile(droppedTileId, targetZoneIndex),
  });

  // Scroll active slot into view when the native keyboard is open
  useEffect(() => {
    if (!isActive || !focusKeyboard) return;
    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardOpen = window.innerHeight - vv.height > 150;
      if (keyboardOpen) {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };
    window.visualViewport?.addEventListener(
      'resize',
      handleViewportResize,
    );
    return () =>
      window.visualViewport?.removeEventListener(
        'resize',
        handleViewportResize,
      );
  }, [isActive, focusKeyboard]);

  const ariaLabel = label
    ? `Slot ${zoneIndex + 1}, filled with ${label}`
    : `Slot ${zoneIndex + 1}, empty`;

  const handleClick = () => {
    if (tileId) {
      dispatch({ type: 'REMOVE_TILE', zoneIndex });
    } else {
      focusKeyboard?.();
    }
  };

  return (
    <li
      ref={ref}
      aria-label={ariaLabel}
      data-zone-index={zoneIndex}
      data-active={isActive || undefined}
      data-wrong={isWrong || undefined}
      onClick={handleClick}
      className={[
        'flex size-14 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all',
        'border-border',
        isActive && !label
          ? 'animate-pulse ring-2 ring-primary ring-offset-2'
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
      {label ? (
        <button
          ref={dragRef}
          type="button"
          aria-label={ariaLabel}
          className="flex size-full touch-none select-none cursor-grab items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {label}
        </button>
      ) : null}
    </li>
  );
};

export const OrderedSlots = () => {
  const { zones, activeSlotIndex, allTiles } = useAnswerGameContext();

  return (
    <ol
      aria-label="Answer slots"
      className="flex flex-wrap justify-center gap-2"
    >
      {zones.map((zone, i) => {
        const placedTile = zone.placedTileId
          ? allTiles.find((t) => t.id === zone.placedTileId)
          : null;
        return (
          <AnswerSlot
            key={zone.id}
            zoneIndex={i}
            tileId={zone.placedTileId}
            label={placedTile?.label ?? null}
            isActive={
              i === activeSlotIndex && zone.placedTileId === null
            }
            isWrong={zone.isWrong}
          />
        );
      })}
    </ol>
  );
};
```

- [ ] **Run the new tests**

```bash
yarn test src/components/answer-game/OrderedSlots/OrderedSlots.test.tsx
```

Expected: 5 tests pass.

- [ ] **Run full suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/components/answer-game/OrderedSlots/
git commit -m "feat: add shared OrderedSlots component with touch keyboard slot-tap"
```

---

## Task 9 — Update `OrderedLetterSlots` to Re-export

**Files:**

- Modify: `src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx`

The existing tests in `OrderedLetterSlots.test.tsx` still import from `./OrderedLetterSlots` — they will continue to pass through the re-export.

- [ ] **Replace the entire file content**

```tsx
export { OrderedSlots as OrderedLetterSlots } from '@/components/answer-game/OrderedSlots/OrderedSlots';
```

- [ ] **Run the existing slot tests to verify they still pass through the re-export**

```bash
yarn test src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.test.tsx
```

Expected: 3 tests pass.

- [ ] **Commit**

```bash
git add src/games/word-spell/OrderedLetterSlots/OrderedLetterSlots.tsx
git commit -m "refactor: OrderedLetterSlots is now a thin re-export of shared OrderedSlots"
```

---

## Task 10 — Update `NumberSequenceSlots` to Re-export

**Files:**

- Modify: `src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx`

- [ ] **Replace the entire file content**

```tsx
export { OrderedSlots as NumberSequenceSlots } from '@/components/answer-game/OrderedSlots/OrderedSlots';
```

- [ ] **Run the existing slot tests**

```bash
yarn test src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.test.tsx
```

Expected: 3 tests pass.

- [ ] **Run full suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/games/sort-numbers/NumberSequenceSlots/NumberSequenceSlots.tsx
git commit -m "refactor: NumberSequenceSlots is now a thin re-export of shared OrderedSlots"
```

---

## Task 11 — Update `LetterTileBank` Hint Text

**Files:**

- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`

- [ ] **Update the type-mode branch** — replace the entire `if (config.inputMethod === 'type')` block:

```tsx
if (config.inputMethod === 'type') {
  const isTouch = navigator.maxTouchPoints > 0;
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {isTouch
        ? 'Tap a slot to type'
        : '⌨️ Type the letters on your keyboard'}
    </p>
  );
}
```

- [ ] **Run the existing tile bank tests**

```bash
yarn test src/games/word-spell/LetterTileBank/LetterTileBank.test.tsx
```

Expected: all existing tests pass (they use `inputMethod: 'drag'`, so this branch isn't hit).

- [ ] **Run full suite**

```bash
yarn test
```

- [ ] **Commit**

```bash
git add src/games/word-spell/LetterTileBank/LetterTileBank.tsx
git commit -m "fix: show 'Tap a slot to type' hint on touch devices in type mode"
```

---

## Task 12 — Pass `touchKeyboardInputMode` from Games

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (line ~216 — the `answerGameConfig` useMemo)
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` (line ~160 — the `answerGameConfig` useMemo)

- [ ] **Update `WordSpell.tsx`** — add `touchKeyboardInputMode` to the `answerGameConfig` object and its dependency array:

```tsx
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
    touchKeyboardInputMode: 'text',
    initialTiles: tiles,
    initialZones: zones,
  }),
  [
    config.gameId,
    config.inputMethod,
    config.wrongTileBehavior,
    config.tileBankMode,
    config.distractorCount,
    config.rounds.length,
    config.roundsInOrder,
    config.ttsEnabled,
    tiles,
    zones,
  ],
);
```

- [ ] **Update `SortNumbers.tsx`** — add `touchKeyboardInputMode` to the `answerGameConfig` object (dependency array unchanged — `'numeric'` is a constant):

```tsx
const answerGameConfig = useMemo(
  (): AnswerGameConfig => ({
    gameId: config.gameId,
    inputMethod: config.inputMethod,
    wrongTileBehavior: config.wrongTileBehavior,
    tileBankMode: config.tileBankMode,
    totalRounds: config.rounds.length,
    roundsInOrder: config.roundsInOrder,
    ttsEnabled: config.ttsEnabled,
    touchKeyboardInputMode: 'numeric',
    initialTiles: tiles,
    initialZones: zones,
  }),
  [
    config.gameId,
    config.inputMethod,
    config.wrongTileBehavior,
    config.tileBankMode,
    config.rounds.length,
    config.roundsInOrder,
    config.ttsEnabled,
    tiles,
    zones,
  ],
);
```

- [ ] **Run game tests**

```bash
yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx
yarn test src/games/sort-numbers/SortNumbers/SortNumbers.tsx
```

Expected: all pass.

- [ ] **Run full suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx \
        src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat: pass touchKeyboardInputMode to AnswerGame from WordSpell and SortNumbers"
```

---

## Task 13 — TypeCheck + Lint + Final Verification

- [ ] **TypeScript**

```bash
yarn typecheck
```

Expected: no errors.

- [ ] **Lint**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Full test suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Open a PR** — do not push directly to master

```bash
SKIP_E2E=1 SKIP_VR=1 SKIP_STORYBOOK=1 git push -u origin feat/touch-keyboard
```

Then open a PR from `feat/touch-keyboard` → `master`. Title: `fix: touch keyboard for type mode on touch devices`.

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement                                                         | Covered by                                                                                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Touch detection via `navigator.maxTouchPoints > 0`                       | Task 7 (`AnswerGameProvider`) + Task 11 (`LetterTileBank`)                                                                              |
| Hidden `<input>` with `data-touch-keyboard`                              | Task 6 (`HiddenKeyboardInput`)                                                                                                          |
| `input` event capture → `PLACE_TILE` dispatch                            | Task 5 (`useTouchKeyboardInput`)                                                                                                        |
| Slot tap → `focusKeyboard()` (sync)                                      | Task 8 (`OrderedSlots` `handleClick`)                                                                                                   |
| Auto-advance keeps keyboard open                                         | Inherent — `HiddenKeyboardInput` stays mounted and focused                                                                              |
| `visualViewport` scroll when keyboard opens                              | Task 8 (`AnswerSlot` `useEffect`)                                                                                                       |
| `useKeyboardInput` guard update                                          | Task 3                                                                                                                                  |
| `TouchKeyboardContext`                                                   | Task 4                                                                                                                                  |
| `AnswerGameProvider` conditional adapter                                 | Task 7                                                                                                                                  |
| `inputMode: 'text'` for WordSpell                                        | Task 12                                                                                                                                 |
| `inputMode: 'numeric'` for SortNumbers                                   | Task 12                                                                                                                                 |
| `OrderedSlots` consolidation                                             | Task 8                                                                                                                                  |
| `OrderedLetterSlots` re-export                                           | Task 9                                                                                                                                  |
| `NumberSequenceSlots` re-export                                          | Task 10                                                                                                                                 |
| Touch hint text in `LetterTileBank`                                      | Task 11                                                                                                                                 |
| Desktop behaviour unchanged                                              | Task 7 (non-touch branch uses existing `KeyboardInputAdapter`)                                                                          |
| `'both'` mode on touch: drag tiles still visible + keyboard via slot tap | Task 7 — `TouchKeyboardAdapter` renders whenever `inputMethod !== 'drag'`; drag tiles use separate `LetterTileBank` which is unaffected |
