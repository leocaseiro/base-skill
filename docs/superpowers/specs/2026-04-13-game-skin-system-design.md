# Game Skin System — Event-Driven Per-Game Visual Variants

## Summary

Design an extensible skin system that allows per-game visual variants (CSS
tokens, animations, sounds, scene backgrounds, celebration overlays) without
modifying baseskill's core game logic. Skins live in a separate GPL-licensed
repository and are imported as a package dependency. The system uses CSS custom
properties, game event callbacks, and optional render slots to keep the skin
surface thin and maintainable.

## Terminology

To avoid confusion with the existing app-wide theme system:

- **Theme** (existing) — app-wide visual identity controlled by
  `ThemeRuntimeProvider` (Ocean, Forest, Galaxy presets). Sets `--bs-*` CSS
  custom properties on `:root`. Scope: the whole application.
- **Skin** (this spec) — per-game visual variant selected per game session
  (Dino Eggs, Rocket Launch, Rainbow Arc). Sets `--skin-*` CSS custom properties
  on the game container. Scope: one game instance.

A teacher-authored game config can mix-and-match: for example, three SortNumbers
rounds with the Dino Eggs skin, followed by two WordSpell rounds with the
Caterpillar skin, all rendered under the Ocean app theme.

## Goals

- Enable full visual re-skins per game (e.g. Dino Egg Hatch, Rocket Launch,
  Rainbow Arc for SortNumbers) without duplicating game logic
- Keep baseskill (GPLv3) as the sole source of game state, input handling,
  round progression, scoring, and event bus
- Skins are selected per game session via game config (`skin: 'dino-eggs'`)
- Graceful fallback — if a skin is not registered, the `classic` default
  renders
- Support third-party skin authorship under GPL (skins import baseskill and are
  derivative works)
- Enable dual-licensing for the copyright holder's own deployments (SaaS, app
  stores)
- Preserve the existing app-wide theme system unchanged

## Non-Goals

- Skins do **not** replace interaction models (drag-and-drop, tap-in-order,
  keyboard input). Different interaction models are separate games, not skins.
- This spec does not cover Bush Glider — that is a distinct game with its own
  spatial/camera mechanics, not a SortNumbers skin.
- Runtime skin hot-swapping mid-session is not required. Skin is resolved once
  at game mount.
- This spec does not modify the app-wide theme system (`ThemeRuntimeProvider`,
  `--bs-*` tokens, theme presets).

## Licensing Strategy

### Repository Structure

```text
baseskill (GPLv3, public — npm or private registry)
    ↑ peerDependency
baseskill-premium-cloud (proprietary, private registry or git URL)
├── src/sort-numbers/dino-eggs/
├── src/sort-numbers/rocket-launch/
├── src/word-spell/caterpillar/
└── package.json  →  peerDependencies: { "baseskill": "^1.0.0" }
    ↑ dependency
baseskill-ios (proprietary, App Store / Play Store)
├── package.json  →  imports baseskill + baseskill-premium-cloud
├── Capacitor / RN native wrapper
└── deploys to iOS + Android stores

(Web/PWA build lives inside the baseskill repo for now — served from
 your own server, no GPL distribution obligation.)
```

### Why This Works

- **`baseskill-premium-cloud` imports baseskill types and hooks** →
  derivative work under GPLv3 → **third-party** skin authors must share
  source if they distribute
- **You own baseskill's copyright** and can dual-license it → your own
  `baseskill-premium-cloud` and `baseskill-ios` are not bound by GPL when
  built and shipped by you
- **Web/PWA deployment** (served from baseskill itself) has no GPL
  distribution obligation regardless (SaaS)
- **App Store distribution** of `baseskill-ios` uses the proprietary
  license grant you give yourself

### Game vs Skin Distinction

| Aspect   | Game                                            | Skin                                  |
| -------- | ----------------------------------------------- | ------------------------------------- |
| Changes  | Interaction model, spatial layout, input method | Visuals, animations, sounds, CSS      |
| Examples | Bush Glider, SortNumbers, WordSpell             | Dino Eggs, Rocket Launch, Rainbow Arc |
| Lives in | baseskill core (GPLv3)                          | Skin repo (GPL or dual-licensed)      |

## Architecture

### Skin Contract (`GameSkin` type)

