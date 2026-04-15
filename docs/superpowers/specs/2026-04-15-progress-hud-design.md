# Progress HUD — In-Game Session Progress Indicator

## Summary

Add a Progress HUD to every `AnswerGame`-based game (WordSpell, NumberMatch,
SortNumbers). The HUD shows where the player is in the current session using
three composable visual elements: a row of bullet dots, a "3/5" fraction label,
and a "LEVEL 3" label for unbounded level-mode games. Skins can fully replace
the default HUD component or restyle it via CSS custom properties.

The HUD is the first of several progression-related work streams. Persistent
progress (writes to the `progress` collection), session-recorder wiring for the
`AnswerGame` path, and adaptive difficulty are explicitly **out of scope** and
handled in later specs.

## Terminology

- **HUD** — the heads-up display pinned to the top of the game container that
  shows live session progress. Scope: one game instance.
- **Dots** — the bullet row that visually represents round progress for
  pre-readers. One dot per round; fill state indicates completion.
- **Fraction** — a text label like `3/5` showing "round 3 of 5". Only applies
  when `totalRounds` is known.
- **Level label** — a text label like `LEVEL 3` used by level-mode games where
  total rounds is unbounded.

## Goals

- Give young children a visual sense of how much of a session is left without
  requiring number literacy
- Give older children and parents a precise "N of M" readout when useful
- Work for both classic rounds-mode games (WordSpell, NumberMatch) and
  unbounded level-mode games (SortNumbers)
- Let each game config or skin toggle each HUD element independently
- Let skins restyle the HUD with CSS tokens, or replace it entirely with a
  custom component
- Require zero per-game wiring — `AnswerGame` renders the HUD automatically
- Preserve the existing app-wide theme and skin systems unchanged

## Non-Goals

- ❌ Writes to the `progress` collection (`lastScore`, `bestScore`,
  `totalStars`, `lastPlayedAt`, `completionCount`). Separate future spec.
- ❌ Wiring `useSessionRecorder` into the `AnswerGame` code path. The HUD reads
  live state from `AnswerGameState`; it does not touch `session_history`.
- ❌ Difficulty progression (PRD §8 easy/medium/hard + adaptive streak) — this
  remains deferred in favor of the existing `levelMode.generateNextLevel`
  mechanism.
- ❌ Dashboard "recents" row or any consumer of persisted progress.
- ❌ Additional reference games beyond the three shipped today (Letter Tracing,
  Read Aloud, Math Facts are deferred to a later milestone).

## Architecture

Three layers, each independently overridable:

1. **Default `ProgressHUD` component** lives in baseskill core. It reads
   `AnswerGameState` via `useAnswerGameContext`, resolves which elements to
   render from config, and emits a small set of DOM elements styled by CSS
   tokens.
2. **Skin slot** `GameSkin.ProgressHUD?: React.ComponentType<ProgressHUDProps>`
   lets a skin replace the default entirely — for example, a dino-eggs skin
   could show a row of tiny eggs hatching in place of dots.
3. **CSS tokens** on the game container drive the default component's colours
   and sizes. Skins that only tweak visuals can set tokens without touching
   React.

Precedence (highest wins):

1. `skin.ProgressHUD` component override
2. Default `ProgressHUD` styled via `--skin-hud-*` tokens
3. Baseskill built-in token defaults

### Auto-render

`AnswerGame` renders the HUD as the first child of the game container.
Individual games (WordSpell, NumberMatch, SortNumbers) need no code changes —
they keep using `<AnswerGame.Question>` / `.Answer` / `.Choices` as today.

```tsx
// Inside AnswerGame
return (
  <div className="answer-game">
    <ProgressHUDRoot />
    {children}
  </div>
);
```

`ProgressHUDRoot` pulls state + config, chooses skin override vs default, and
returns `null` when every flag is false.

### Opt-out

Set `config.hud = { showDots: false, showFraction: false, showLevel: false }`
and the default HUD renders nothing. There is no alternate placement — if a
game needs something different, it replaces the skin slot or we revisit the
placement globally.

## Data Contract

### HUD config on `AnswerGameConfig`

