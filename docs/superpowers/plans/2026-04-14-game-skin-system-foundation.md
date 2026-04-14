# Game Skin System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the core skin system in baseskill: `GameSkin` contract, skin registry, `useGameSkin` hook, event-bus extensions, audio URL API, token layer, and integrate SortNumbers as the first skinnable game, with a Storybook harness to drive iteration.

**Architecture:** Skins are objects registered per-game at app startup. They provide CSS custom-property overrides (`--skin-*`), fire-and-forget event callbacks (wired to the existing `GameEventBus`), optional render-slot components, and per-skin timing values. The `classic` skin ships in baseskill with defaults that reference the existing `--bs-*` app theme, so the current look is preserved. SortNumbers becomes the reference integration; a `SkinHarness` Storybook story lets skin authors iterate without playing a full session.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, Storybook 10, Tailwind 4, RxDB (unrelated but present). Follow existing patterns: named exports only (no `export default`), React components as `const` arrow functions, utility/hook functions as `function` declarations.

**Spec:** `docs/superpowers/specs/2026-04-13-game-skin-system-design.md`

**Scope boundaries:**

- Plan 1 (this plan) covers the skin system foundation and SortNumbers integration.
- Plan 2 (future) will replicate the integration pattern to WordSpell + NumberMatch.
- Plan 3 (future) will bootstrap the `baseskill-premium-cloud` repo and first real skin.

**Known limitations after Plan 1 (to be addressed in Plan 2):**

- **`--skin-*` CSS tokens are applied on the game container but not yet consumed by core components.** An initial attempt to inline tokens on `Slot` and `TileBank` broke Tailwind state classes (inline styles outrank class-level styling), so token consumption was reverted to preserve the classic look. Third-party skins can still consume the tokens via their own `.skin-<id>` CSS classes served from the skin package. Plan 2 will refactor `Slot` and `TileBank` to a CSS-variable-first styling approach so core components read `var(--skin-*)` without breaking state styling.
- **`onGameOver` receives `retryCount: 0`.** `GameEndEvent` does not carry the retry count. Either extend the event payload or emit a skin-specific event in Plan 2 when all three games are integrated.

---

## File Structure

### New files in baseskill

| File                                                              | Responsibility                                      |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| `src/lib/skin/game-skin.ts`                                       | `GameSkin` TypeScript interface                     |
| `src/lib/skin/classic-skin.ts`                                    | Default `classic` skin with baseline tokens         |
| `src/lib/skin/registry.ts`                                        | `registerSkin`, `resolveSkin`, `getRegisteredSkins` |
| `src/lib/skin/registry.test.ts`                                   | Unit tests for the registry                         |
| `src/lib/skin/resolve-timing.ts`                                  | Precedence resolver for engine delays               |
| `src/lib/skin/resolve-timing.test.ts`                             | Unit tests                                          |
| `src/lib/skin/useGameSkin.ts`                                     | Hook: resolves skin, wires callbacks to event bus   |
| `src/lib/skin/useGameSkin.test.tsx`                               | Hook tests (rendering + event wiring)               |
| `src/lib/skin/index.ts`                                           | Barrel export                                       |
| `src/lib/skin/SkinHarness.tsx`                                    | Reusable harness component (toolbar + game render)  |
| `src/lib/audio/playSoundUrl.ts`                                   | URL-based sound playback (mirrors `playSound`)      |
| `src/lib/audio/playSoundUrl.test.ts`                              | Unit tests                                          |
| `src/lib/audio/index.ts`                                          | Barrel export                                       |
| `src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx` | SortNumbers harness story                           |

### Modified files

| File                                                                 | Change                                                                                    |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                                           | Add `zoneIndex` to `GameEvaluateEvent`; add 5 new event types                             |
| `src/components/answer-game/useTileEvaluation.ts`                    | Emit `zoneIndex`; respect `suppressDefaultSounds`                                         |
| `src/components/answer-game/useDraggableTile.ts`                     | Emit `game:drag-start`                                                                    |
| `src/components/answer-game/useSlotTileDrag.ts`                      | Emit `game:drag-over-zone`                                                                |
| `src/components/answer-game/Slot/useSlotBehavior.ts`                 | Emit `game:tile-ejected` alongside `EJECT_TILE` dispatch                                  |
| `src/components/answer-game/types.ts`                                | Add `skin?: string` and `timing?: {...}` to `AnswerGameConfig`                            |
| `src/components/answer-game/Slot/Slot.tsx`                           | Consume `--skin-slot-*` tokens; render `slotDecoration`                                   |
| `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx` | Consume `--skin-tile-*` tokens; render `tileDecoration`                                   |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`                 | Use `useGameSkin`, apply tokens, `resolveTiming`, render slots, emit `game:round-advance` |

### Visual regression (VR)

Plan 1 keeps the classic visual output unchanged. VR baselines should not need updating. If they do, the change is unintentional — investigate before accepting.

---

## Phase A — Foundation Types and Registry

### Task 1: `GameSkin` TypeScript interface

**Files:**

- Create: `src/lib/skin/game-skin.ts`

- [ ] **Step 1: Create the type**

Create `src/lib/skin/game-skin.ts`:

```ts
import type { ComponentType, ReactNode } from 'react';

export interface GameSkinTiming {
  /** ms between round-complete and ADVANCE_ROUND. Default: 750 */
  roundAdvanceDelay?: number;
  /** ms between wrong-tile lock and EJECT_TILE. Default: 1000 */
  autoEjectDelay?: number;
  /** ms between level-complete and LevelCompleteOverlay. Default: 750 */
  levelCompleteDelay?: number;
}

export interface GameSkinZoneSnapshot {
  isLocked: boolean;
  isWrong: boolean;
  placedTileId: string | null;
}

export interface GameSkinTileSnapshot {
  id: string;
  label: string;
  value: string;
}

export interface GameSkinCelebrationOverlayProps {
  retryCount: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export interface GameSkinLevelCompleteOverlayProps {
  level: number;
  onNextLevel: () => void;
  onDone: () => void;
}

export interface GameSkin {
  /** Unique identifier, e.g. 'dino-eggs' */
  id: string;
  /** Display name for UI */
  name: string;

  /** CSS custom property overrides applied on the game container */
  tokens: Record<string, string>;

  /** When true, engine suppresses default correct/wrong sound effects. */
  suppressDefaultSounds?: boolean;

  /** Timing overrides for engine delays. */
  timing?: GameSkinTiming;

  // ── Event Callbacks (fire-and-forget) ─────────────────────────
  onCorrectPlace?: (zoneIndex: number, tileValue: string) => void;
  onWrongPlace?: (zoneIndex: number, tileValue: string) => void;
  onTileEjected?: (zoneIndex: number) => void;
  onDragStart?: (tileId: string) => void;
  onDragOverZone?: (zoneIndex: number) => void;
  onRoundComplete?: (roundIndex: number) => void;
  onLevelComplete?: (levelIndex: number) => void;
  onGameOver?: (retryCount: number) => void;