```ts
export interface GameSkin {
  /** Unique identifier, e.g. 'dino-eggs' */
  id: string;
  /** Display name for UI, e.g. 'Dino Egg Hatch' */
  name: string;

  // ── CSS Token Overrides ──────────────────────────────────────────
  /** Applied as inline CSS custom properties on the game container */
  tokens: Record<string, string>;

  // ── Event Callbacks ──────────────────────────────────────────────
  // All callbacks are synchronous fire-and-forget. They trigger CSS
  // class changes, Web Animations API calls, sound playback, or
  // React state updates — none of which require the engine to wait.
  //
  // When the engine needs to pause before proceeding (e.g. to let a
  // celebration play before advancing to the next round), it uses
  // the values in `timing` below, not a return value from the
  // callback. Durations for these transitions are known upfront
  // (CSS keyframe duration, audio length) and declared, not awaited.

  /** Fired when a tile is placed correctly */
  onCorrectPlace?: (zoneIndex: number, tileValue: string) => void;
  /** Fired when a tile is placed incorrectly */
  onWrongPlace?: (zoneIndex: number, tileValue: string) => void;
  /** Fired when a wrong tile is auto-ejected */
  onTileEjected?: (zoneIndex: number) => void;
  /** Fired when a drag begins */
  onDragStart?: (tileId: string) => void;
  /** Fired when a dragged tile hovers over a zone */
  onDragOverZone?: (zoneIndex: number) => void;
  /** Fired when a round is completed (all zones correct) */
  onRoundComplete?: (roundIndex: number) => void;
  /** Fired when a level is completed */
  onLevelComplete?: (levelIndex: number) => void;
  /** Fired when the game is over */
  onGameOver?: (retryCount: number) => void;

  // ── Timing (engine delays) ───────────────────────────────────────
  /**
   * Durations (ms) for engine transitions where the skin's animation
   * needs to be visible before the engine proceeds. Each field is
   * optional; missing values fall back to baseskill defaults.
   *
   * Precedence: game config `timing` overrides ← skin `timing` ←
   * baseskill defaults.
   */
  timing?: {
    /** Between round-complete and ADVANCE_ROUND. Default: 750 */
    roundAdvanceDelay?: number;
    /** Between wrong-tile lock and EJECT_TILE. Default: 1000 */
    autoEjectDelay?: number;
    /** Between level-complete and LevelCompleteOverlay. Default: 750 */
    levelCompleteDelay?: number;
  };

  // ── Render Slots (optional React components) ─────────────────────
  /** Background scene behind the game area */
  SceneBackground?: React.ComponentType;
  /** Replaces the default GameOverOverlay */
  CelebrationOverlay?: React.ComponentType<{
    retryCount: number;
    onPlayAgain: () => void;
    onHome: () => void;
  }>;
  /** Replaces the default ScoreAnimation (round-complete effect) */
  RoundCompleteEffect?: React.ComponentType<{ visible: boolean }>;
  /** Replaces the default LevelCompleteOverlay */
  LevelCompleteOverlay?: React.ComponentType<{
    level: number;
    onNextLevel: () => void;
    onDone: () => void;
  }>;
  /**
   * Replaces the default ProgressHUD rendered at the top of the game
   * container. Override always mounts when provided, regardless of the
   * `config.hud` flag state. See
   * `2026-04-15-progress-hud-design.md` for the props contract.
   */
  ProgressHUD?: React.ComponentType<ProgressHUDProps>;
  /** Per-slot visual decoration (e.g. cracked egg shell over a filled slot) */
  slotDecoration?: (
    zone: {
      isLocked: boolean;
      isWrong: boolean;
      placedTileId: string | null;
    },
    index: number,
  ) => React.ReactNode | null;
  /** Per-tile visual decoration (e.g. speckles on egg tiles) */
  tileDecoration?: (tile: {
    id: string;
    label: string;
    value: string;
  }) => React.ReactNode | null;
}
```

### CSS Token Layer

Baseskill core components consume `--skin-*` CSS custom properties. The classic
skin provides sensible defaults. External skins override them.

App-wide theme tokens (`--bs-*`) remain unchanged and continue to be set on
`:root` by `ThemeRuntimeProvider`. Skin tokens typically reference theme tokens
in their defaults, so the classic skin follows whatever app theme is active.

#### Skin-Scoped Tokens

```css
/* Applied on .game-container by baseskill */

/* ── Tile Tokens ── */
--skin-tile-bg: var(--bs-primary);
--skin-tile-text: var(--bs-surface);
--skin-tile-radius: 0.75rem;
--skin-tile-border: transparent;
--skin-tile-shadow: 0 2px 4px rgb(0 0 0 / 10%);
--skin-tile-font-weight: 700;

/* ── Slot Tokens ── */
--skin-slot-bg: var(--bs-surface);
--skin-slot-border: var(--bs-accent);
--skin-slot-radius: 0.75rem;
--skin-slot-active-border: var(--bs-primary);

/* ── Feedback Tokens ── */
--skin-correct-color: var(--bs-success);
--skin-wrong-color: var(--bs-error);
--skin-correct-animation: pop 250ms ease-out;
--skin-wrong-animation: shake 300ms ease-in-out;

/* ── Scene Tokens ── */
--skin-scene-bg: transparent;
--skin-bank-bg: transparent;
--skin-bank-border: transparent;

/* ── Celebration Tokens ── */
--skin-celebration-emoji: '🐨';

/* ── HUD Tokens (see 2026-04-15-progress-hud-design.md) ── */
--skin-hud-bg: transparent;
--skin-hud-gap: 0.5rem;
--skin-hud-padding: 0.25rem 0.75rem;
--skin-hud-radius: 9999px;
--skin-hud-dot-size: 0.875rem;
--skin-hud-dot-fill: var(--bs-success);
--skin-hud-dot-empty: var(--bs-surface);
--skin-hud-dot-border: var(--bs-border);
--skin-hud-fraction-color: var(--bs-foreground);
--skin-hud-fraction-sep-color: var(--skin-hud-dot-fill);
--skin-hud-level-color: var(--bs-primary);
```

