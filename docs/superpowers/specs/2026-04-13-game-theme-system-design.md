# Game Theme System — Event-Driven Skinning Architecture

## Summary

Design an extensible theming system that allows per-game visual skins (CSS tokens,
animations, sounds, scene backgrounds, celebration overlays) without modifying
baseskill's core game logic. Themes live in a separate GPL-licensed repository and
are imported as a package dependency. The system uses CSS custom properties, game
event callbacks, and optional render slots to keep the theme surface thin and
maintainable.

## Goals

- Enable full visual re-skins per game (e.g. Dino Egg Hatch, Rocket Launch,
  Rainbow Arc for SortNumbers) without duplicating game logic
- Keep baseskill (GPLv3) as the sole source of game state, input handling, round
  progression, scoring, and event bus
- Themes are selected per game session via game config (`theme: 'dino-eggs'`)
- Graceful fallback — if a theme is not registered, the `classic` default renders
- Support third-party theme authorship under GPL (themes import baseskill and are
  derivative works)
- Enable dual-licensing for the copyright holder's own deployments (SaaS, app
  stores)

## Non-Goals

- Themes do **not** replace interaction models (drag-and-drop, tap-in-order,
  keyboard input). Different interaction models are separate games, not themes.
- This spec does not cover Bush Glider — that is a distinct game with its own
  spatial/camera mechanics, not a SortNumbers skin.
- Runtime theme hot-swapping mid-session is not required. Theme is resolved once
  at game mount.

## Licensing Strategy

### Repository Structure

```text
baseskill (GPLv3, npm package)
    ↑ peerDependency
my-themes (GPL-3.0, separate repo)
├── src/sort-numbers/dino-eggs/
├── src/sort-numbers/rocket-launch/
├── src/word-spell/caterpillar/
└── package.json  →  peerDependencies: { "baseskill": "^1.0.0" }

my-app (private, deployment shell)
├── package.json  →  imports baseskill + my-themes
├── vite.config.ts
└── deploys to web / app stores
```

### Why This Works

- **Theme repo imports baseskill types and hooks** → derivative work under GPLv3 →
  third-party theme authors must share source
- **Copyright holder (you) can dual-license baseskill** → your own theme repo is
  not bound by GPL for your own deployments
- **SaaS deployment** (web/PWA) has no GPL distribution obligation regardless
- **App Store distribution** uses the proprietary license grant

### Game vs Theme Distinction

| Aspect   | Game                                            | Theme                                 |
| -------- | ----------------------------------------------- | ------------------------------------- |
| Changes  | Interaction model, spatial layout, input method | Visuals, animations, sounds, CSS      |
| Examples | Bush Glider, SortNumbers, WordSpell             | Dino Eggs, Rocket Launch, Rainbow Arc |
| Lives in | baseskill core (GPLv3)                          | Theme repo (GPL or dual-licensed)     |

## Architecture

### Theme Contract (`GameTheme` type)

```ts
export interface GameTheme {
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
  // await if the Promise never settles, so a buggy theme cannot
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

Baseskill core components consume `--game-*` CSS custom properties. The classic
theme provides sensible defaults. External themes override them.

#### Game-Scoped Tokens

```css
/* Applied on .game-container by baseskill */

/* ── Tile Tokens ── */
--game-tile-bg: var(--bs-primary);
--game-tile-text: var(--bs-surface);
--game-tile-radius: 0.75rem;
--game-tile-border: transparent;
--game-tile-shadow: 0 2px 4px rgb(0 0 0 / 10%);
--game-tile-font-weight: 700;

/* ── Slot Tokens ── */
--game-slot-bg: var(--bs-surface);
--game-slot-border: var(--bs-accent);
--game-slot-radius: 0.75rem;
--game-slot-active-border: var(--bs-primary);

/* ── Feedback Tokens ── */
--game-correct-color: var(--bs-success);
--game-wrong-color: var(--bs-error);
--game-correct-animation: pop 250ms ease-out;
--game-wrong-animation: shake 300ms ease-in-out;

/* ── Scene Tokens ── */
--game-scene-bg: transparent;
--game-bank-bg: transparent;
--game-bank-border: transparent;