  // ── Optional Render Slots ────────────────────────────────────
  SceneBackground?: ComponentType;
  CelebrationOverlay?: ComponentType<GameSkinCelebrationOverlayProps>;
  RoundCompleteEffect?: ComponentType<{ visible: boolean }>;
  LevelCompleteOverlay?: ComponentType<GameSkinLevelCompleteOverlayProps>;
  slotDecoration?: (
    zone: GameSkinZoneSnapshot,
    index: number,
  ) => ReactNode | null;
  tileDecoration?: (tile: GameSkinTileSnapshot) => ReactNode | null;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn typecheck`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/game-skin.ts
git commit -m "feat(skin): add GameSkin type definition"
```

---

### Task 2: Classic skin (baseline tokens)

**Files:**

- Create: `src/lib/skin/classic-skin.ts`

- [ ] **Step 1: Create the classic skin**

Create `src/lib/skin/classic-skin.ts`:

```ts
import type { GameSkin } from './game-skin';

/**
 * Default skin — tokens reference existing `--bs-*` app theme values so
 * the engine's visual output is unchanged when no other skin is registered.
 */
export const classicSkin: GameSkin = {
  id: 'classic',
  name: 'Classic',
  tokens: {
    // Tile tokens
    '--skin-tile-bg': 'var(--bs-primary)',
    '--skin-tile-text': 'var(--bs-surface)',
    '--skin-tile-radius': '0.75rem',
    '--skin-tile-border': 'transparent',
    '--skin-tile-shadow': '0 2px 4px rgb(0 0 0 / 10%)',
    '--skin-tile-font-weight': '700',

    // Slot tokens
    '--skin-slot-bg': 'var(--bs-surface)',
    '--skin-slot-border': 'var(--bs-accent)',
    '--skin-slot-radius': '0.75rem',
    '--skin-slot-active-border': 'var(--bs-primary)',

    // Feedback tokens
    '--skin-correct-color': 'var(--bs-success)',
    '--skin-wrong-color': 'var(--bs-error)',
    '--skin-correct-animation': 'pop 250ms ease-out',
    '--skin-wrong-animation': 'shake 300ms ease-in-out',

    // Scene tokens
    '--skin-scene-bg': 'transparent',
    '--skin-bank-bg': 'transparent',
    '--skin-bank-border': 'transparent',

    // Celebration tokens
    '--skin-celebration-emoji': "'🐨'",
  },
};
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn typecheck`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/classic-skin.ts
git commit -m "feat(skin): add classic skin with baseline tokens"
```

---

### Task 3: Skin registry

**Files:**

- Create: `src/lib/skin/registry.ts`
- Test: `src/lib/skin/registry.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/skin/registry.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { classicSkin } from './classic-skin';
import {
  __resetSkinRegistryForTests,
  getRegisteredSkins,
  registerSkin,
  resolveSkin,
} from './registry';
import type { GameSkin } from './game-skin';

const dinoEggsSkin: GameSkin = {
  id: 'dino-eggs',
  name: 'Dino Eggs',
  tokens: { '--skin-tile-bg': '#fbbf24' },
};

describe('skin registry', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  it('registers a skin and resolves it by id', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    expect(resolveSkin('sort-numbers', 'dino-eggs')).toBe(dinoEggsSkin);
  });

  it('resolveSkin falls back to classic when the id is unknown', () => {
    expect(resolveSkin('sort-numbers', 'missing')).toBe(classicSkin);
  });

  it('resolveSkin falls back to classic when the id is undefined', () => {
    expect(resolveSkin('sort-numbers', undefined)).toBe(classicSkin);
  });

  it('resolveSkin returns classic for games with no registered skins', () => {
    expect(resolveSkin('never-registered', 'anything')).toBe(
      classicSkin,
    );
  });

  it('getRegisteredSkins returns [classic] when nothing is registered for a game', () => {
    expect(getRegisteredSkins('sort-numbers')).toEqual([classicSkin]);
  });

  it('getRegisteredSkins returns classic plus any registered skins', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    const skins = getRegisteredSkins('sort-numbers');
    expect(skins).toContain(classicSkin);
    expect(skins).toContain(dinoEggsSkin);
  });

  it('isolates skins between games', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    expect(getRegisteredSkins('word-spell')).toEqual([classicSkin]);
  });

  it('overrides an existing registration with the same id', () => {
    const first: GameSkin = { id: 'test', name: 'First', tokens: {} };
    const second: GameSkin = { id: 'test', name: 'Second', tokens: {} };
    registerSkin('sort-numbers', first);
    registerSkin('sort-numbers', second);
    expect(resolveSkin('sort-numbers', 'test')).toBe(second);
  });
});
```

- [ ] **Step 2: Run tests — should fail (no registry yet)**

Run: `yarn test src/lib/skin/registry.test.ts`
Expected: all tests fail with "Cannot find module './registry'".

- [ ] **Step 3: Write the registry implementation**

Create `src/lib/skin/registry.ts`:

```ts
import { classicSkin } from './classic-skin';
import type { GameSkin } from './game-skin';

const registry = new Map<string, Map<string, GameSkin>>();

/** Register a skin for a specific game. Overrides existing entry with the same id. */
export function registerSkin(gameId: string, skin: GameSkin): void {
  let gameSkins = registry.get(gameId);
  if (!gameSkins) {
    gameSkins = new Map();
    registry.set(gameId, gameSkins);
  }
  gameSkins.set(skin.id, skin);
}

/** All registered skins for a game, with the classic skin always included first. */
export function getRegisteredSkins(gameId: string): GameSkin[] {
  const gameSkins = registry.get(gameId);
  if (!gameSkins) return [classicSkin];
  const others = [...gameSkins.values()].filter(
    (s) => s.id !== 'classic',
  );
  return [classicSkin, ...others];
}

/** Resolve a skin by id, falling back to `classic` when unknown. */
export function resolveSkin(
  gameId: string,
  skinId: string | undefined,
): GameSkin {
  if (!skinId || skinId === 'classic') return classicSkin;
  const gameSkins = registry.get(gameId);
  return gameSkins?.get(skinId) ?? classicSkin;
}

/** Test-only hook to reset the registry between tests. */
export function __resetSkinRegistryForTests(): void {
  registry.clear();
}
```

- [ ] **Step 4: Run tests — should all pass**

Run: `yarn test src/lib/skin/registry.test.ts`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/skin/registry.ts src/lib/skin/registry.test.ts
git commit -m "feat(skin): add skin registry with classic fallback"
```