#### Example: Dino Eggs Override

```css
/* In the skin package: dino-eggs.css */
.skin-dino-eggs {
  --skin-tile-bg: linear-gradient(135deg, #fbbf24, #f59e0b);
  --skin-tile-radius: 50%;
  --skin-tile-border: 2px solid #92400e;
  --skin-tile-shadow: 0 3px 6px rgb(120 53 15 / 20%);

  --skin-slot-bg: #78350f;
  --skin-slot-border: #92400e;
  --skin-slot-radius: 50%;

  --skin-scene-bg: linear-gradient(180deg, #fef3c7, #a3e635, #166534);

  --skin-correct-animation: egg-crack 600ms ease-out;
  --skin-wrong-animation: egg-wobble 400ms ease-in-out;

  --skin-celebration-emoji: '🦕';
}

@keyframes egg-crack {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.05) rotate(2deg);
  }
  60% {
    transform: scale(0.95) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 0.8;
  }
}

@keyframes egg-wobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  75% {
    transform: rotate(8deg);
  }
}
```

### Game Event Bus Extensions

The existing `GameEventBus` and `GameEventType` are extended with new events
that skins can subscribe to. These events are emitted by baseskill core at the
appropriate moments.

#### New Events to Add

| Event Type            | Payload                 | Emitted By                          |
| --------------------- | ----------------------- | ----------------------------------- |
| `game:round-advance`  | `{ roundIndex }`        | `answerGameReducer` (ADVANCE_ROUND) |
| `game:level-advance`  | `{ levelIndex }`        | `answerGameReducer` (ADVANCE_LEVEL) |
| `game:drag-start`     | `{ tileId }`            | `useDraggableTile`                  |
| `game:drag-over-zone` | `{ zoneIndex }`         | `useSlotTileDrag`                   |
| `game:tile-ejected`   | `{ zoneIndex, tileId }` | `answerGameReducer` (EJECT_TILE)    |

#### Change to Existing Event

`GameEvaluateEvent` currently carries `{ answer, correct, nearMiss }` but not
the target slot. Extend it with `zoneIndex: number` so skins can animate the
specific slot that was placed into. This is a **backwards-compatible addition**
to the payload — existing subscribers continue to work.

```ts
// src/types/game-events.ts (updated)
export interface GameEvaluateEvent extends BaseGameEvent {
  type: 'game:evaluate';
  answer: string | string[] | number;
  correct: boolean;
  nearMiss: boolean;
  zoneIndex: number; // NEW — which slot was targeted
}
```

Emitters in `useTileEvaluation.ts` (both `placeTile` and `typeTile`) must pass
the `zoneIndex` they already receive as a parameter.

#### Resolving Engine Delays

The engine uses a helper to resolve timing with the correct precedence
(game config → skin → baseskill default):

```ts
// baseskill/lib/skin/resolve-timing.ts
const DEFAULT_TIMING = {
  roundAdvanceDelay: 750,
  autoEjectDelay: 1000,
  levelCompleteDelay: 750,
} as const;

export const resolveTiming = (
  key: keyof typeof DEFAULT_TIMING,
  skin: GameSkin,
  configTiming?: Partial<typeof DEFAULT_TIMING>,
): number =>
  configTiming?.[key] ?? skin.timing?.[key] ?? DEFAULT_TIMING[key];
```

Usage in the game component (replaces the hardcoded `750` / `1000`):

```ts
// After round completes, before advancing
const delay = resolveTiming('roundAdvanceDelay', skin, config.timing);
timer = setTimeout(() => {
  skin.onRoundComplete?.(roundIndex); // fire-and-forget
  dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
}, delay);
```

Callbacks fire synchronously and return immediately. The engine's pause is
driven by declared durations, not by awaited work. This removes all async
complexity, safety timeouts, and test `await` overhead.

#### How Skins Subscribe

The `useGameSkin` hook wires up event callbacks from the `GameSkin` object to
the event bus automatically:

```ts
// baseskill/lib/skin/useGameSkin.ts
export const useGameSkin = (
  gameId: string,
  skinId?: string,
): GameSkin => {
  const skin = resolveSkin(gameId, skinId); // registry lookup

  useEffect(() => {
    const bus = getGameEventBus();
    const unsubscribers: (() => void)[] = [];

    if (skin.onCorrectPlace) {
      unsubscribers.push(
        bus.subscribe('game:evaluate', (event) => {
          if (event.type === 'game:evaluate' && event.correct) {
            skin.onCorrectPlace!(event.zoneIndex, event.answer);
          }
        }),
      );
    }
    // ... wire up other callbacks

    return () => unsubscribers.forEach((fn) => fn());
  }, [skin]);

  return skin;
};
```

### Skin Registry