```ts
export interface AnswerGameConfig {
  // ...existing fields

  /** Controls which HUD elements render. Each flag is independent. */
  hud?: {
    /** Bullet row, one dot per round (classic) or per level (level mode) */
    showDots?: boolean;
    /** "3/5" label; auto-hides when totalRounds is null */
    showFraction?: boolean;
    /** "LEVEL N" label; most useful with level mode */
    showLevel?: boolean;
  };
}
```

### Default resolution

When `config.hud` is omitted, defaults come from game state:

| Mode                     | `showDots` | `showFraction` | `showLevel` |
| ------------------------ | ---------- | -------------- | ----------- |
| Classic (no `levelMode`) | `true`     | `true`         | `false`     |
| Level mode               | `true`     | `false`        | `true`      |

Partial configs are merged with the defaults — setting only
`hud: { showLevel: true }` in a classic game adds the level label on top of
dots + fraction.

### `ProgressHUDProps`

Passed to both the default component and any `skin.ProgressHUD` override:

```ts
interface ProgressHUDProps {
  /** 0-based index of the current round */
  roundIndex: number;
  /** Total rounds in the session; null for unbounded level mode */
  totalRounds: number | null;
  /** 0-based index of the current level; 0 when levelMode is off */
  levelIndex: number;
  /** Whether the game uses levelMode */
  isLevelMode: boolean;
  /** Lifecycle phase — enables pop/celebration animations on transition */
  phase: AnswerGamePhase;
  /** Resolved visibility flags after merging defaults + config */
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}
```

### Escape hatches

Skin callbacks (`onRoundComplete`, `onLevelComplete`, `onGameOver`) fire
regardless of HUD flags. A skin that wants custom progress feedback without
any default UI can:

- Set all three flags to `false` on the config, OR
- Provide `skin.ProgressHUD` that returns `null` and uses a `useEffect` on the
  incoming props to trigger audio / scene animations

`skin.ProgressHUD` always mounts when provided, even if every flag is `false`.
Flags only gate the default component.

## CSS Tokens

Added to the skin token contract documented in
`docs/superpowers/specs/2026-04-13-game-skin-system-design.md`:

```css
/* Applied on .game-container by baseskill */

/* ── HUD Tokens ── */
--skin-hud-bg: transparent;
--skin-hud-gap: 0.5rem;
--skin-hud-padding: 0.25rem 0.75rem;
--skin-hud-radius: 9999px;

--skin-hud-dot-size: 0.875rem;
--skin-hud-dot-fill: var(--bs-success);
--skin-hud-dot-empty: var(--bs-surface);
--skin-hud-dot-border: var(--bs-border);
--skin-hud-dot-current-ring: color-mix(
  in srgb,
  var(--skin-hud-dot-fill) 25%,
  transparent
);

--skin-hud-fraction-color: var(--bs-foreground);
--skin-hud-fraction-sep-color: var(--skin-hud-dot-fill);
--skin-hud-fraction-font-size: 1rem;
--skin-hud-fraction-font-weight: 800;

--skin-hud-level-color: var(--bs-primary);
--skin-hud-level-font-size: 0.875rem;
--skin-hud-level-font-weight: 800;
--skin-hud-level-letter-spacing: 0.1em;
```

All tokens inherit from existing `--bs-*` theme tokens by default so the
classic skin follows the active app theme automatically.

## Skin Contract Change

Add to `GameSkin` in the skin system spec:

```ts
export interface GameSkin {
  // ...existing fields

  /** Replaces the default ProgressHUD at the top of the game container */
  ProgressHUD?: React.ComponentType<ProgressHUDProps>;
}
```

No other fields change. The slot follows the same pattern as
`CelebrationOverlay` and `RoundCompleteEffect`.

## Component Sketch