---

### Task 4: `resolveTiming` helper

**Files:**

- Create: `src/lib/skin/resolve-timing.ts`
- Test: `src/lib/skin/resolve-timing.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/skin/resolve-timing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_SKIN_TIMING, resolveTiming } from './resolve-timing';
import type { GameSkin } from './game-skin';

const bareSkin: GameSkin = {
  id: 'bare',
  name: 'Bare',
  tokens: {},
};

describe('resolveTiming', () => {
  it('returns the default when skin and config provide nothing', () => {
    expect(resolveTiming('roundAdvanceDelay', bareSkin)).toBe(750);
    expect(resolveTiming('autoEjectDelay', bareSkin)).toBe(1000);
    expect(resolveTiming('levelCompleteDelay', bareSkin)).toBe(750);
  });

  it('uses the skin value when provided', () => {
    const skin: GameSkin = {
      ...bareSkin,
      timing: { roundAdvanceDelay: 1200 },
    };
    expect(resolveTiming('roundAdvanceDelay', skin)).toBe(1200);
    expect(resolveTiming('autoEjectDelay', skin)).toBe(1000);
  });

  it('config timing overrides skin timing', () => {
    const skin: GameSkin = {
      ...bareSkin,
      timing: { roundAdvanceDelay: 1200 },
    };
    const value = resolveTiming('roundAdvanceDelay', skin, {
      roundAdvanceDelay: 2000,
    });
    expect(value).toBe(2000);
  });

  it('DEFAULT_SKIN_TIMING is exported with expected shape', () => {
    expect(DEFAULT_SKIN_TIMING).toEqual({
      roundAdvanceDelay: 750,
      autoEjectDelay: 1000,
      levelCompleteDelay: 750,
    });
  });
});
```

- [ ] **Step 2: Run tests — should fail**

Run: `yarn test src/lib/skin/resolve-timing.test.ts`
Expected: fail with "Cannot find module './resolve-timing'".

- [ ] **Step 3: Implement `resolveTiming`**

Create `src/lib/skin/resolve-timing.ts`:

```ts
import type { GameSkin, GameSkinTiming } from './game-skin';

export const DEFAULT_SKIN_TIMING: Required<GameSkinTiming> = {
  roundAdvanceDelay: 750,
  autoEjectDelay: 1000,
  levelCompleteDelay: 750,
};

/**
 * Resolve an engine timing value with precedence:
 *   configTiming (teacher override) → skin.timing → DEFAULT_SKIN_TIMING.
 */
export function resolveTiming(
  key: keyof GameSkinTiming,
  skin: GameSkin,
  configTiming?: GameSkinTiming,
): number {
  return (
    configTiming?.[key] ??
    skin.timing?.[key] ??
    DEFAULT_SKIN_TIMING[key]
  );
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `yarn test src/lib/skin/resolve-timing.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/skin/resolve-timing.ts src/lib/skin/resolve-timing.test.ts
git commit -m "feat(skin): add resolveTiming helper with config → skin → default precedence"
```

---

## Phase B — Event Bus Extensions

### Task 5: Extend `game-events.ts` with new event types

**Files:**

- Modify: `src/types/game-events.ts`

- [ ] **Step 1: Add `zoneIndex` to `GameEvaluateEvent`**

Edit `src/types/game-events.ts`, update the `GameEvaluateEvent` interface:

```ts
export interface GameEvaluateEvent extends BaseGameEvent {
  type: 'game:evaluate';
  answer: string | string[] | number;
  correct: boolean;
  nearMiss: boolean;
  /** Index of the slot the tile was placed into. */
  zoneIndex: number;
}
```

- [ ] **Step 2: Add the 5 new event types and union**

In the same file, extend `GameEventType`:

```ts
export type GameEventType =
  | 'game:start'
  | 'game:instructions_shown'
  | 'game:action'
  | 'game:evaluate'
  | 'game:score'
  | 'game:hint'
  | 'game:retry'
  | 'game:time_up'
  | 'game:end'
  | 'game:round-advance'
  | 'game:level-advance'
  | 'game:drag-start'
  | 'game:drag-over-zone'
  | 'game:tile-ejected';
```

Add the five new interfaces before the `GameEvent` union:

```ts
export interface GameRoundAdvanceEvent extends BaseGameEvent {
  type: 'game:round-advance';
}

export interface GameLevelAdvanceEvent extends BaseGameEvent {
  type: 'game:level-advance';
  levelIndex: number;
}

export interface GameDragStartEvent extends BaseGameEvent {
  type: 'game:drag-start';
  tileId: string;
}

export interface GameDragOverZoneEvent extends BaseGameEvent {
  type: 'game:drag-over-zone';
  zoneIndex: number;
}

export interface GameTileEjectedEvent extends BaseGameEvent {
  type: 'game:tile-ejected';
  zoneIndex: number;
  tileId: string | null;
}
```

Update the `GameEvent` union:

```ts
export type GameEvent =
  | GameStartEvent
  | GameInstructionsShownEvent
  | GameActionEvent
  | GameEvaluateEvent
  | GameScoreEvent
  | GameHintEvent
  | GameRetryEvent
  | GameTimeUpEvent
  | GameEndEvent
  | GameRoundAdvanceEvent
  | GameLevelAdvanceEvent
  | GameDragStartEvent
  | GameDragOverZoneEvent
  | GameTileEjectedEvent;