```ts
// baseskill/lib/skin/registry.ts

type SkinRegistry = Map<string, Map<string, GameSkin>>;
// gameId → skinId → GameSkin

const registry: SkinRegistry = new Map();

/** Register a skin for a specific game */
export const registerSkin = (gameId: string, skin: GameSkin): void => {
  let gameSkins = registry.get(gameId);
  if (!gameSkins) {
    gameSkins = new Map();
    registry.set(gameId, gameSkins);
  }
  gameSkins.set(skin.id, skin);
};

/** Get all registered skins for a game (includes 'classic') */
export const getRegisteredSkins = (gameId: string): GameSkin[] => {
  const gameSkins = registry.get(gameId);
  return gameSkins ? [...gameSkins.values()] : [classicSkin];
};

/** Resolve a skin by ID, falling back to 'classic' */
export const resolveSkin = (
  gameId: string,
  skinId?: string,
): GameSkin => {
  if (!skinId || skinId === 'classic') return classicSkin;
  const gameSkins = registry.get(gameId);
  return gameSkins?.get(skinId) ?? classicSkin;
};
```

### Skin Integration in Game Components

Each game component resolves and applies its skin at mount time:

```tsx
// baseskill/games/sort-numbers/SortNumbers.tsx (simplified)
export const SortNumbers = ({ config, ... }: SortNumbersProps) => {
  const skin = useGameSkin('sort-numbers', config.skin);

  return (
    <div
      className={`game-container skin-${skin.id}`}
      style={skin.tokens}
    >
      {skin.SceneBackground && <skin.SceneBackground />}
      <AnswerGame config={answerGameConfig}>
        <SortNumbersSession
          sortNumbersConfig={config}
          skin={skin}
          ...
        />
      </AnswerGame>
    </div>
  );
};
```

Inside `SortNumbersSession`, the skin's render slots replace defaults:

```tsx
// Round-complete effect
{
  skin.RoundCompleteEffect ? (
    <skin.RoundCompleteEffect visible={confettiReady} />
  ) : (
    <ScoreAnimation visible={confettiReady} />
  );
}

// Game over overlay
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

### Config Extension

The game config types gain an optional `skin` field:

```ts
// Added to AnswerGameConfig or per-game config types
export interface AnswerGameConfig {
  // ... existing fields
  /** Skin ID for visual variant. Falls back to 'classic' if not registered. */
  skin?: string;
  /**
   * Per-config timing overrides. Take precedence over the skin's own
   * `timing` values and the baseskill defaults. Useful for teachers who
   * want a slower pace for younger learners.
   */
  timing?: {
    roundAdvanceDelay?: number;
    autoEjectDelay?: number;
    levelCompleteDelay?: number;
  };
}
```

Teacher-authored configs can specify a different skin per round sequence. A
parent/teacher building a multi-game session might wire this up like:

```ts
// Example session config
const session = [
  {
    gameId: 'sort-numbers',
    skin: 'dino-eggs',
    direction: 'ascending',
    rounds: [...],
  },
  {
    gameId: 'sort-numbers',
    skin: 'rocket-launch',
    direction: 'descending',
    rounds: [...],
  },
  {
    gameId: 'word-spell',
    skin: 'caterpillar',
    mode: 'picture',
    rounds: [...],
  },
];
```

The config form UI shows a skin picker dropdown populated from the registry:

```ts
const skins = getRegisteredSkins('sort-numbers');
// → [classicSkin, dinoEggsSkin, rocketLaunchSkin]
//   (or just [classicSkin] if no skin package installed)
```

### Skin Package Structure

```text
@my-org/baseskill-premium-cloud/
├── src/
│   ├── sort-numbers/
│   │   ├── dino-eggs/
│   │   │   ├── index.ts            ← exports dinoEggsSkin
│   │   │   ├── dino-eggs.css       ← tokens + animations
│   │   │   ├── DinoNestBg.tsx      ← SceneBackground component
│   │   │   ├── DinoCelebration.tsx ← CelebrationOverlay component
│   │   │   └── assets/             ← SVGs, sounds
│   │   ├── rocket-launch/
│   │   │   └── ...
│   │   └── rainbow-arc/
│   │       └── ...
│   ├── word-spell/
│   │   ├── caterpillar/
│   │   ├── treasure-chest/
│   │   ├── magic-potion/
│   │   └── soup-letters/
│   └── number-match/
│       └── birthday-cake/
├── package.json
│   peerDependencies:
│     baseskill: "^1.0.0"
│     react: "^19.0.0"
└── LICENSE  (proprietary, dual-licensed for your own use)
```

### Registration in the Deployment App

```ts
// baseskill-ios/src/register-skins.ts
import { registerSkin } from 'baseskill/skin';

import { dinoEggsSkin } from '@my-org/baseskill-premium-cloud/sort-numbers/dino-eggs';
import { rocketLaunchSkin } from '@my-org/baseskill-premium-cloud/sort-numbers/rocket-launch';
import { rainbowArcSkin } from '@my-org/baseskill-premium-cloud/sort-numbers/rainbow-arc';
import { caterpillarSkin } from '@my-org/baseskill-premium-cloud/word-spell/caterpillar';
import { treasureChestSkin } from '@my-org/baseskill-premium-cloud/word-spell/treasure-chest';