```tsx
// src/components/answer-game/ProgressHUD/ProgressHUD.tsx
export const ProgressHUD = ({
  roundIndex,
  totalRounds,
  levelIndex,
  isLevelMode,
  phase,
  showDots,
  showFraction,
  showLevel,
}: ProgressHUDProps) => {
  if (!showDots && !showFraction && !showLevel) return null;

  const dotCount = isLevelMode ? levelIndex + 1 : (totalRounds ?? 0);
  const filled = isLevelMode ? levelIndex : roundIndex;
  const canShowFraction = showFraction && totalRounds !== null;

  return (
    <div className="skin-hud" data-phase={phase}>
      {showLevel ? (
        <span className="skin-hud__level">LEVEL {levelIndex + 1}</span>
      ) : null}
      {showDots ? (
        <ol className="skin-hud__dots" aria-label="round progress">
          {Array.from({ length: dotCount }).map((_, i) => (
            <li
              key={i}
              className="skin-hud__dot"
              data-state={
                i < filled ? 'done' : i === filled ? 'current' : 'todo'
              }
            />
          ))}
        </ol>
      ) : null}
      {canShowFraction ? (
        <span className="skin-hud__fraction">
          {roundIndex + 1}
          <span className="skin-hud__fraction-sep">/</span>
          {totalRounds}
        </span>
      ) : null}
    </div>
  );
};
```

## Test Plan

Every new component and behaviour is test-driven.

### Unit tests (`ProgressHUD.test.tsx`)

1. Renders N dots when `showDots: true`, `totalRounds: N`
2. Fills dots 0..`roundIndex - 1` as "done"; `roundIndex` as "current"; rest as
   "todo"
3. Shows `"3/5"` when `showFraction: true` and `totalRounds` is set
4. Hides fraction when `totalRounds` is `null`, regardless of `showFraction`
5. Shows `"LEVEL 3"` label when `showLevel: true`
6. Returns `null` when all three flags are `false`
7. Pop class asserted on current dot during `phase === 'round-complete'`

### Integration tests (`ProgressHUDRoot.test.tsx`)

1. `skin.ProgressHUD`, when provided, replaces the default component with the
   same props forwarded
2. `config.hud` overrides auto-resolved defaults
3. Classic WordSpell session defaults to dots + fraction, no level
4. Level-mode SortNumbers session defaults to dots + level, no fraction
5. Mixed config `hud: { showFraction: true, showLevel: true }` in a level-mode
   game with `maxLevels: 5` renders both labels

### Visual regression tests

1. `WordSpell` classic — screenshot at round 2/5 and round 5/5 (default skin)
2. `SortNumbers` levelMode — screenshot at level 1, level 3, level 10 (dot row
   grows across the frames)
3. `SortNumbers` level-complete phase — pop animation frame on current dot
4. Mixed mode — `maxLevels: 5` with `showFraction` + `showLevel` both on

## Scope of Doc Updates

This spec ships alongside updates to:

1. **`docs/game-engine.md` §7** — add `ProgressHUD` as the 8th reusable
   component with its props and event-contract row. Mark §8 "Difficulty
   Progression" as **deferred**, replaced by `levelMode.generateNextLevel` for
   now.
2. **`docs/superpowers/specs/2026-04-13-game-skin-system-design.md`** — add
   `ProgressHUD` slot to the `GameSkin` interface section and `--skin-hud-*`
   tokens to the CSS token catalog.
3. **`docs/baseskill_milestone_breakdown_85146c93.plan.md` M5** — update the
   shipped reference game list to WordSpell, NumberMatch, SortNumbers. Move
   Letter Tracing, Read Aloud, Math Facts to a **deferred reference games**
   note with no date.
4. **`docs/prd.md`** — no edit needed. The PRD does not enumerate specific
   games in a single section, so there is no list to mirror. If future PRD
   sections reference the reference-game list, they can link to the
   milestone plan.

## Open Questions

None at time of writing.

## Future Work

- **RoundHeader component** (separate follow-up spec): a per-round descriptor
  line (e.g. "Ascending · 1→10" for SortNumbers, "CVC word · 3 letters" for
  WordSpell) rendered between the HUD and `<AnswerGame.Question>`. Lives
  outside the HUD because it is game-authored round copy, not session
  progress, and different games need wildly different shapes. Will land in
  its own spec once this HUD ships.
- Persistent progress writes: on `game:end`, upsert `progress` row with
  `lastScore`, `bestScore`, `totalStars`, `lastPlayedAt`, `completionCount`.
- Dashboard "recents" row reading `progress.lastPlayedAt`.
- Session recorder wiring for the `AnswerGame` code path so classic games
  populate `session_history` for the parent session-history viewer.
- Adaptive difficulty per PRD §8.
