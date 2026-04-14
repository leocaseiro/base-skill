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
baseskill (GPLv3, npm package)
    ↑ peerDependency
my-skins (GPL-3.0, separate repo)
├── src/sort-numbers/dino-eggs/
├── src/sort-numbers/rocket-launch/
├── src/word-spell/caterpillar/
└── package.json  →  peerDependencies: { "baseskill": "^1.0.0" }

my-app (private, deployment shell)
├── package.json  →  imports baseskill + my-skins
├── vite.config.ts
└── deploys to web / app stores
```

### Why This Works

- **Skin repo imports baseskill types and hooks** → derivative work under GPLv3
  → third-party skin authors must share source
- **Copyright holder (you) can dual-license baseskill** → your own skin repo is
  not bound by GPL for your own deployments
- **SaaS deployment** (web/PWA) has no GPL distribution obligation regardless
- **App Store distribution** uses the proprietary license grant

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
  // All callbacks may return a Promise. When they do, the engine
  // awaits the Promise before proceeding (e.g. advancing rounds,
  // ejecting tiles). A safety timeout (default 5 s) resolves the
  // await if the Promise never settles, so a buggy skin cannot
  // freeze the game.
  //
  // Return void (or undefined) for fire-and-forget behaviour —
  // the engine proceeds immediately.

  /** Fired when a tile is placed correctly */
  onCorrectPlace?: (
    zoneIndex: number,
    tileValue: string,
  ) => Promise<void> | void;
  /** Fired when a tile is placed incorrectly */
  onWrongPlace?: (
    zoneIndex: number,
    tileValue: string,
  ) => Promise<void> | void;
  /** Fired when a wrong tile is auto-ejected */
  onTileEjected?: (zoneIndex: number) => Promise<void> | void;
  /** Fired when a drag begins (fire-and-forget, not awaited) */
  onDragStart?: (tileId: string) => void;
  /** Fired when a dragged tile hovers over a zone (fire-and-forget) */
  onDragOverZone?: (zoneIndex: number) => void;
  /** Fired when a round is completed (all zones correct) */
  onRoundComplete?: (roundIndex: number) => Promise<void> | void;
  /** Fired when a level is completed */
  onLevelComplete?: (levelIndex: number) => Promise<void> | void;
  /** Fired when the game is over */
  onGameOver?: (retryCount: number) => Promise<void> | void;

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

#### Awaiting Skin Callbacks

The engine uses a helper to safely await skin callbacks with a timeout:

```ts
// baseskill/lib/skin/await-skin-callback.ts
const DEFAULT_TIMEOUT_MS = 5_000;

export const awaitSkinCallback = async (
  result: Promise<void> | void,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> => {
  if (!result) return; // void — fire-and-forget, proceed immediately
  await Promise.race([
    result,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
};
```

Usage in the game component:

```ts
// After round completes, before advancing
await awaitSkinCallback(skin.onRoundComplete?.(roundIndex));
dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
```

If the skin returns `void`, `awaitSkinCallback` returns immediately (same
behaviour as today). If it returns a Promise, the engine waits up to 5 s.
Drag events (`onDragStart`, `onDragOverZone`) are fire-and-forget and never
awaited — they must not block interaction.

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
@my-org/baseskill-skins/
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
└── LICENSE  (GPL-3.0)
```

### Registration in the Deployment App

```ts
// my-app/src/register-skins.ts
import { registerSkin } from 'baseskill/skin';

import { dinoEggsSkin } from '@my-org/baseskill-skins/sort-numbers/dino-eggs';
import { rocketLaunchSkin } from '@my-org/baseskill-skins/sort-numbers/rocket-launch';
import { rainbowArcSkin } from '@my-org/baseskill-skins/sort-numbers/rainbow-arc';
import { caterpillarSkin } from '@my-org/baseskill-skins/word-spell/caterpillar';
import { treasureChestSkin } from '@my-org/baseskill-skins/word-spell/treasure-chest';

registerSkin('sort-numbers', dinoEggsSkin);
registerSkin('sort-numbers', rocketLaunchSkin);
registerSkin('sort-numbers', rainbowArcSkin);
registerSkin('word-spell', caterpillarSkin);
registerSkin('word-spell', treasureChestSkin);
```

This runs once at app startup. Baseskill discovers the skins via the registry.

## Changes Required in Baseskill

### New Files

| File                                  | Purpose                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| `src/lib/skin/game-skin.ts`           | `GameSkin` type definition                                          |
| `src/lib/skin/registry.ts`            | Skin registry (`registerSkin`, `resolveSkin`, `getRegisteredSkins`) |
| `src/lib/skin/useGameSkin.ts`         | Hook that resolves skin and wires event callbacks                   |
| `src/lib/skin/classic-skin.ts`        | Default `classic` skin with baseline tokens                         |
| `src/lib/skin/await-skin-callback.ts` | `awaitSkinCallback` helper (Promise.race with safety timeout)       |

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
the same pattern (optional `Promise<void> | void` callbacks, optional
`React.ComponentType` render slots) and documented here when added:

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
  `onEncouragement?: (kind: 'positive' | 'retry') => Promise<void> | void`
  callbacks for skin-specific reactions (e.g. a firefly swarm, a baby dino
  cheering).

When these land, update the `GameSkin` type and the "Changes Required in
Baseskill" table in this spec. The principle is the same: add to the surface,
default to `void`/`undefined` so existing skins remain valid.

## Open Questions

1. **Should `game:evaluate` include `zoneIndex`?** Currently it includes
   `answer` (the tile value) but not which zone was targeted. Skins need
   `zoneIndex` to animate the correct slot. Recommendation: add it.
2. **Animation token format** — should `--skin-correct-animation` be a full CSS
   `animation` shorthand, or split into `--skin-correct-animation-name` and
   `--skin-correct-animation-duration`? Shorthand is simpler; split is more
   composable.
3. **Sound overrides** — should skins provide sound file URLs via tokens (e.g.
   `--skin-correct-sound: url(...)`) or via callback (`onCorrectPlace` calls
   `playSound`)? Callbacks are more flexible. Recommendation: callbacks.
4. **Skin metadata** — should skins declare which games they support, or is
   registration-time binding (`registerSkin('sort-numbers', skin)`) sufficient?
   Registration-time binding is simpler and avoids metadata drift.