registerSkin('sort-numbers', dinoEggsSkin);
registerSkin('sort-numbers', rocketLaunchSkin);
registerSkin('sort-numbers', rainbowArcSkin);
registerSkin('word-spell', caterpillarSkin);
registerSkin('word-spell', treasureChestSkin);
```

This runs once at app startup. Baseskill discovers the skins via the registry.

## Changes Required in Baseskill

### New Files

| File                             | Purpose                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `src/lib/skin/game-skin.ts`      | `GameSkin` type definition                                          |
| `src/lib/skin/registry.ts`       | Skin registry (`registerSkin`, `resolveSkin`, `getRegisteredSkins`) |
| `src/lib/skin/useGameSkin.ts`    | Hook that resolves skin and wires event callbacks                   |
| `src/lib/skin/classic-skin.ts`   | Default `classic` skin with baseline tokens                         |
| `src/lib/skin/resolve-timing.ts` | `resolveTiming` helper (config → skin → default precedence)         |

### Modified Files

| File                                              | Change                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `src/types/game-events.ts`                        | Add new event types (`game:round-advance`, `game:drag-start`, etc.) |
| `src/components/answer-game/types.ts`             | Add optional `skin?: string` to `AnswerGameConfig`                  |
| `src/components/answer-game/useTileEvaluation.ts` | Emit `game:evaluate` with `zoneIndex` in payload                    |
| `src/components/answer-game/useDraggableTile.ts`  | Emit `game:drag-start` event                                        |
| `src/components/answer-game/useSlotTileDrag.ts`   | Emit `game:drag-over-zone` event                                    |
| `src/components/answer-game/Slot/Slot.tsx`        | Consume `--skin-slot-*` tokens; render `slotDecoration`             |
| `src/components/answer-game/ScoreAnimation/`      | Support skin override via render slot                               |
| `src/components/answer-game/GameOverOverlay/`     | Support skin override via render slot                               |
| `src/games/sort-numbers/SortNumbers/`             | Integrate `useGameSkin`, apply tokens, wire render slots            |
| `src/games/word-spell/WordSpell/`                 | Same as above                                                       |
| `src/games/number-match/NumberMatch/`             | Same as above                                                       |
| `src/games/sort-numbers/SortNumbersTileBank/`     | Consume `--skin-tile-*` tokens; render `tileDecoration`             |
| `src/games/word-spell/LetterTileBank/`            | Same as above                                                       |

### Token Migration

Core components currently use Tailwind classes with `--bs-*` tokens. The change
is to add a layer of `--skin-*` tokens that default to the `--bs-*` values:

```css
/* Before: hardcoded in Tailwind */
className="bg-primary text-primary-foreground rounded-lg"

/* After: consume skin tokens */
className="game-tile"
/* where .game-tile uses var(--skin-tile-bg), var(--skin-tile-text), etc. */
```

This is backwards compatible — `--skin-tile-bg` defaults to `var(--bs-primary)`,
so the classic look is unchanged. The app-wide theme (Ocean, Galaxy, etc.)
continues to cascade through.

## Skin Development Harness (Storybook)

To allow skin authors to develop and iterate without running a full live game
session, baseskill ships one **Skin Harness** story per game. The harness
renders the game container with a chosen skin applied and provides a control
panel (toolbar) that fires each callback and transitions the engine between
phases — so the author can see what happens when `onCorrectPlace` is called,
what the `CelebrationOverlay` looks like, how a `slotDecoration` behaves on
a wrong-locked slot, etc.

### Harness Layout

```text
┌────────────────────────────────────────────────────────────────┐
│  [Skin dropdown: classic ▾]  [Theme: Ocean ▾]  [Reset]         │
│  ─── Callbacks ────────────────────────────────────────────    │
│  [onCorrectPlace] [onWrongPlace] [onTileEjected]               │
│  [onDragStart] [onDragOverZone]                                │
│  ─── Phase transitions ────────────────────────────────────    │
│  [Advance round] [Complete level] [Game over]                  │
│  ─── Timing overrides ─────────────────────────────────────    │
│  roundAdvanceDelay: [___] autoEjectDelay: [___]                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    <Game rendered here>                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Files to Add

| File                                                  | Purpose                                                 |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `src/lib/skin/SkinHarness.tsx`                        | Reusable harness component (toolbar + render area)      |
| `src/lib/skin/SkinHarness.stories.tsx`                | Generic harness story (mock game for API demonstration) |
| `src/games/sort-numbers/SortNumbers.skin.stories.tsx` | SortNumbers-specific harness preloaded with mock rounds |
| `src/games/word-spell/WordSpell.skin.stories.tsx`     | WordSpell-specific harness                              |
| `src/games/number-match/NumberMatch.skin.stories.tsx` | NumberMatch-specific harness                            |

### How It Works

The harness wraps the real game component with an outer panel that:

1. **Skin dropdown** — lists all registered skins (plus a mock injection point
   so skin authors can import their in-development skin as a Storybook arg).