/* ── Celebration Tokens ── */
--game-celebration-emoji: '🐨';
```

#### Example: Dino Eggs Override

```css
/* In the theme package: dino-eggs.css */
.theme-dino-eggs {
  --game-tile-bg: linear-gradient(135deg, #fbbf24, #f59e0b);
  --game-tile-radius: 50%;
  --game-tile-border: 2px solid #92400e;
  --game-tile-shadow: 0 3px 6px rgb(120 53 15 / 20%);

  --game-slot-bg: #78350f;
  --game-slot-border: #92400e;
  --game-slot-radius: 50%;

  --game-scene-bg: linear-gradient(180deg, #fef3c7, #a3e635, #166534);

  --game-correct-animation: egg-crack 600ms ease-out;
  --game-wrong-animation: egg-wobble 400ms ease-in-out;

  --game-celebration-emoji: '🦕';
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

The existing `GameEventBus` and `GameEventType` are extended with new events that
themes can subscribe to. These events are emitted by baseskill core at the
appropriate moments.

#### New Events to Add

| Event Type            | Payload                 | Emitted By                          |
| --------------------- | ----------------------- | ----------------------------------- |
| `game:round-advance`  | `{ roundIndex }`        | `answerGameReducer` (ADVANCE_ROUND) |
| `game:level-advance`  | `{ levelIndex }`        | `answerGameReducer` (ADVANCE_LEVEL) |
| `game:drag-start`     | `{ tileId }`            | `useDraggableTile`                  |
| `game:drag-over-zone` | `{ zoneIndex }`         | `useSlotTileDrag`                   |
| `game:tile-ejected`   | `{ zoneIndex, tileId }` | `answerGameReducer` (EJECT_TILE)    |

#### Awaiting Theme Callbacks

The engine uses a helper to safely await theme callbacks with a timeout:

```ts
// baseskill/lib/theme/await-theme-callback.ts
const DEFAULT_TIMEOUT_MS = 5_000;

export const awaitThemeCallback = async (
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
await awaitThemeCallback(theme.onRoundComplete?.(roundIndex));
dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
```

If the theme returns `void`, `awaitThemeCallback` returns immediately (same
behaviour as today). If it returns a Promise, the engine waits up to 5 s.
Drag events (`onDragStart`, `onDragOverZone`) are fire-and-forget and never
awaited — they must not block interaction.

#### How Themes Subscribe

The `useGameTheme` hook wires up event callbacks from the `GameTheme` object to
the event bus automatically:

```ts
// baseskill/lib/theme/useGameTheme.ts
export const useGameTheme = (
  gameId: string,
  themeId?: string,
): GameTheme => {
  const theme = resolveTheme(gameId, themeId); // registry lookup

  useEffect(() => {
    const bus = getGameEventBus();
    const unsubscribers: (() => void)[] = [];

    if (theme.onCorrectPlace) {
      unsubscribers.push(
        bus.subscribe('game:evaluate', (event) => {
          if (event.type === 'game:evaluate' && event.correct) {
            theme.onCorrectPlace!(event.zoneIndex, event.answer);
          }
        }),
      );
    }
    // ... wire up other callbacks

    return () => unsubscribers.forEach((fn) => fn());
  }, [theme]);

  return theme;
};
```

### Theme Registry

```ts
// baseskill/lib/theme/registry.ts

type ThemeRegistry = Map<string, Map<string, GameTheme>>;
// gameId → themeId → GameTheme

const registry: ThemeRegistry = new Map();

/** Register a theme for a specific game */
export const registerTheme = (
  gameId: string,
  theme: GameTheme,
): void => {
  let gameThemes = registry.get(gameId);
  if (!gameThemes) {
    gameThemes = new Map();
    registry.set(gameId, gameThemes);
  }
  gameThemes.set(theme.id, theme);
};

/** Get all registered themes for a game (includes 'classic') */
export const getRegisteredThemes = (gameId: string): GameTheme[] => {
  const gameThemes = registry.get(gameId);
  return gameThemes ? [...gameThemes.values()] : [classicTheme];
};

/** Resolve a theme by ID, falling back to 'classic' */
export const resolveTheme = (
  gameId: string,
  themeId?: string,
): GameTheme => {
  if (!themeId || themeId === 'classic') return classicTheme;
  const gameThemes = registry.get(gameId);
  return gameThemes?.get(themeId) ?? classicTheme;
};
```

### Theme Integration in Game Components

Each game component resolves and applies its theme at mount time:

```tsx
// baseskill/games/sort-numbers/SortNumbers.tsx (simplified)
export const SortNumbers = ({ config, ... }: SortNumbersProps) => {
  const theme = useGameTheme('sort-numbers', config.theme);

  return (
    <div
      className="game-container"
      style={theme.tokens}  // CSS custom properties applied here
    >
      {theme.SceneBackground && <theme.SceneBackground />}
      <AnswerGame config={answerGameConfig}>
        <SortNumbersSession
          sortNumbersConfig={config}
          theme={theme}
          ...
        />
      </AnswerGame>
    </div>
  );
};
```

Inside `SortNumbersSession`, the theme's render slots replace defaults:

```tsx
// Round-complete effect
{
  theme.RoundCompleteEffect ? (
    <theme.RoundCompleteEffect visible={confettiReady} />
  ) : (
    <ScoreAnimation visible={confettiReady} />
  );
}

// Game over overlay
{
  gameOverReady ? (
    theme.CelebrationOverlay ? (
      <theme.CelebrationOverlay
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

The game config types gain an optional `theme` field:

```ts
// Added to AnswerGameConfig or per-game config types
export interface AnswerGameConfig {
  // ... existing fields
  /** Theme ID for visual skin. Falls back to 'classic' if not registered. */
  theme?: string;
}
```

The config form UI shows a theme picker dropdown populated from the registry:

```ts
const themes = getRegisteredThemes('sort-numbers');
// → [classicTheme, dinoEggsTheme, rocketLaunchTheme]
//   (or just [classicTheme] if no theme package installed)
```

### Theme Package Structure

```text
@my-org/baseskill-themes/
├── src/
│   ├── sort-numbers/
│   │   ├── dino-eggs/
│   │   │   ├── index.ts           ← exports dinoEggsTheme
│   │   │   ├── dino-eggs.css      ← tokens + animations
│   │   │   ├── DinoNestBg.tsx     ← SceneBackground component
│   │   │   ├── DinoCelebration.tsx ← CelebrationOverlay component
│   │   │   └── assets/            ← SVGs, sounds
│   │   ├── rocket-launch/
│   │   │   ├── index.ts
│   │   │   ├── rocket-launch.css
│   │   │   ├── StarFieldBg.tsx
│   │   │   └── RocketCelebration.tsx
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
// my-app/src/register-themes.ts
import { registerTheme } from 'baseskill/theme';

// Sort Numbers themes
import { dinoEggsTheme } from '@my-org/baseskill-themes/sort-numbers/dino-eggs';
import { rocketLaunchTheme } from '@my-org/baseskill-themes/sort-numbers/rocket-launch';
import { rainbowArcTheme } from '@my-org/baseskill-themes/sort-numbers/rainbow-arc';

// Word Spell themes
import { caterpillarTheme } from '@my-org/baseskill-themes/word-spell/caterpillar';
import { treasureChestTheme } from '@my-org/baseskill-themes/word-spell/treasure-chest';

registerTheme('sort-numbers', dinoEggsTheme);
registerTheme('sort-numbers', rocketLaunchTheme);
registerTheme('sort-numbers', rainbowArcTheme);
registerTheme('word-spell', caterpillarTheme);
registerTheme('word-spell', treasureChestTheme);
```

This runs once at app startup. Baseskill discovers the themes via the registry.

## Changes Required in Baseskill

### New Files

| File                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/theme/game-theme.ts`           | `GameTheme` type definition                                             |
| `src/lib/theme/registry.ts`             | Theme registry (`registerTheme`, `resolveTheme`, `getRegisteredThemes`) |
| `src/lib/theme/useGameTheme.ts`         | Hook that resolves theme and wires event callbacks                      |
| `src/lib/theme/classic-theme.ts`        | Default `classic` theme with baseline tokens                            |
| `src/lib/theme/await-theme-callback.ts` | `awaitThemeCallback` helper (Promise.race with safety timeout)          |

### Modified Files

| File                                              | Change                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `src/types/game-events.ts`                        | Add new event types (`game:round-advance`, `game:drag-start`, etc.) |
| `src/components/answer-game/types.ts`             | Add optional `theme?: string` to `AnswerGameConfig`                 |
| `src/components/answer-game/useTileEvaluation.ts` | Emit `game:evaluate` with `zoneIndex` in payload                    |
| `src/components/answer-game/useDraggableTile.ts`  | Emit `game:drag-start` event                                        |
| `src/components/answer-game/useSlotTileDrag.ts`   | Emit `game:drag-over-zone` event                                    |
| `src/components/answer-game/Slot/Slot.tsx`        | Consume `--game-slot-*` tokens; render `slotDecoration`             |
| `src/components/answer-game/ScoreAnimation/`      | Support theme override via render slot                              |
| `src/components/answer-game/GameOverOverlay/`     | Support theme override via render slot                              |
| `src/games/sort-numbers/SortNumbers/`             | Integrate `useGameTheme`, apply tokens, wire render slots           |
| `src/games/word-spell/WordSpell/`                 | Same as above                                                       |
| `src/games/number-match/NumberMatch/`             | Same as above                                                       |
| `src/games/sort-numbers/SortNumbersTileBank/`     | Consume `--game-tile-*` tokens; render `tileDecoration`             |
| `src/games/word-spell/LetterTileBank/`            | Same as above                                                       |

### Token Migration

Core components currently use Tailwind classes with `--bs-*` tokens. The change is
to add a layer of `--game-*` tokens that default to the `--bs-*` values:

```css
/* Before: hardcoded in Tailwind */
className="bg-primary text-primary-foreground rounded-lg"

/* After: consume game tokens */
className="game-tile"
/* where .game-tile uses var(--game-tile-bg), var(--game-tile-text), etc. */
```

This is backwards compatible — `--game-tile-bg` defaults to `var(--bs-primary)`,
so the classic look is unchanged.

## Accessibility

- All theme token overrides must maintain WCAG AA contrast ratios
- Themes that provide custom animations must respect `prefers-reduced-motion`
  via `@media (prefers-reduced-motion: reduce)` in their CSS
- Render slot components (CelebrationOverlay, SceneBackground) must include
  appropriate ARIA attributes (`role`, `aria-label`, `aria-live`)
- The classic theme serves as the accessibility baseline — it has been validated
  against axe and WCAG AA

## Testing Strategy

- **Baseskill core tests** verify that `useGameTheme` correctly resolves themes,
  applies tokens, and wires event callbacks
- **Theme registry tests** verify registration, lookup, and fallback behaviour
- **Theme package tests** (in the theme repo) verify that each theme's CSS tokens
  produce valid styles and that event callbacks fire without errors
- **Visual regression tests** in baseskill verify the classic theme is unchanged
- **Visual regression tests** in the theme repo verify each skin's appearance
  (requires baseskill as a dev dependency)
- **Storybook stories** in baseskill can render games with mock themes to
  demonstrate the theming API

## Open Questions

1. **Should `game:evaluate` include `zoneIndex`?** Currently it includes `answer`
   (the tile value) but not which zone was targeted. Themes need `zoneIndex` to
   animate the correct slot. Recommendation: add it.
2. **Animation token format** — should `--game-correct-animation` be a full CSS
   `animation` shorthand, or split into `--game-correct-animation-name` and
   `--game-correct-animation-duration`? Shorthand is simpler; split is more
   composable.
3. **Sound overrides** — should themes provide sound file URLs via tokens (e.g.
   `--game-correct-sound: url(...)`) or via callback (`onCorrectPlace` calls
   `playSound`)? Callbacks are more flexible. Recommendation: callbacks.
4. **Theme metadata** — should themes declare which games they support, or is
   registration-time binding (`registerTheme('sort-numbers', theme)`) sufficient?
   Registration-time binding is simpler and avoids metadata drift.