```

- [ ] **Step 3: Fix the existing `game-event-bus.test.ts` fixture**

The existing `evaluateEvent()` helper in `src/lib/game-event-bus.test.ts` is now missing `zoneIndex`. Edit it:

```ts
function evaluateEvent(): GameEvaluateEvent {
  return {
    type: 'game:evaluate',
    gameId: 'g1',
    sessionId: 's1',
    profileId: 'p1',
    timestamp: 1,
    roundIndex: 0,
    answer: 7,
    correct: true,
    nearMiss: false,
    zoneIndex: 0,
  };
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `yarn typecheck`
Expected: Any file that constructs a `GameEvaluateEvent` without `zoneIndex` will fail.

Run: `yarn test src/lib/game-event-bus.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Fix remaining typecheck errors for `GameEvaluateEvent`**

Run `yarn typecheck` again and add `zoneIndex` (use `0` for synthetic/historical test events, the actual index in production code) to every failing construction site. The primary known emitter is `useTileEvaluation.ts` — defer updating it to Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/types/game-events.ts src/lib/game-event-bus.test.ts
git commit -m "feat(events): add zoneIndex to GameEvaluateEvent and 5 new event types"
```

---

### Task 6: Emit `zoneIndex` in `useTileEvaluation`

**Files:**

- Modify: `src/components/answer-game/useTileEvaluation.ts`

- [ ] **Step 1: Update `placeTile` emit**

Edit `src/components/answer-game/useTileEvaluation.ts`, in the `placeTile` callback. Inside the `getGameEventBus().emit({ ... })` call, add `zoneIndex`:

```ts
getGameEventBus().emit({
  type: 'game:evaluate',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  answer: tileId,
  correct,
  nearMiss: false,
  zoneIndex,
});
```

- [ ] **Step 2: Update `typeTile` emit**

In the `typeTile` callback, add `zoneIndex` to its emit call:

```ts
getGameEventBus().emit({
  type: 'game:evaluate',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  answer: value,
  correct,
  nearMiss: false,
  zoneIndex,
});
```

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: no errors.

- [ ] **Step 4: Run related tests**

Run: `yarn test src/components/answer-game/useTileEvaluation.test.tsx`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/useTileEvaluation.ts
git commit -m "feat(events): emit zoneIndex in game:evaluate events"
```

---

### Task 7: Emit `game:drag-start` in `useDraggableTile`

**Files:**

- Modify: `src/components/answer-game/useDraggableTile.ts`

- [ ] **Step 1: Locate drag-start trigger**

Run: `yarn grep "setDragActive\|SET_DRAG_ACTIVE" src/components/answer-game/useDraggableTile.ts`

Identify the spot where `SET_DRAG_ACTIVE` with a non-null `tileId` is dispatched.

- [ ] **Step 2: Emit the event**

Just after the non-null `SET_DRAG_ACTIVE` dispatch, add:

```ts
getGameEventBus().emit({
  type: 'game:drag-start',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  tileId,
});
```

Add the import at the top if missing:

```ts
import { getGameEventBus } from '@/lib/game-event-bus';
```

- [ ] **Step 3: Run typecheck and tests**

Run: `yarn typecheck && yarn test src/components/answer-game/useDraggableTile.test.tsx`
Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/useDraggableTile.ts
git commit -m "feat(events): emit game:drag-start when a tile drag begins"
```

---

### Task 8: Emit `game:drag-over-zone` in `useSlotTileDrag`

**Files:**

- Modify: `src/components/answer-game/useSlotTileDrag.ts`

- [ ] **Step 1: Locate hover dispatch**

Open the file and find the `SET_DRAG_HOVER` dispatch with a non-null `zoneIndex`.

- [ ] **Step 2: Emit the event**

Just after the non-null `SET_DRAG_HOVER` dispatch, add:

```ts
getGameEventBus().emit({
  type: 'game:drag-over-zone',
  gameId: state.config.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: state.roundIndex,
  zoneIndex,
});
```

Add the import if missing.

- [ ] **Step 3: Run typecheck and tests**

Run: `yarn typecheck && yarn test src/components/answer-game/useSlotTileDrag.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/useSlotTileDrag.ts
git commit -m "feat(events): emit game:drag-over-zone when a drag enters a slot"
```

---

### Task 9: Emit `game:tile-ejected` alongside `EJECT_TILE`

**Files:**

- Modify: `src/components/answer-game/Slot/useSlotBehavior.ts`

- [ ] **Step 1: Locate the EJECT_TILE dispatch**

Open `src/components/answer-game/Slot/useSlotBehavior.ts` and find the dispatch at the `setTimeout` around line 299:

```ts
const timerId = setTimeout(() => {
  dispatch({ type: 'EJECT_TILE', zoneIndex: index });
}, 1000);
```

- [ ] **Step 2: Emit alongside dispatch**

Replace that block with:

```ts
const timerId = setTimeout(() => {
  const ejectedTileId = state.zones[index]?.placedTileId ?? null;
  dispatch({ type: 'EJECT_TILE', zoneIndex: index });
  getGameEventBus().emit({
    type: 'game:tile-ejected',
    gameId: state.config.gameId,
    sessionId: '',
    profileId: '',
    timestamp: Date.now(),
    roundIndex: state.roundIndex,
    zoneIndex: index,
    tileId: ejectedTileId,
  });
}, 1000);
```

Add the import if missing: `import { getGameEventBus } from '@/lib/game-event-bus';`.

Confirm `state` is available in scope; if the hook uses a different variable name, adapt.

- [ ] **Step 3: Run typecheck and tests**

Run: `yarn typecheck && yarn test src/components/answer-game/Slot/useSlotBehavior.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/Slot/useSlotBehavior.ts
git commit -m "feat(events): emit game:tile-ejected alongside EJECT_TILE"
```

---

## Phase C — Audio URL Extension

### Task 10: `playSoundUrl` / `queueSoundUrl`

**Files:**

- Modify: `src/lib/audio/AudioFeedback.ts`
- Create: `src/lib/audio/playSoundUrl.test.ts`
- Create: `src/lib/audio/index.ts`

- [ ] **Step 1: Refactor `playSoundInternal` to accept a path**

Edit `src/lib/audio/AudioFeedback.ts`. Change the signature of `playSoundInternal` so it takes a path (URL), not a key:

```ts
function playSoundInternal(
  path: string,
  volume: number,
): Promise<void> {
  currentAudio?.pause();
  currentAudio = null;

  const audio = new Audio(path);
  audio.volume = volume;
  currentAudio = audio;

  return new Promise<void>((resolve) => {
    currentResolve = resolve;

    const cleanup = () => {
      if (currentResolve === resolve) currentResolve = null;
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };

    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    void audio.play().catch(() => {
      console.error(`Failed to play sound ${path}`);
      cleanup();
    });
  });
}
```

Update existing `playSound` / `queueSound` to pass `SOUND_PATHS[key]`:

```ts
export function playSound(key: SoundKey, volume = 0.8): void {
  currentResolve?.();
  currentResolve = null;
  queueTail = playSoundInternal(SOUND_PATHS[key], volume);
}

export function queueSound(key: SoundKey, volume = 0.8): Promise<void> {
  const startsAt = queueTail;
  queueTail = startsAt.then(() =>
    playSoundInternal(SOUND_PATHS[key], volume),
  );
  return startsAt;
}
```

- [ ] **Step 2: Add URL-based exports**

Append to the same file:

```ts
/** Plays an arbitrary audio URL through the same queue/cancel machinery. */
export function playSoundUrl(url: string, volume = 0.8): void {
  currentResolve?.();
  currentResolve = null;
  queueTail = playSoundInternal(url, volume);
}

/** Queues an arbitrary audio URL behind any in-flight audio. */
export function queueSoundUrl(
  url: string,
  volume = 0.8,
): Promise<void> {
  const startsAt = queueTail;
  queueTail = startsAt.then(() => playSoundInternal(url, volume));
  return startsAt;
}

/** Exposed so skins can check / extend the built-in sound key set. */
export const SOUND_KEYS = [
  'correct',
  'wrong',
  'round-complete',
  'level-complete',
  'game-complete',
  'tile-place',
] as const satisfies readonly SoundKey[];
```

- [ ] **Step 3: Write tests for the URL-based path**

Create `src/lib/audio/playSoundUrl.test.ts`:

```ts
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

interface FakeAudio {
  src: string;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (
    event: string,
    handler: () => void,
    options?: { once?: boolean },
  ) => void;
}

const audios: FakeAudio[] = [];

beforeEach(() => {
  audios.length = 0;
  vi.stubGlobal(
    'Audio',
    vi.fn().mockImplementation((src: string) => {
      const listeners: Record<string, () => void> = {};
      const audio: FakeAudio = {
        src,
        volume: 1,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          listeners[event] = handler;
        }),
      };
      audios.push(audio);
      return audio;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('playSoundUrl', () => {
  it('plays an arbitrary URL', async () => {
    const { playSoundUrl } = await import('./AudioFeedback');
    playSoundUrl('/custom.mp3', 0.5);
    expect(audios).toHaveLength(1);
    expect(audios[0]!.src).toContain('custom.mp3');
    expect(audios[0]!.volume).toBe(0.5);
    expect(audios[0]!.play).toHaveBeenCalledTimes(1);
  });

  it('queueSoundUrl waits for prior audio', async () => {
    const { playSoundUrl, queueSoundUrl } =
      await import('./AudioFeedback');
    playSoundUrl('/first.mp3');
    await queueSoundUrl('/second.mp3');
    expect(audios).toHaveLength(2);
  });
});
```

- [ ] **Step 4: Run tests and typecheck**

Run: `yarn typecheck && yarn test src/lib/audio/playSoundUrl.test.ts src/components/answer-game/useGameSounds.test.tsx`
Expected: all tests pass.

- [ ] **Step 5: Create barrel export**

Create `src/lib/audio/index.ts`:

```ts
export {
  playSound,
  playSoundUrl,
  queueSound,
  queueSoundUrl,
  whenSoundEnds,
  SOUND_KEYS,
} from './AudioFeedback';
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/audio/AudioFeedback.ts src/lib/audio/playSoundUrl.test.ts src/lib/audio/index.ts
git commit -m "feat(audio): add playSoundUrl and queueSoundUrl for custom audio files"
```

---

## Phase D — `useGameSkin` Hook and Barrel

### Task 11: `useGameSkin` hook

**Files:**

- Create: `src/lib/skin/useGameSkin.ts`
- Test: `src/lib/skin/useGameSkin.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/lib/skin/useGameSkin.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { getGameEventBus } from '@/lib/game-event-bus';
import { __resetSkinRegistryForTests, registerSkin } from './registry';
import { useGameSkin } from './useGameSkin';
import type { GameSkin } from './game-skin';

describe('useGameSkin', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the classic skin when no id is provided', () => {
    const { result } = renderHook(() =>
      useGameSkin('sort-numbers', undefined),
    );
    expect(result.current.id).toBe('classic');
  });

  it('returns the registered skin when the id matches', () => {
    const dino: GameSkin = {
      id: 'dino',
      name: 'Dino',
      tokens: {},
    };
    registerSkin('sort-numbers', dino);
    const { result } = renderHook(() =>
      useGameSkin('sort-numbers', 'dino'),
    );
    expect(result.current).toBe(dino);
  });

  it('wires onCorrectPlace to game:evaluate with correct=true', () => {
    const onCorrectPlace = vi.fn();
    const skin: GameSkin = {
      id: 'snd',
      name: 'Snd',
      tokens: {},
      onCorrectPlace,
    };
    registerSkin('sort-numbers', skin);

    renderHook(() => useGameSkin('sort-numbers', 'snd'));

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: true,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).toHaveBeenCalledWith(2, '5');
  });

  it('does NOT call onCorrectPlace for wrong evaluations', () => {
    const onCorrectPlace = vi.fn();
    const onWrongPlace = vi.fn();
    registerSkin('sort-numbers', {
      id: 's',
      name: 'S',
      tokens: {},
      onCorrectPlace,
      onWrongPlace,
    });

    renderHook(() => useGameSkin('sort-numbers', 's'));

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: false,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).not.toHaveBeenCalled();
    expect(onWrongPlace).toHaveBeenCalledWith(2, '5');
  });

  it('unsubscribes on unmount', () => {
    const onCorrectPlace = vi.fn();
    registerSkin('sort-numbers', {
      id: 's2',
      name: 'S2',
      tokens: {},
      onCorrectPlace,
    });

    const { unmount } = renderHook(() =>
      useGameSkin('sort-numbers', 's2'),
    );
    unmount();

    act(() => {
      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: 'sort-numbers',
        sessionId: '',
        profileId: '',
        timestamp: 1,
        roundIndex: 0,
        answer: '5',
        correct: true,
        nearMiss: false,
        zoneIndex: 2,
      });
    });

    expect(onCorrectPlace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — should fail**

Run: `yarn test src/lib/skin/useGameSkin.test.tsx`
Expected: fail with "Cannot find module './useGameSkin'".

- [ ] **Step 3: Implement the hook**

Create `src/lib/skin/useGameSkin.ts`:

```ts
import { useEffect, useMemo } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';
import { resolveSkin } from './registry';
import type { GameSkin } from './game-skin';

/**
 * Resolve the skin for a game and wire its optional callbacks to the
 * process-wide game event bus. Returns the resolved skin so callers can
 * apply tokens and render slots.
 */
export function useGameSkin(
  gameId: string,
  skinId: string | undefined,
): GameSkin {
  const skin = useMemo(
    () => resolveSkin(gameId, skinId),
    [gameId, skinId],
  );

  useEffect(() => {
    const bus = getGameEventBus();
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      bus.subscribe('game:evaluate', (event) => {
        if (event.type !== 'game:evaluate') return;
        if (event.gameId !== gameId) return;
        if (event.correct) {
          skin.onCorrectPlace?.(event.zoneIndex, String(event.answer));
        } else {
          skin.onWrongPlace?.(event.zoneIndex, String(event.answer));
        }
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:tile-ejected', (event) => {
        if (event.type !== 'game:tile-ejected') return;
        if (event.gameId !== gameId) return;
        skin.onTileEjected?.(event.zoneIndex);
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:drag-start', (event) => {
        if (event.type !== 'game:drag-start') return;
        if (event.gameId !== gameId) return;
        skin.onDragStart?.(event.tileId);
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:drag-over-zone', (event) => {
        if (event.type !== 'game:drag-over-zone') return;
        if (event.gameId !== gameId) return;
        skin.onDragOverZone?.(event.zoneIndex);
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:round-advance', (event) => {
        if (event.type !== 'game:round-advance') return;
        if (event.gameId !== gameId) return;
        skin.onRoundComplete?.(event.roundIndex);
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:level-advance', (event) => {
        if (event.type !== 'game:level-advance') return;
        if (event.gameId !== gameId) return;
        skin.onLevelComplete?.(event.levelIndex);
      }),
    );

    unsubscribers.push(
      bus.subscribe('game:end', (event) => {
        if (event.type !== 'game:end') return;
        if (event.gameId !== gameId) return;
        skin.onGameOver?.(0); // retryCount not yet wired through event
      }),
    );

    return () => {
      for (const fn of unsubscribers) fn();
    };
  }, [skin, gameId]);

  return skin;
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `yarn test src/lib/skin/useGameSkin.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/skin/useGameSkin.ts src/lib/skin/useGameSkin.test.tsx
git commit -m "feat(skin): add useGameSkin hook wiring callbacks to event bus"
```

---

### Task 12: Barrel export for the skin module

**Files:**

- Create: `src/lib/skin/index.ts`

- [ ] **Step 1: Create the barrel**

Create `src/lib/skin/index.ts`:

```ts
export { classicSkin } from './classic-skin';
export type {
  GameSkin,
  GameSkinCelebrationOverlayProps,
  GameSkinLevelCompleteOverlayProps,
  GameSkinTileSnapshot,
  GameSkinTiming,
  GameSkinZoneSnapshot,
} from './game-skin';
export {
  getRegisteredSkins,
  registerSkin,
  resolveSkin,
} from './registry';
export { DEFAULT_SKIN_TIMING, resolveTiming } from './resolve-timing';
export { useGameSkin } from './useGameSkin';
```

- [ ] **Step 2: Verify the barrel compiles**

Run: `yarn typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/index.ts
git commit -m "chore(skin): add barrel export for skin module"
```

---

## Phase E — Config Extension

### Task 13: Extend `AnswerGameConfig`

**Files:**

- Modify: `src/components/answer-game/types.ts`

- [ ] **Step 1: Add skin and timing fields**

Edit `src/components/answer-game/types.ts`. Add the following fields to `AnswerGameConfig` (near the existing optional fields):

```ts
  /** Skin ID for visual variant. Falls back to 'classic' if not registered. */
  skin?: string;
  /**
   * Per-config timing overrides. Take precedence over the skin's own
   * `timing` values and baseskill defaults.
   */
  timing?: {
    roundAdvanceDelay?: number;
    autoEjectDelay?: number;
    levelCompleteDelay?: number;
  };
```

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: no errors. (Both fields are optional.)

- [ ] **Step 3: Commit**

```bash
git add src/components/answer-game/types.ts
git commit -m "feat(config): add skin and timing to AnswerGameConfig"
```

---

## Phase F — Suppress Default Sounds Flag

### Task 14: Respect `suppressDefaultSounds` in `useTileEvaluation`

**Files:**

- Modify: `src/components/answer-game/useTileEvaluation.ts`

- [ ] **Step 1: Resolve the skin inside the hook**

Edit `src/components/answer-game/useTileEvaluation.ts`. Import `resolveSkin`:

```ts
import { resolveSkin } from '@/lib/skin';
```

At the top of `useTileEvaluation`, after `const dispatch = useAnswerGameDispatch();`:

```ts
const skin = resolveSkin(state.config.gameId, state.config.skin);
```

- [ ] **Step 2: Gate the `playSound` calls**

In the `placeTile` callback, replace:

```ts
playSound(correct ? 'correct' : 'wrong', 0.8);
```

with:

```ts
if (!skin.suppressDefaultSounds) {
  playSound(correct ? 'correct' : 'wrong', 0.8);
}
```

Repeat the same change in `typeTile`.

- [ ] **Step 3: Run existing tests**

Run: `yarn test src/components/answer-game/useTileEvaluation.test.tsx`
Expected: all tests pass (the default skin does not set `suppressDefaultSounds`, so behaviour is unchanged).

- [ ] **Step 4: Add a regression test**

Add this import at the top of `src/components/answer-game/useTileEvaluation.test.tsx`:

```ts
import { __resetSkinRegistryForTests, registerSkin } from '@/lib/skin';
```

Inside the existing top-level `describe('useTileEvaluation', () => { ... })`, append this test (adapt the wrapper/harness names to match what's already used in the file):

```ts
it('skips default sound when skin.suppressDefaultSounds is true', () => {
  __resetSkinRegistryForTests();
  registerSkin('test', {
    id: 'silent',
    name: 'Silent',
    tokens: {},
    suppressDefaultSounds: true,
  });

  const config: AnswerGameConfig = { ...baseConfig, skin: 'silent' };
  const { result } = renderHook(() => useTileEvaluationHarness(), {
    wrapper: createWrapper(config),
  });

  vi.mocked(playSound).mockClear();

  act(() => {
    result.current.placeTile('t1', 0);
  });

  expect(playSound).not.toHaveBeenCalled();
});
```

- [ ] **Step 5: Run the new test**

Run: `yarn test src/components/answer-game/useTileEvaluation.test.tsx`
Expected: passes including the new test.

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/useTileEvaluation.ts src/components/answer-game/useTileEvaluation.test.tsx
git commit -m "feat(skin): respect suppressDefaultSounds in useTileEvaluation"
```

---

## Phase G — Token Layer in Core Components

### Task 15: `Slot` consumes `--skin-slot-*` tokens and renders `slotDecoration`

**Files:**

- Modify: `src/components/answer-game/Slot/Slot.tsx`

- [ ] **Step 1: Accept `skin` prop**

Edit `src/components/answer-game/Slot/Slot.tsx`. Update `SlotProps` to accept a `skin`:

```ts
import type { GameSkin } from '@/lib/skin';

interface SlotProps {
  index: number;
  as?: 'li' | 'span' | 'div';
  className?: string;
  children: (props: SlotRenderProps) => ReactNode;
  renderPreview?: (previewLabel: string) => ReactNode;
  /**
   * Optional skin whose `slotDecoration` renderer runs inside the slot.
   * When undefined, falls back to no decoration (same as today).
   */
  skin?: GameSkin;
}
```

Destructure `skin` in the component signature:

```ts
export const Slot = ({
  index,
  as: Tag = 'li',
  className,
  children,
  renderPreview,
  skin,
}: SlotProps) => {
```

- [ ] **Step 2: Render `slotDecoration` inside the slot**

Find the inner `InnerTag` block (where the slot's visual body renders) and add the decoration just before `children(renderProps)` returns its output. The exact markup depends on the existing JSX; insert:

```tsx
{
  skin?.slotDecoration?.(
    {
      isLocked: zone?.isLocked ?? false,
      isWrong: zone?.isWrong ?? false,
      placedTileId: zone?.placedTileId ?? null,
    },
    index,
  );
}
```

You may need to obtain `zone` via `useAnswerGameContext().zones[index]`. Add the hook call at the top:

```ts
import { useAnswerGameContext } from '../useAnswerGameContext';
// inside Slot component:
const { zones } = useAnswerGameContext();
const zone = zones[index];
```

- [ ] **Step 3: Consume slot tokens in the visual border/background**

In `stateClasses`, swap the hardcoded default-state classes to use skin tokens via inline style. The simplest route: add a `style` object that sets background/border/radius from CSS variables and keep the Tailwind classes for layout only:

```tsx
<InnerTag
  className="game-slot ..." // existing layout classes
  style={{
    borderColor: 'var(--skin-slot-border)',
    background: 'var(--skin-slot-bg)',
    borderRadius: 'var(--skin-slot-radius)',
  }}
>
```

Keep the active/wrong/preview state classes layered on top so their `ring` / `border-destructive` styling still wins.

- [ ] **Step 4: Run tests**

Run: `yarn test src/components/answer-game/Slot/`
Expected: all tests pass. If any test asserts specific color classes that changed, update the assertion to match the new style-driven output (or relax to a structural assertion).

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/Slot/Slot.tsx
git commit -m "feat(skin): consume --skin-slot-* tokens and render slotDecoration in Slot"
```

---

### Task 16: `SortNumbersTileBank` consumes `--skin-tile-*` tokens

**Files:**

- Modify: `src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx`

- [ ] **Step 1: Locate the tile button/element**

Open the file. Find the element that renders an individual bank tile (typically a `<button>` or `<div>` inside a map).

- [ ] **Step 2: Apply skin tokens via inline style**

Replace hardcoded colour/radius classes on the tile with style props:

```tsx
<button
  style={{
    background: 'var(--skin-tile-bg)',
    color: 'var(--skin-tile-text)',
    borderRadius: 'var(--skin-tile-radius)',
    border: 'var(--skin-tile-border)',
    boxShadow: 'var(--skin-tile-shadow)',
    fontWeight: 'var(--skin-tile-font-weight)',
  }}
  // ... existing handlers
>
  {tile.label}
</button>
```

- [ ] **Step 3: Accept and render `skin.tileDecoration`**

Add a `skin?: GameSkin` prop to the bank. Inside the tile render, after the label:

```tsx
{
  skin?.tileDecoration?.({
    id: tile.id,
    label: tile.label,
    value: tile.value,
  });
}
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/games/sort-numbers/SortNumbersTileBank/`
Expected: passes. Update any colour-class assertions.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/SortNumbersTileBank/SortNumbersTileBank.tsx
git commit -m "feat(skin): consume --skin-tile-* tokens and render tileDecoration in SortNumbersTileBank"
```

---

## Phase H — SortNumbers Integration

### Task 17: Integrate `useGameSkin` into `SortNumbers`

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

- [ ] **Step 1: Resolve skin and apply tokens**

At the top of the `SortNumbers` component (not the session), call the hook and wrap the existing `<AnswerGame>` tree with a container that applies tokens:

```tsx
import { resolveTiming, useGameSkin } from '@/lib/skin';

// inside SortNumbers:
const skin = useGameSkin('sort-numbers', config.skin);
```

Replace the top-level return with:

```tsx
return (
  <div
    className={`game-container skin-${skin.id}`}
    style={skin.tokens as React.CSSProperties}
  >
    {skin.SceneBackground ? <skin.SceneBackground /> : null}
    <AnswerGame
      key={sessionEpoch}
      config={answerGameConfig}
      initialState={sessionEpoch === 0 ? initialState : undefined}
      sessionId={sessionId}
    >
      <SortNumbersSession
        sortNumbersConfig={config}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  </div>
);
```

- [ ] **Step 2: Pass `skin` into `SortNumbersSession`**

Update the `SortNumbersSession` signature and pass it to child components:

```tsx
const SortNumbersSession = ({
  sortNumbersConfig,
  roundOrder,
  skin,
  onRestartSession,
}: {
  sortNumbersConfig: SortNumbersConfig;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
}) => {
```

Pass `skin` into `<Slot>` and `<SortNumbersTileBank>` where they are rendered.

- [ ] **Step 3: Use `resolveTiming` for the round-advance delay**

Replace the hardcoded `const delayMs = 750;` with:

```ts
const delayMs = resolveTiming(
  'roundAdvanceDelay',
  skin,
  sortNumbersConfig.timing,
);
```

- [ ] **Step 4: Emit `game:round-advance` on advance**

Inside the `useEffect` that advances the round, just after the `dispatch({ type: 'ADVANCE_ROUND', ... })` call, emit:

```ts
getGameEventBus().emit({
  type: 'game:round-advance',
  gameId: sortNumbersConfig.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: roundIndex + 1,
});
```

Add import: `import { getGameEventBus } from '@/lib/game-event-bus';`.

- [ ] **Step 5: Emit `game:level-advance` in `handleNextLevel`**

Inside `handleNextLevel`, after the `dispatch({ type: 'ADVANCE_LEVEL', ... })` call (inside the `if (nextLevel)` branch), emit:

```ts
getGameEventBus().emit({
  type: 'game:level-advance',
  gameId: sortNumbersConfig.gameId,
  sessionId: '',
  profileId: '',
  timestamp: Date.now(),
  roundIndex: 0,
  levelIndex: levelIndex + 1,
});
```

- [ ] **Step 6: Render optional render slots**

Replace the default overlay conditionals to prefer the skin-provided slots:

```tsx
{
  skin.RoundCompleteEffect ? (
    <skin.RoundCompleteEffect visible={confettiReady} />
  ) : (
    <ScoreAnimation visible={confettiReady} />
  );
}

{
  levelCompleteReady ? (
    skin.LevelCompleteOverlay ? (
      <skin.LevelCompleteOverlay
        level={levelIndex + 1}
        onNextLevel={handleNextLevel}
        onDone={handleDone}
      />
    ) : (
      <LevelCompleteOverlay
        level={levelIndex + 1}
        onNextLevel={handleNextLevel}
        onDone={handleDone}
      />
    )
  ) : null;
}

{
  gameOverReady ? (
    skin.CelebrationOverlay ? (
      <skin.CelebrationOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    ) : (
      <GameOverOverlay
        retryCount={retryCount}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    )
  ) : null;
}
```

- [ ] **Step 7: Run typecheck + tests**

Run: `yarn typecheck && yarn test src/games/sort-numbers/`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(sort-numbers): integrate useGameSkin, resolveTiming, and render slots"
```

---

## Phase I — Storybook Harness

### Task 18: `SkinHarness` component

**Files:**

- Create: `src/lib/skin/SkinHarness.tsx`

- [ ] **Step 1: Create the harness component**

Create `src/lib/skin/SkinHarness.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';
import { getRegisteredSkins } from './registry';
import type { GameSkin } from './game-skin';

export interface SkinHarnessProps {
  gameId: string;
  children: (ctx: { skin: GameSkin }) => ReactNode;
}

export const SkinHarness = ({ gameId, children }: SkinHarnessProps) => {
  const registered = useMemo(
    () => getRegisteredSkins(gameId),
    [gameId],
  );
  const [skinId, setSkinId] = useState<string>(registered[0]!.id);
  const skin =
    registered.find((s) => s.id === skinId) ?? registered[0]!;

  const bus = getGameEventBus();
  const emit = (type: string, extra: Record<string, unknown>) => {
    bus.emit({
      type,
      gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex: 0,
      ...extra,
    } as never);
  };

  return (
    <div className="skin-harness">
      <div
        aria-label="Skin harness toolbar"
        className="skin-harness-toolbar flex flex-wrap items-center gap-2 border-b p-3"
      >
        <label className="flex items-center gap-1 text-sm">
          Skin
          <select
            value={skinId}
            onChange={(e) => setSkinId(e.target.value)}
            className="rounded border px-2 py-1"
          >
            {registered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={() =>
            emit('game:evaluate', {
              answer: 'A',
              correct: true,
              nearMiss: false,
              zoneIndex: 0,
            })
          }
        >
          onCorrectPlace
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:evaluate', {
              answer: 'Z',
              correct: false,
              nearMiss: false,
              zoneIndex: 0,
            })
          }
        >
          onWrongPlace
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:tile-ejected', { zoneIndex: 0, tileId: null })
          }
        >
          onTileEjected
        </button>
        <button
          type="button"
          onClick={() => emit('game:drag-start', { tileId: 'mock' })}
        >
          onDragStart
        </button>
        <button
          type="button"
          onClick={() => emit('game:drag-over-zone', { zoneIndex: 0 })}
        >
          onDragOverZone
        </button>

        <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={() => emit('game:round-advance', {})}
        >
          onRoundComplete
        </button>
        <button
          type="button"
          onClick={() => emit('game:level-advance', { levelIndex: 0 })}
        >
          onLevelComplete
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:end', {
              finalScore: 0,
              totalRounds: 1,
              correctCount: 1,
              durationMs: 100,
            })
          }
        >
          onGameOver
        </button>
      </div>

      <div className="skin-harness-stage p-4">{children({ skin })}</div>
    </div>
  );
};
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/skin/SkinHarness.tsx
git commit -m "feat(skin): add SkinHarness component for Storybook iteration"
```

---

### Task 19: SortNumbers skin story

**Files:**

- Create: `src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx`

- [ ] **Step 1: Create the story**

Create `src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx`:

```tsx
import { useEffect } from 'react';
import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SortNumbers } from './SortNumbers';
import {
  __resetSkinRegistryForTests,
  registerSkin,
  SkinHarness,
} from '@/lib/skin';
import type { SortNumbersConfig } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Demo skin to prove the harness wires callbacks and tokens end-to-end.
 * Replace or extend with your in-development skin while iterating.
 */
const demoSkin: GameSkin = {
  id: 'demo',
  name: 'Demo Pink',
  tokens: {
    '--skin-tile-bg': '#ec4899',
    '--skin-tile-text': '#fff',
    '--skin-tile-radius': '50%',
    '--skin-slot-bg': '#fdf2f8',
    '--skin-slot-border': '#f472b6',
    '--skin-slot-radius': '50%',
  },
  onCorrectPlace: (zoneIndex, value) => {
    console.log(`[demo skin] correct @ zone ${zoneIndex}: ${value}`);
  },
  onWrongPlace: (zoneIndex, value) => {
    console.log(`[demo skin] wrong @ zone ${zoneIndex}: ${value}`);
  },
};

const baseConfig: SortNumbersConfig = {
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 2, max: 20 },
  quantity: 4,
  skip: { mode: 'consecutive' },
  distractors: { source: 'random', count: 0 },
  rounds: [
    { sequence: [3, 4, 5, 6] },
    { sequence: [7, 8, 9, 10] },
    { sequence: [11, 12, 13, 14] },
  ],
};

const SortNumbersWithHarness = ({
  config,
}: {
  config: SortNumbersConfig;
}) => {
  useEffect(() => {
    __resetSkinRegistryForTests();
    registerSkin('sort-numbers', demoSkin);
  }, []);

  return (
    <SkinHarness gameId="sort-numbers">
      {({ skin }) => (
        <SortNumbers config={{ ...config, skin: skin.id }} />
      )}
    </SkinHarness>
  );
};

const meta: Meta<typeof SortNumbersWithHarness> = {
  title: 'Games/SortNumbers/Skin Harness',
  component: SortNumbersWithHarness,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof SortNumbersWithHarness>;

export const Default: Story = {};
```

- [ ] **Step 2: Verify typecheck**

Run: `yarn typecheck`
Expected: no errors.

- [ ] **Step 3: Start Storybook and smoke-test**

Run: `yarn storybook`
Open `http://localhost:6006/?path=/story/games-sortnumbers-skin-harness--default`
Verify:

- The toolbar appears with a skin dropdown containing `Classic` and `Demo Pink`.
- Selecting `Demo Pink` changes tile/slot colours to pink.
- Clicking `onCorrectPlace` logs to console.

Stop Storybook (Ctrl-C).

- [ ] **Step 4: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx
git commit -m "feat(sort-numbers): add SkinHarness Storybook story"
```

---

## Phase J — Full Verification

### Task 20: Run the pre-push gate

- [ ] **Step 1: Lint + typecheck**

Run: `yarn lint && yarn typecheck`
Expected: clean.

- [ ] **Step 2: Unit tests**

Run: `yarn test`
Expected: all pass.

- [ ] **Step 3: Storybook tests**

In a separate terminal: `yarn storybook`
Then in the main terminal: `yarn test:storybook`
Expected: pass.

Stop Storybook.

- [ ] **Step 4: Visual regression**

Run: `yarn test:vr`
Expected: no diffs. Classic skin must render identically to before.

If diffs appear, open the diff PNG and confirm they are acceptable (they should not be — investigate).

- [ ] **Step 5: Commit any baseline updates (only if intentional)**

Only run this if VR diffs are confirmed intentional; otherwise fix the regression:

```bash
yarn test:vr:update
git add src/**/*-snapshots/
git commit -m "chore(vr): update baselines after skin-token refactor"
```

- [ ] **Step 6: Push**

```bash
git push
```

Pre-push hook runs the full gate again; expect green.