2. **Theme dropdown** — switches the app-wide theme (Ocean / Forest / Galaxy)
   to verify the skin composes correctly with each.
3. **Callback buttons** — directly invoke the resolved skin's callbacks with
   representative arguments (e.g. `onCorrectPlace(0, 'A')`). No game state
   changes — this is purely for seeing what animation/visual effect the
   callback triggers.
4. **Phase transition buttons** — dispatch the real reducer actions
   (`PLACE_TILE` that completes the round, `ADVANCE_ROUND`, `COMPLETE_GAME`,
   etc.) so the author can see the render slots (`RoundCompleteEffect`,
   `CelebrationOverlay`, `LevelCompleteOverlay`) in their natural context.
5. **Timing override fields** — live-edit the resolved timing values to
   preview how the skin feels at different paces.

### Skin Author Workflow

1. Add the skin repo as a local dependency of baseskill (or develop in the
   baseskill tree during development)
2. Import the in-development skin into `SortNumbers.skin.stories.tsx` as
   a story arg
3. Open the story in Storybook
4. Click callback buttons to trigger animations; verify visuals
5. Click phase transitions to see overlays and full round-complete flow
6. Iterate CSS/animation code with HMR

This removes the need to play through a full session to verify a wrong-tile
shake or a level-complete overlay.

## Deployment Tiers & Premium Skins

Skin availability can be gated for freemium / premium tiers. The recommended
approach keeps all skin code bundled in the app and uses an **entitlements
check** at runtime to decide which registered skins appear in the picker.

### Recommended: Entitlement-Gated Registry

```ts
// baseskill-ios/src/register-skins.ts
import { registerSkin } from 'baseskill/skin';
import { currentUserEntitlements } from './auth';

const entitlements = await currentUserEntitlements(); // { tier: 'premium' }

registerSkin('sort-numbers', classicSkin); // always available
if (entitlements.tier === 'premium') {
  registerSkin('sort-numbers', dinoEggsSkin);
  registerSkin('sort-numbers', rocketLaunchSkin);
}
```

All skin code is bundled in the binary. The server decides what's visible.
Works identically on web, PWA, iOS, and Android. No App Store review issues
because no code is downloaded at runtime.

### Constraints to Be Aware Of

- **iOS App Store Review Guideline 2.5.2** prohibits downloading executable
  code that alters the primary purpose of the app. Bundling all skins and
  gating via entitlements avoids this entirely.
- A future extension — runtime-loaded skins delivered from a CDN — is only
  safe on iOS if the skin is **CSS tokens + JSON config only** (no
  JavaScript / React components). React component slots
  (`SceneBackground`, `CelebrationOverlay`, etc.) must remain bundled.
- Web and PWA deployments have no such restriction, but the entitlement
  approach is still simpler to maintain.

### Out of Scope for This Spec

- Dynamic CDN-loaded skins
- Per-skin purchase flows and IAP integration
- Entitlement API / auth design

These would be covered by a separate spec once the core skin system is
shipped and working.

## Maintainability (3-Repo Setup)

The target structure is three repositories, each with a single clear purpose:

| #   | Repo                        | License                     | Purpose                                                                           |
| --- | --------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| 1   | **baseskill**               | GPLv3 (public)              | Core engine, `GameSkin` contract, `classic` skin, `SkinHarness`                   |
| 2   | **baseskill-ios**           | Proprietary                 | iOS/Android native shell, bundles baseskill + premium skins for stores            |
| 3   | **baseskill-premium-cloud** | Proprietary (dual-licensed) | Premium skins — shipped bundled to native apps and served from CDN to the web PWA |

### Dependency Graph

```text
                 ┌──────────────────────────────┐
                 │  baseskill (GPLv3, npm/git)  │
                 │  • core engine               │
                 │  • GameSkin contract         │
                 │  • classic skin              │
                 │  • SkinHarness               │
                 └──────────────┬───────────────┘
                                │ peerDep (type imports + hooks)
                                ▼
                 ┌──────────────────────────────┐
                 │  baseskill-premium-cloud     │
                 │  • dino-eggs, rocket-launch  │
                 │  • tokens + CSS + components │
                 │  • no game logic             │
                 └──────────────┬───────────────┘
                                │ dependency
                                ▼
                 ┌──────────────────────────────┐
                 │  baseskill-ios               │
                 │  • Capacitor / RN wrapper    │
                 │  • registers bundled skins   │
                 │  • entitlements, auth, IAP   │
                 └──────────────────────────────┘

         (web/PWA build lives in baseskill itself for now —
          served from your own server, no distribution obligation)
```

### Where Logic Lives

| Concern                                 | baseskill | premium-cloud | ios |
| --------------------------------------- | :-------: | :-----------: | :-: |
| Game state, reducer, event bus          |     ✓     |               |     |
| Input handling (drag, keyboard, touch)  |     ✓     |               |     |
| `GameSkin` contract + `classic` skin    |     ✓     |               |     |
| `SkinHarness` component                 |     ✓     |               |     |
| Web/PWA build + deployment              |     ✓     |               |     |
| Custom CSS tokens, animations, sounds   |           |       ✓       |     |
| `SceneBackground`, `CelebrationOverlay` |           |       ✓       |     |
| Skin event callbacks                    |           |       ✓       |     |
| Native wrapper (Capacitor / RN)         |           |               |  ✓  |
| Entitlements, auth, IAP, push           |           |               |  ✓  |
| Skin registration for native builds     |           |               |  ✓  |

Key rule: **premium-cloud is thin** — just CSS + React components + callbacks.
No game logic, no state, no dispatch.

### Why Three, Not Two or Four?

- Folding **premium-cloud into ios** (two repos) would mean skins can't be
  served to the web PWA. You'd need to duplicate them.
- Folding **premium-cloud into baseskill** would force your commercial skins
  under GPL — defeats the dual-licensing strategy.
- Splitting **ios into separate ios + android + web** is premature. One
  native-wrapper repo (Capacitor supports both platforms from a single
  codebase) is enough until there's platform-specific divergence.

### Dev Workflow to Avoid Pain

- **Use yarn/pnpm workspaces locally.** Clone all three repos as siblings;
  workspaces links them. No `npm link` dance, no publish-to-test.
- **Storybook harness is the primary skin dev surface.** 90% of skin work
  happens in baseskill's Storybook, importing the in-development skin as
  a story arg. No native build needed.
- **Semver discipline on baseskill.** Breaking changes = major bump.
  premium-cloud pins `peerDependencies: { baseskill: "^2.x" }`.
- **CI in premium-cloud typechecks against latest baseskill.** Catches
  breaking changes before users do.
- **ios repo is thin** — shouldn't need frequent changes once set up.

### Versioning Discipline

```text
baseskill 1.0.0 → 1.1.0   (new optional callback — additive, non-breaking)
baseskill 1.1.0 → 2.0.0   (rename callback — breaking)

premium-cloud bumps peerDep, tests, publishes premium-cloud 2.0.0
ios bumps both, tests, rebuilds, ships to App Store
```

Most baseskill changes are additive (new optional callbacks, new render
slots). Breaking changes should be rare once the contract stabilises.

### What NOT to Do

- **Don't put game logic in premium-cloud.** If you reach for a reducer or
  dispatch, the feature belongs in baseskill.
- **Don't put premium skin code in baseskill.** Core ships with only the
  `classic` skin and the contract.
- **Don't fork baseskill** to add private features. Extend the contract in
  baseskill (staying GPL), then build on top in premium-cloud.
- **Don't publish premium-cloud to public npm.** Either keep it on a
  private registry (GitHub Packages private / Verdaccio / JFrog) or
  install via a git URL.

## Accessibility

- All skin token overrides must maintain WCAG AA contrast ratios
- Skins that provide custom animations must respect `prefers-reduced-motion`
  via `@media (prefers-reduced-motion: reduce)` in their CSS
- Render slot components (CelebrationOverlay, SceneBackground) must include
  appropriate ARIA attributes (`role`, `aria-label`, `aria-live`)
- The classic skin serves as the accessibility baseline — it has been validated
  against axe and WCAG AA

## Testing Strategy

- **Baseskill core tests** verify that `useGameSkin` correctly resolves skins,
  applies tokens, and wires event callbacks
- **Skin registry tests** verify registration, lookup, and fallback behaviour
- **Skin package tests** (in the skin repo) verify that each skin's CSS tokens
  produce valid styles and that event callbacks fire without errors
- **Visual regression tests** in baseskill verify the classic skin is unchanged
- **Visual regression tests** in the skin repo verify each variant's appearance
  (requires baseskill as a dev dependency)
- **Storybook stories** in baseskill can render games with mock skins to
  demonstrate the skinning API

## Future Expansion (TODO)

The callback surface and render slots listed above are the initial set. The
following additions are planned as baseskill grows — they should be wired in
the same pattern (optional fire-and-forget callbacks returning `void`,
optional `React.ComponentType` render slots, and optional `timing` fields for
any new engine delays they introduce) and documented here when added:

- **`onDropOnBank`** — fired when a dragged slot tile is dropped back onto the
  bank area (empty space). Already emitted by in-flight branches; to be picked
  up during rebase.
- **`onDropOnBankTile`** — fired when a dragged slot tile is swapped with a
  bank tile via `SWAP_SLOT_BANK`. Already emitted by in-flight branches; to be
  picked up during rebase.
- **`ProgressBar`** (render slot) — replaces the default round/level progress
  indicator. Skin authors want full control over how progression is visualised
  (e.g. a filling rainbow arc, a rocket ascending a gauge).
- **`ScoreBoard`** (render slot) — replaces the default score/retry display.
  Useful for thematic scoring UIs (e.g. hatched-dino counter, stars earned).
- **`EncouragementAnnouncer`** (render slot + callbacks) — replaces the
  existing `EncouragementAnnouncer` with a skin-aware variant, plus
  `onEncouragement?: (kind: 'positive' | 'retry') => void` callbacks for
  skin-specific reactions (e.g. a firefly swarm, a baby dino cheering).

When these land, update the `GameSkin` type and the "Changes Required in
Baseskill" table in this spec. The principle is the same: add to the surface,
default to `void`/`undefined` so existing skins remain valid.

## Resolved Decisions

- **`game:evaluate` includes `zoneIndex`** — confirmed 2026-04-14. The
  payload gains `zoneIndex: number` so skins can animate the specific slot
  that was placed into. Backwards-compatible addition.
- **Animation token format: shorthand** — confirmed 2026-04-14. Skins
  declare a single `--skin-correct-animation` / `--skin-wrong-animation`
  value using the full CSS `animation` shorthand
  (e.g. `egg-crack 600ms ease-out`). Keeps the skin surface small; can be
  split into composed tokens later if real cases require it.
- **Sound overrides via callback, with baseskill helpers exported** —
  confirmed 2026-04-14. Skins own audio by implementing `onCorrectPlace`
  (etc.) and calling the baseskill-exported `playSound` / `queueSound` /
  `speak` helpers. See "Audio & Voice Extension Points" below.
- **Skin is bound to one game at registration time** — confirmed
  2026-04-14. Skins do not declare multi-game support in metadata. To
  share a visual identity across games, export two skin objects that
  import common CSS/assets and call `registerSkin` twice.

## Audio & Voice Extension Points

Callbacks give skins full control over audio. To make this ergonomic,
baseskill exposes its audio/speech helpers as a public API so skins can
reuse, extend, or replace the defaults.

### New Exports from Baseskill

| Export                        | Path               | Purpose                                                                  |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `playSound(key, volume?)`     | `baseskill/audio`  | Existing — plays a preset sound (`correct`, `wrong`, etc.)               |
| `playSoundUrl(url, volume?)`  | `baseskill/audio`  | NEW — plays a custom audio URL through the same queue / cancel machinery |
| `queueSound(key, volume?)`    | `baseskill/audio`  | Existing — queues a preset sound                                         |
| `queueSoundUrl(url, volume?)` | `baseskill/audio`  | NEW — queues a custom audio URL                                          |
| `whenSoundEnds()`             | `baseskill/audio`  | Existing — promise that resolves when the audio queue drains             |
| `speak(text, options?)`       | `baseskill/speech` | Existing — TTS with voice/rate/pitch options                             |
| `SOUND_KEYS`                  | `baseskill/audio`  | NEW — the preset key list, so skins can extend/fall back cleanly         |

### Default Behaviour (Classic Skin)

`useTileEvaluation` calls `playSound(correct ? 'correct' : 'wrong')` today.
When a skin provides `onCorrectPlace` / `onWrongPlace`, the default sound
is still played unless the skin opts out (see below).

### Opting Out of Default Sounds

A `suppressDefaultSounds?: boolean` flag on `GameSkin` tells the engine to
skip the built-in correct/wrong beep so the skin owns the audio entirely:

```ts
export interface GameSkin {
  // ... existing fields

  /** When true, engine suppresses default correct/wrong sound effects.
   *  The skin takes full ownership via its callbacks. */
  suppressDefaultSounds?: boolean;
}
```

### Skin Authoring Examples

**Extend the default** (play default beep + a custom layer):

```ts
import { playSound, playSoundUrl } from 'baseskill/audio';
import crackSound from './assets/egg-crack.mp3';

export const dinoEggsSkin: GameSkin = {
  // ... tokens
  onCorrectPlace: () => {
    // default beep still plays (no suppressDefaultSounds)
    playSoundUrl(crackSound, 0.6);
  },
};
```

**Replace the default entirely**:

```ts
import { playSoundUrl } from 'baseskill/audio';
import hatchSound from './assets/hatch.mp3';
import wobbleSound from './assets/wobble.mp3';

export const dinoEggsSkin: GameSkin = {
  // ... tokens
  suppressDefaultSounds: true, // silence built-in beeps
  onCorrectPlace: () => playSoundUrl(hatchSound),
  onWrongPlace: () => playSoundUrl(wobbleSound),
};
```

**Override voice for TTS flavour**:

```ts
import { speak } from 'baseskill/speech';

export const pirateTreasureSkin: GameSkin = {
  // ... tokens
  onRoundComplete: () => {
    speak('Arrr, ye found the treasure!', {
      voice: 'Daniel (en-GB)',
      rate: 0.9,
      pitch: 0.7,
    });
  },
  onCorrectPlace: () => {
    speak('Aye!', { voice: 'Daniel (en-GB)', rate: 1.1 });
  },
};
```

### Additions to "New Files" / "Modified Files" Tables

- Add a new file `src/lib/audio/playSoundUrl.ts` (and `queueSoundUrl`)
  exposing URL-based variants of the existing queue functions.
- Export `SOUND_KEYS`, `playSound`, `playSoundUrl`, `queueSound`,
  `queueSoundUrl`, `whenSoundEnds` from a stable `baseskill/audio` path.
- Export `speak` from a stable `baseskill/speech` path.
- Add `suppressDefaultSounds?: boolean` to `GameSkin`.
- Update `useTileEvaluation.ts` to skip the default `playSound` call when
  the resolved skin has `suppressDefaultSounds: true`.
