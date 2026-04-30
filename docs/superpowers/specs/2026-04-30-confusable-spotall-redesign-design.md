# Confusable SpotAll Redesign — Engine Integration, R5b, Distractor Library

**Date:** 2026-04-30
**Branch:** `feat/confusable-spotall` (existing — PR #252)
**Status:** Approved — ready for implementation plan
**Origin:** `docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md`,
`docs/plans/2026-04-30-001-feat-confusable-spotall-plan.md` (the original plan whose
implementation this spec supersedes for the listed components).

---

## Problem Summary

PR #252 ships R1–R12 of the SpotAll spec but missed R5b entirely and short-circuited the
game-engine integration:

1. **R5b never landed.** No `reversible-characters.json`. No `getReversalTransform` /
   `isReversible` query helpers. The round builder pulls only from confusable sets, so a
   round for target `2` can never include a backwards-`2` distractor.
2. **`SpotAll.tsx` bypasses `GameShell` and `GameEngineProvider`.** No exit-X chrome, no
   session recording / abandon tracking, no scoring telemetry, no skin context.
3. **No `ProgressHUD`.** Replaced with a "Round X of Y" text footer. The dotted HUD other
   games show is missing entirely.
4. **No skin support.** No `useGameSkin('spot-all', …)`, no `SceneBackground`, no
   `CelebrationOverlay`. Round-complete shows neither confetti nor the `ScoreAnimation`.
5. **No TTS / `AudioButton`** in the prompt despite `ttsEnabled: true` in config.
6. **Hardcoded English strings** ("Select all the X tiles", "Check"). Title,
   description, and instructions strings are missing from `games.json`, so
   `t('instructions.spot-all')` returns the raw key.
7. **Custom config broken.** `SpotAllConfigForm` is three difficulty buttons; the
   advanced fields are an incomplete 4-field stub. The route's advanced resolver is
   `{ ...base, ...(saved as Partial<SpotAllConfig>) }` with no validation.
8. **No Storybook coverage.** Compare to NumberMatch: 4 stories files including
   `*.skin.stories.tsx` and `*.config-form.stories.tsx`. SpotAll has zero.
9. **No VR / E2E tests.** No files under `tests-vr/spot-all/` or `tests-e2e/spot-all/`.
10. **Wrong distractor rendering.** Confusable distractors get a CSS transform applied
    on top of an already-different character. A "9" tile rendered with `rotate(180deg)`
    visually shows "6" (the target) — the child can't tell what's correct.
11. **Mechanic mismatch.** A "Check" submit button gates round completion. Mismatches the
    rest of the app (NumberMatch / WordSpell / SortNumbers all auto-validate per move).
12. **Visual variation only on correct tiles.** Distractor tiles are uniform — kids learn
    "varied = correct" instead of recognising shape.

---

## Locked Decisions

| Decision                | Resolution                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                   | A — fix SpotAll in this PR. B (extract `useGameRound` + Slot tap-mode) and C-\* (per-game adoption) become separate GitHub issues.                                                                                         |
| AnswerGame reuse        | `AnswerGame.Question/Answer/Choices` (pure layout) and `ProgressHUD` (leaf only) are reused. `Slot`/`AnswerGameProvider`/`answerGameReducer` stay drag-only — touched in Issue B.                                          |
| Tile chrome             | Same `--skin-tile-*` tokens NumberMatch uses. `SpotAllTile` is a new component but visually identical.                                                                                                                     |
| Mechanic                | Per-tap auto-validate. No Check button. Round completes when all correct tiles selected. Confetti + 750 ms advance, matching NumberMatch.                                                                                  |
| Wrong-tap               | `reject` semantics: red flash + shake + `playWrong()` + 600 ms tile cooldown (debounce). Tile never enters `selectedIds`. Bounce animation for `lock-*` modes is a separate AnswerGame issue.                              |
| R5b dataset             | 9 reversible characters: `2, 3, 5, 6, 7, 9, J, S, Z` — all `mirror-horizontal`. No conflict with `confusable-sets.json` (different mistake categories).                                                                    |
| Self-reversal selection | Driven by `selectedReversibleChars: string[]` in config (empty array = no self-reversal distractors).                                                                                                                      |
| Distractor render rule  | Confusable distractors are rendered upright with **no CSS transform** (the character's own shape is the visual distractor). Self-reversal distractors render the **target character** with the reversible's CSS transform. |
| Config picker           | WordSpell-style grouped picker with header + chips. 6 groups: 5 confusable types + Reversible. Each chip is a specific pair (or a 3-way set, e.g. `I, l, 1`).                                                              |
| Simple form             | Same picker as advanced (no easy/medium/hard preset row). Default selection = Mirror Horizontal group enabled (`b↔d`, `p↔q`). Pattern matches WordSpell's simple form.                                                     |
| Visual variation        | Applies to **all tiles** (correct + distractor) when enabled. Forces shape recognition. Distractor's CSS transform is layered on top of the variation.                                                                     |
| Font pool               | Curated 6-font list (Andika, Edu NSW ACT Foundation, Nunito, Fraunces, Manrope, Monospace). All already loaded by the app. The buggy generic `cursive`/`serif`/`system-ui` strings are removed.                            |
| Distractor architecture | New `src/lib/distractors/` library with `DistractorSource` interface, `registry`, `compose`. Confusable + reversible sources implemented now; future sources (random-other, phonemic, case) plug in via separate issues.   |
| Distractor RNG          | `composeDistractors(..., rng?)` accepts optional seeded RNG so SpotAll's existing `seed` prop deterministically drives tile order.                                                                                         |
| Skin                    | `classicSkin` registered for `spot-all` in `src/lib/skin/registry.ts`.                                                                                                                                                     |
| Storybook coverage      | Per-component stories + a `SpotAll.skin.stories.tsx` and `SpotAll.config-form.stories.tsx` matching NumberMatch's pattern.                                                                                                 |
| VR coverage             | Single happy-path screenshot per skin (one screenshot for v1). Deterministic seed.                                                                                                                                         |
| E2E coverage            | Full flow: instructions → start → tap correct tiles → round-complete confetti → advance → game-over → Play Again.                                                                                                          |
| i18n                    | Strings added to both `en/games.json` and `pt-BR/games.json`.                                                                                                                                                              |

---

## Section 1 — Architecture

Five layers, bottom-up. Each layer has one responsibility and a stable contract with the
next layer up.

```text
L5  src/games/spot-all/                                        (game-specific)
    SpotAll · SpotAllTile · SpotAllPrompt · SpotAllGrid
    SpotAllConfigForm · spot-all-reducer · build-spot-all-round
    visual-variation/{pools,pick-variation}

L4  src/lib/distractors/  (NEW — game-agnostic)
    types · registry · compose
    sources/confusable-pairs · sources/reversible-chars

L3  src/data/confusables/                                      (data only)
    confusable-sets.json · reversible-characters.json (NEW)
    types · query

L2  Reused from existing AnswerGame (no edits)
    AnswerGame.Question/Answer/Choices, ProgressHUD (leaf),
    GameOverOverlay, ScoreAnimation, InstructionsOverlay,
    useGameSounds, useRoundTTS, AudioButton, skin tokens

L1  src/components/game/GameShell + GameEngineProvider
    Exit X · session recording · skin context
```

**Single-responsibility boundaries:**

- L1: chrome + lifecycle. Existing, unchanged.
- L2: visual + sensory primitives. Reused as-is. **No edits.**
- L3: raw confusables data + query helpers. No game knowledge.
- L4: pluggable distractor pipeline. Future sources slot in here.
- L5: SpotAll-specific reducer, components, round building, config.

**No upward dependencies.** L5 imports from L1–L4. L4 imports from L3 only. L3 stands
alone.

### What's deferred to Issues (not in this PR)

- **Issue B** — generalise `Slot` with `mode='tap-select'` and extract a
  `useGameRound(rounds, advanceDelay)` hook. Lets SpotAll wrap in `<AnswerGame>` like
  every other game.
- **Issue C-WordSpell / C-NumberMatch / C-SortNumbers** — adopt B (blocked on B).
- **Issue: AnswerGame `lock-*` bounce animation** — `lock-manual` and `lock-auto-eject`
  currently stick the wrong tile without a shake-and-settle. Independent fix.
- **Issue: distractor library — future sources meta-issue** — placeholder for
  `random-other`, `phonemic-confusable`, `case-confusable`.

---

## Section 2 — Data layer (L3)

### `src/data/confusables/confusable-sets.json`

**Unchanged** from the current PR.

### `src/data/confusables/reversible-characters.json` (NEW)

```json
[
  { "char": "2", "transform": "mirror-horizontal" },
  { "char": "3", "transform": "mirror-horizontal" },
  { "char": "5", "transform": "mirror-horizontal" },
  { "char": "6", "transform": "mirror-horizontal" },
  { "char": "7", "transform": "mirror-horizontal" },
  { "char": "9", "transform": "mirror-horizontal" },
  { "char": "J", "transform": "mirror-horizontal" },
  { "char": "S", "transform": "mirror-horizontal" },
  { "char": "Z", "transform": "mirror-horizontal" }
]
```

**Rationale:** these are characters children commonly write **backwards** (same
character, mirrored). Distinct from `confusable-sets.json` which records pairs of
**different** characters. The 6/9 pair is in both (different mistakes).

### `src/data/confusables/types.ts` — additions

```ts
export type ReversibleTransform =
  | 'mirror-horizontal'
  | 'mirror-vertical'
  | 'rotation-180';

export interface ReversibleCharacter {
  char: string;
  transform: ReversibleTransform;
}
```

### `src/data/confusables/query.ts` — additions

```ts
export const getAllReversibles = (): ReversibleCharacter[] => [...];
export const getReversalTransform = (char: string): ReversibleCharacter | undefined => ...;
export const isReversible = (char: string): boolean => ...;
```

---

## Section 3 — Distractor library (L4, NEW)

### `src/lib/distractors/types.ts`

```ts
export type CssTransform =
  | 'scaleX(-1)'
  | 'scaleY(-1)'
  | 'rotate(180deg)';

export interface DistractorCandidate {
  /** Character (or sequence) shown on the tile. */
  label: string;
  /** Optional CSS transform (self-reversal only). */
  transform?: CssTransform;
  /** Source that produced the candidate (telemetry, debugging). */
  sourceId: string;
  /** Source-specific metadata (e.g., relationship type). */
  meta?: Record<string, unknown>;
}

export interface DistractorSourceContext {
  selectedConfusablePairs?: Array<{
    pair: [string, string];
    type: RelationshipType;
  }>;
  selectedReversibleChars?: string[];
  /** Open extension point for future sources. */
  [key: string]: unknown;
}

export interface DistractorSource {
  id: string;
  getCandidates(
    target: string,
    ctx: DistractorSourceContext,
  ): DistractorCandidate[];
}
```

### `src/lib/distractors/sources/confusable-pairs.ts`

```ts
export const confusablePairsSource: DistractorSource = {
  id: 'confusable-pairs',
  getCandidates(target, { selectedConfusablePairs = [] }) {
    const out: DistractorCandidate[] = [];
    for (const sel of selectedConfusablePairs) {
      const [left, right] = sel.pair;
      if (left === target) {
        out.push({
          label: right,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      } else if (right === target) {
        out.push({
          label: left,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      }
    }
    // No CSS transform — character itself provides the visual difference.
    return out;
  },
};
```

### `src/lib/distractors/sources/reversible-chars.ts`

```ts
const TRANSFORM_MAP: Record<ReversibleTransform, CssTransform> = {
  'mirror-horizontal': 'scaleX(-1)',
  'mirror-vertical': 'scaleY(-1)',
  'rotation-180': 'rotate(180deg)',
};

export const reversibleCharsSource: DistractorSource = {
  id: 'reversible-chars',
  getCandidates(target, { selectedReversibleChars = [] }) {
    if (!selectedReversibleChars.includes(target)) return [];
    const r = getReversalTransform(target);
    if (!r) return [];
    // Same character as target, with the CSS transform that makes it look "wrong".
    return [
      {
        label: target,
        transform: TRANSFORM_MAP[r.transform],
        sourceId: 'reversible-chars',
        meta: { reversalTransform: r.transform },
      },
    ];
  },
};
```

### `src/lib/distractors/compose.ts`

```ts
export const composeDistractors = (
  sources: DistractorSource[],
  target: string,
  ctx: DistractorSourceContext,
  count: number,
  rng?: () => number,
): DistractorCandidate[] => {
  const pool: DistractorCandidate[] = [];
  for (const s of sources) pool.push(...s.getCandidates(target, ctx));

  // Dedupe by (label, transform)
  const seen = new Set<string>();
  const unique = pool.filter((c) => {
    const key = `${c.label}|${c.transform ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return shuffle(unique, rng).slice(0, count);
};
```

### `src/lib/distractors/registry.ts`

```ts
const SOURCES = new Map<string, DistractorSource>();

export const registerSource = (s: DistractorSource): void => {
  SOURCES.set(s.id, s);
};
export const getSource = (id: string): DistractorSource | undefined =>
  SOURCES.get(id);
export const listSources = (): DistractorSource[] => [
  ...SOURCES.values(),
];

// Auto-register built-ins
registerSource(confusablePairsSource);
registerSource(reversibleCharsSource);
```

`rng?: () => number` is the same pattern `src/games/build-round-order.ts` uses. Tests
pass a deterministic generator (e.g. `mulberry32(seed)`); production omits it and
`Math.random` is used internally.

---

## Section 4 — Game state, lifecycle, shell integration (L5)

### State shape

```ts
interface SpotAllState {
  rounds: SpotAllRound[];
  roundIndex: number;
  tiles: SpotAllTile[];
  selectedIds: Set<string>;
  /** Tile IDs in the wrong-tap cooldown window (red+shake, ignoring taps). */
  wrongCooldownIds: Set<string>;
  phase: 'playing' | 'round-complete' | 'game-over';
  retryCount: number;
}
```

### Actions

```ts
type SpotAllAction =
  | { type: 'INIT_ROUNDS'; rounds: SpotAllRound[] }
  | { type: 'TAP_TILE'; tileId: string }
  | { type: 'CLEAR_WRONG_COOLDOWN'; tileId: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'COMPLETE_GAME' };
```

### `TAP_TILE` reducer logic

```ts
case 'TAP_TILE': {
  if (state.phase !== 'playing') return state;
  if (state.wrongCooldownIds.has(action.tileId)) return state; // debounced

  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile) return state;

  // Tapping an already-selected correct tile = silent deselect
  if (tile.isCorrect && state.selectedIds.has(action.tileId)) {
    const next = new Set(state.selectedIds);
    next.delete(action.tileId);
    return { ...state, selectedIds: next };
  }

  // Tapping an unselected correct tile = add to selection
  if (tile.isCorrect) {
    const next = new Set(state.selectedIds);
    next.add(action.tileId);
    const allCorrect = state.tiles
      .filter((t) => t.isCorrect)
      .every((t) => next.has(t.id));
    return {
      ...state,
      selectedIds: next,
      phase: allCorrect ? 'round-complete' : 'playing',
    };
  }

  // Wrong tap — reject behavior: enter cooldown, increment retry, no selection
  const cooldown = new Set(state.wrongCooldownIds);
  cooldown.add(action.tileId);
  return {
    ...state,
    wrongCooldownIds: cooldown,
    retryCount: state.retryCount + 1,
  };
}
```

### Lifecycle effects

1. **Mount** → build `config.totalRounds` rounds via `buildSpotAllRound(config, rng)` → `dispatch INIT_ROUNDS`.
2. **TAP_TILE on correct, unselected** → `playCorrect()`, pop animation, tile renders selected.
3. **TAP_TILE on wrong** → `playWrong()`, red flash + shake, schedule
   `setTimeout(() => dispatch CLEAR_WRONG_COOLDOWN, WRONG_COOLDOWN_MS)`.
4. **Round-complete phase** → confetti + `ScoreAnimation`, schedule
   `setTimeout(() => dispatch ADVANCE_ROUND, ROUND_ADVANCE_MS)`.
5. **ADVANCE_ROUND on last round** → reducer transitions to `game-over` directly.
6. **`game-over`** → render `skin.CelebrationOverlay ?? GameOverOverlay`.

```ts
export const WRONG_COOLDOWN_MS = 600;
export const ROUND_ADVANCE_MS = 750;
```

Both exported as named constants from `spot-all-reducer.ts` for tests + skin overrides.

### Component composition

```tsx
<GameEngineProvider config={engineConfig} moves={spotAllMoves} initialState={...} sessionId meta>
  <GameShell>                             {/* Exit X · session abandon · skin context */}
    <div className={`game-container skin-${skin.id}`} style={skin.tokens}>
      {skin.SceneBackground ? <skin.SceneBackground /> : null}

      {/* HUD centered, above prompt — matches NumberMatch/WordSpell/SortNumbers layout */}
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        <ProgressHUD
          roundIndex={state.roundIndex}
          totalRounds={config.totalRounds}
          levelIndex={0}
          isLevelMode={false}
          phase={state.phase === 'round-complete' ? 'round-complete' : 'playing'}
          showDots
          showFraction
          showLevel={false}
        />

        <AnswerGame.Question>
          <SpotAllPrompt target={round.target} />
          <AudioButton prompt={t('spot-all-ui.prompt', { target: round.target })} />
        </AnswerGame.Question>

        <AnswerGame.Answer>
          <SpotAllGrid state={state} onTap={tileId => dispatch({ type: 'TAP_TILE', tileId })} />
        </AnswerGame.Answer>
      </div>

      {skin.RoundCompleteEffect
        ? <skin.RoundCompleteEffect visible={state.phase === 'round-complete'} />
        : <ScoreAnimation visible={state.phase === 'round-complete'} />}

      {state.phase === 'game-over' && (
        skin.CelebrationOverlay
          ? <skin.CelebrationOverlay retryCount={state.retryCount} ... />
          : <GameOverOverlay retryCount={state.retryCount} ... />
      )}
    </div>
  </GameShell>
</GameEngineProvider>
```

`InstructionsOverlay` stays owned by the route's `SpotAllGameBody` (existing pattern,
unchanged — overlay shows before SpotAll mounts).

### `GameEngineProvider` config

SpotAll passes a stripped-down `ResolvedGameConfig`:

- `gameId='spot-all'`, `totalRounds`, `ttsEnabled`
- `timerVisible=false` (no timer in v1)
- `hud.showDots=true`, `hud.showFraction=true`
- `moves = { tap: tapMoveHandler }` — single move type recording `{tileId, isCorrect, target}`
- `initialState = { phase: 'playing' }` — opaque stub; SpotAll's reducer state lives in
  `useReducer` alongside.

If `GameEngineProvider` needs richer state than this, it's discovered during U6
implementation. Mitigation in the risks table.

### Skin registration

```ts
// src/lib/skin/registry.ts — modify
registerSkin('spot-all', classicSkin);
```

`classicSkin` (in `src/lib/skin/classic-skin.ts`) is extended with **six
variation tokens** consumed by `COLOR_POOL` in Section 7. Naming is generic
(`--skin-variation-N`, not `--spot-all-variation-N`) so future games can reuse
the same palette without rename churn:

```ts
// src/lib/skin/classic-skin.ts — additions
'--skin-variation-1': 'var(--bs-primary)',     // blue (semantic)
'--skin-variation-2': 'var(--destructive)',    // red   (semantic)
'--skin-variation-3': 'var(--bs-success)',     // green (semantic)
'--skin-variation-4': 'oklch(54% 0.22 295)',   // violet — no semantic parallel
'--skin-variation-5': 'oklch(63% 0.18 35)',    // orange — no semantic parallel
'--skin-variation-6': 'var(--skin-tile-text)', // default text colour
```

Future skins (e.g. high-contrast) can override these six tokens to reshape the
variation palette without touching SpotAll code.

---

## Section 5 — UI components

### Tile states

`SpotAllTile` renders six states via props:

| #   | State                | Visual                                               |
| --- | -------------------- | ---------------------------------------------------- |
| 1   | default unselected   | `--skin-tile-*` neutral background, default font     |
| 2   | selected (correct)   | `--skin-correct-bg/-border` green                    |
| 3   | wrong-cooldown       | `--skin-wrong-bg/-border` red + shake animation      |
| 4   | with transform       | character rendered with optional `tile.transform`    |
| 5   | with variation       | random (font, size, color) from pools applied inline |
| 6   | selected + variation | combinations of 2 + 5                                |

```ts
interface SpotAllTileProps {
  tile: SpotAllTile;
  isSelected: boolean;
  inCooldown: boolean;
  onTap: () => void;
}
```

The previous `feedback: 'none' | 'correct' | 'incorrect'` prop is removed — per-tile
state replaces global feedback.

### Grid (responsive)

```text
grid-cols-3  sm:grid-cols-4  md:grid-cols-5  lg:grid-cols-6  xl:grid-cols-8  2xl:grid-cols-10
```

Tile size stays in the readable 130–150 px range across all breakpoints.

### Prompt

```tsx
<p className="text-center text-2xl font-semibold">
  {t('spot-all-ui.prompt', { target })}
  <AudioButton prompt={t('spot-all-ui.prompt', { target })} />
</p>
```

The target character inside the prompt is rendered in the **default font** so it stays a
consistent reference shape across rounds (variations apply only to grid tiles).

### File map

```text
src/games/spot-all/
├── SpotAll/
│   ├── SpotAll.tsx                          ← REWRITE
│   ├── SpotAll.test.tsx                     ← keep + extend (per-tap auto-validate)
│   ├── SpotAll.stories.tsx                  ← NEW (Playground)
│   └── SpotAll.skin.stories.tsx             ← NEW (skin variants)
├── SpotAllGrid/
│   ├── SpotAllGrid.tsx                      ← REWRITE (responsive cols)
│   └── SpotAllGrid.stories.tsx              ← NEW (optional, can defer)
├── SpotAllTile/
│   ├── SpotAllTile.tsx                      ← REWRITE
│   └── SpotAllTile.stories.tsx              ← NEW (6 states)
├── SpotAllPrompt/
│   ├── SpotAllPrompt.tsx                    ← UPDATE (AudioButton + i18n)
│   └── SpotAllPrompt.stories.tsx            ← NEW
├── SpotAllConfigForm/
│   ├── SpotAllConfigForm.tsx                ← REWRITE (grouped picker)
│   └── SpotAllConfigForm.test.tsx           ← NEW
├── SpotAll.config-form.stories.tsx          ← NEW
├── visual-variation/
│   ├── pools.ts                             ← NEW (FONT_POOL, COLOR_POOL, SIZE_POOL)
│   ├── pick-variation.ts                    ← NEW
│   └── pick-variation.test.ts               ← NEW
├── confusable-pair-groups.ts                ← NEW (groups confusable-sets by relationship type)
├── confusable-pair-groups.test.ts           ← NEW
├── build-spot-all-round.ts                  ← REWRITE (uses compose, applies variation to all tiles)
├── build-spot-all-round.test.ts             ← REWRITE
├── spot-all-reducer.ts                      ← REWRITE
├── spot-all-reducer.test.ts                 ← REWRITE
├── resolve-simple-config.ts                 ← REWRITE (no easy/medium/hard)
├── resolve-simple-config.test.ts            ← keep + update
└── types.ts                                 ← REWRITE (new config shape)
```

---

## Section 6 — Config form

### Grouped picker

WordSpell-style. Six group rows, each with a header (toggles all chips) and chips below
(toggle individual pair / set / reversible). Header states reuse the WordSpell color
classes:

| State                         | Background | Meaning                      |
| ----------------------------- | ---------- | ---------------------------- |
| `all-on`                      | primary    | every chip in group selected |
| `partial`                     | primary/40 | some chips selected          |
| `tiles-only` / `not-in-scope` | muted      | none selected                |

**Groups (in order):**

1. **Mirror Horizontal** — chips: `b ↔ d`, `p ↔ q`
2. **Mirror Vertical** — chips: `b ↔ p`, `d ↔ q`
3. **Rotation 180°** — chips: `b ↔ q`, `d ↔ p`, `6 ↔ 9`, `m ↔ w`, `n ↔ u`
4. **Visual Similarity** — chips: `I, l, 1` (3-way set, single chip), `3 ↔ E`, `S ↔ 5`, `O ↔ 0`
5. **Transposition** — chips: `15 ↔ 51`, `oa ↔ ao`
6. **Reversible (self-mirror)** — chips: `2 ↔ 2̄`, `3 ↔ 3̄`, …, `Z ↔ Z̄` (each chip
   shows the literal CSS-flipped preview)

The 3-way `I, l, 1` chip toggles all three pairs (`I↔l`, `I↔1`, `l↔1`) atomically.

### Simple form

The grouped picker only — same component as advanced. **No** easy/medium/hard preset
row. Default selection on first open: Mirror Horizontal group all-on
(`b↔d`, `p↔q`). Empty selection shows `<p class="text-destructive">Pick at least one
group to play</p>` (mirrors WordSpell's invalid-selection message).

### Advanced form

The grouped picker **plus** all knobs:

- Counts (steppers): `correctTileCount` 1–8, `distractorCount` 1–16, `totalRounds` 1–20
- `visualVariationEnabled` (checkbox) + nested font-pool multi-select (when enabled)
- `roundsInOrder` (checkbox)
- `ttsEnabled` (checkbox)

### `resolve-simple-config.ts`

```ts
export const resolveSimpleConfig = (
  simple: SpotAllSimpleConfig,
): SpotAllConfig => ({
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: simple.selectedConfusablePairs,
  selectedReversibleChars: simple.selectedReversibleChars,
  correctTileCount: 4,
  distractorCount: 4,
  totalRounds: 6,
  visualVariationEnabled: true,
  enabledFontIds: [
    'andika',
    'edu-nsw',
    'nunito',
    'fraunces',
    'manrope',
    'monospace',
  ],
  roundsInOrder: false,
  ttsEnabled: true,
});
```

### `types.ts`

```ts
export interface SelectedConfusablePair {
  pair: [string, string];
  type: RelationshipType;
}

export interface SpotAllConfig {
  gameId: 'spot-all';
  component: 'SpotAll';
  configMode?: 'simple' | 'advanced';
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
  correctTileCount: number;
  distractorCount: number;
  totalRounds: number;
  visualVariationEnabled: boolean;
  enabledFontIds: string[];
  roundsInOrder: boolean;
  ttsEnabled: boolean;
}

export interface SpotAllSimpleConfig {
  configMode: 'simple';
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
}
```

The previous `targetSetIds`, `relationshipTypes`, `useReversibleDistractors` fields are
removed.

---

## Section 7 — Visual variation

### Pools

```ts
// src/games/spot-all/visual-variation/pools.ts
export const FONT_POOL = [
  { id: 'andika', family: 'Andika, sans-serif', label: 'Andika' },
  {
    id: 'edu-nsw',
    family: '"Edu NSW ACT Foundation", cursive',
    label: 'Edu NSW',
  },
  { id: 'nunito', family: 'Nunito, sans-serif', label: 'Nunito' },
  {
    id: 'fraunces',
    family: 'Fraunces, Georgia, serif',
    label: 'Fraunces',
  },
  { id: 'manrope', family: 'Manrope, sans-serif', label: 'Manrope' },
  {
    id: 'monospace',
    family: 'ui-monospace, "SF Mono", monospace',
    label: 'Monospace',
  },
] as const;

export const COLOR_POOL = [
  'var(--skin-variation-1)',
  'var(--skin-variation-2)',
  'var(--skin-variation-3)',
  'var(--skin-variation-4)',
  'var(--skin-variation-5)',
  'var(--skin-variation-6)',
] as const;

export const SIZE_POOL = [38, 42, 46, 50] as const; // px
```

`COLOR_POOL` entries are CSS `var(...)` strings; the tile sets
`style={{ color: variation.color }}` and CSS resolves the token at render time.
The six values are defined by `classicSkin` (Section 4 — Skin registration);
future skins can override them. All fonts already loaded by the app (no new
web-font imports).

### Selection

```ts
// src/games/spot-all/visual-variation/pick-variation.ts
export const pickVariation = (
  rng: () => number,
  enabledFontIds: readonly string[],
): SpotAllVisualVariation => {
  const fonts = FONT_POOL.filter((f) => enabledFontIds.includes(f.id));
  const font =
    fonts.length > 0 ? fonts[Math.floor(rng() * fonts.length)] : null;
  return {
    fontFamily: font?.family,
    fontSizePx: SIZE_POOL[Math.floor(rng() * SIZE_POOL.length)],
    color: COLOR_POOL[Math.floor(rng() * COLOR_POOL.length)],
  };
};
```

When the font pool is empty, font stays the default — only size and color vary.

### Application

When `visualVariationEnabled === true`, **every tile** (correct + distractor) gets a
variation. Distractor's `transform` is layered on top.

```ts
// build-spot-all-round.ts (excerpt)
const correctTiles = Array.from({ length: config.correctTileCount }, () => ({
  id: nanoid(),
  label: target,
  isCorrect: true,
  visualVariation: config.visualVariationEnabled
    ? pickVariation(rng, config.enabledFontIds) : undefined,
}));

const distractorTiles = composeDistractors(...).map((c) => ({
  id: nanoid(),
  label: c.label,
  isCorrect: false,
  transform: c.transform,
  visualVariation: config.visualVariationEnabled
    ? pickVariation(rng, config.enabledFontIds) : undefined,
}));
```

### Known visual edge case

Some font + character combinations may render ambiguously (e.g., a `d` in
Edu NSW cursive may shape-shift toward `b`). Validate during U6 by viewing the
six-state Storybook. If a combination is genuinely confusing, pull that font from the
default pool. Worst-case mitigation: shrink `FONT_POOL` to the four sans-serif faces.

---

## Section 8 — i18n

### `src/lib/i18n/locales/en/games.json`

Top-level additions:

```jsonc
{
  "spot-all": "Spot the Match!",
  "spot-all-description": "Tap all the tiles that match the prompt — watch out for backwards and look-alike letters.",
  "instructions": {
    "spot-all": "Tap every tile that shows the highlighted character. Some tiles look similar but are flipped or different — only tap the correct ones.",
  },
  "spot-all-ui": {
    "prompt": "Select all the {{target}} tiles",
    "config.groups.mirror-horizontal": "Mirror Horizontal",
    "config.groups.mirror-vertical": "Mirror Vertical",
    "config.groups.rotation-180": "Rotation 180°",
    "config.groups.visual-similarity": "Visual Similarity",
    "config.groups.transposition": "Transposition",
    "config.groups.reversible": "Reversible (self-mirror)",
    "config.font-pool.label": "Font pool",
    "config.visual-variation.label": "Visual variation on tiles",
    "config.invalid-selection": "Pick at least one group to play",
  },
}
```

### `src/lib/i18n/locales/pt-BR/games.json`

Mirror keys with translations:

- `spot-all` → "Encontre Todos!"
- `spot-all-description` → "Toque em todas as peças que combinam com o pedido — cuidado com letras invertidas e parecidas."
- `instructions.spot-all` → "Toque em cada peça que mostra o caractere destacado. Algumas peças parecem similares mas estão invertidas ou são diferentes — toque apenas nas corretas."
- `spot-all-ui.prompt` → "Selecione todos os {{target}}"
- (group labels translated similarly)

---

## Section 9 — Testing

### Unit (Vitest)

| File                                                              | Coverage                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/data/confusables/query.test.ts`                              | extend: `getReversalTransform`, `isReversible`, `getAllReversibles`                                                  |
| `src/lib/distractors/sources/confusable-pairs.test.ts`            | regression: target `b` with `b↔d` selected returns `d` with no transform                                             |
| `src/lib/distractors/sources/reversible-chars.test.ts`            | target `2` with `2` selected returns label `2` + `scaleX(-1)`                                                        |
| `src/lib/distractors/compose.test.ts`                             | merge, dedupe `(label, transform)`, deterministic shuffle with seeded rng, count cap                                 |
| `src/games/spot-all/build-spot-all-round.test.ts`                 | rewrite: target `6` with both sources → mix of `9` (no transform) and flipped `6` (transform)                        |
| `src/games/spot-all/spot-all-reducer.test.ts`                     | rewrite: TAP_TILE on correct/wrong/already-selected; cooldown blocks re-tap; round-complete on last correct selected |
| `src/games/spot-all/visual-variation/pick-variation.test.ts`      | empty font pool returns undefined fontFamily; full pool varies on each call (with seeded rng asserting determinism)  |
| `src/games/spot-all/SpotAll/SpotAll.test.tsx`                     | renders prompt + grid; tap correct → selected; tap wrong → cooldown + retryCount++; all correct → round-complete     |
| `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.test.tsx` | header toggle adds all chips; chip toggle adds one; empty selection shows invalid message                            |

### Storybook

Per `write-storybook` skill rules (single-Playground pattern, argTypes for state, no raw
JSON controls):

| File                                      | Stories                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `SpotAll/SpotAll.stories.tsx`             | Playground (default classic skin, full game)                              |
| `SpotAll/SpotAll.skin.stories.tsx`        | one story per registered skin (just classic for v1)                       |
| `SpotAllTile/SpotAllTile.stories.tsx`     | Playground with argTypes for all 6 states                                 |
| `SpotAllPrompt/SpotAllPrompt.stories.tsx` | Playground with target arg                                                |
| `SpotAll.config-form.stories.tsx`         | simple + advanced harness (mirrors `NumberMatch.config-form.stories.tsx`) |

### VR (Playwright + Docker)

Per `write-e2e-vr-tests` skill:

```text
tests-vr/spot-all/
└── spot-all.test.ts            ← happy-path screenshot, deterministic seed
```

### E2E (Playwright)

```text
tests-e2e/spot-all/
└── spot-all.e2e.ts             ← instructions overlay → start → tap correct
                                 → confetti → advance → game-over → Play Again
```

Deterministic seed; URL pattern matches existing E2E tests.

### Architecture docs

`update-architecture-docs` skill applies if any file under `src/components/answer-game/`
or `src/lib/game-engine/` is modified. **No edits expected** in this PR — but
`src/lib/distractors/` is new infrastructure. Add a brief `.mdx` description file at
`src/lib/distractors/distractors.mdx` describing the source/registry/compose pattern.

---

## Section 10 — Migration plan (current PR file disposition)

| Current file                                                 | Action                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/data/confusables/confusable-sets.json`                  | Keep                                                                       |
| `src/data/confusables/types.ts`                              | Extend (`ReversibleCharacter`, `ReversibleTransform`)                      |
| `src/data/confusables/query.ts`                              | Extend (3 reversibles helpers)                                             |
| `src/data/confusables/query.test.ts`                         | Extend                                                                     |
| `src/data/confusables/reversible-characters.json`            | **NEW**                                                                    |
| `src/lib/distractors/**`                                     | **NEW** (entire subtree)                                                   |
| `src/games/spot-all/types.ts`                                | Rewrite (new config shape)                                                 |
| `src/games/spot-all/build-spot-all-round.ts`                 | Rewrite (uses compose, fixes transform bug, applies variation universally) |
| `src/games/spot-all/build-spot-all-round.test.ts`            | Rewrite                                                                    |
| `src/games/spot-all/spot-all-reducer.ts`                     | Rewrite (TAP_TILE auto-validate, wrongCooldownIds)                         |
| `src/games/spot-all/spot-all-reducer.test.ts`                | Rewrite                                                                    |
| `src/games/spot-all/SpotAll/SpotAll.tsx`                     | Rewrite (GameEngineProvider + GameShell + skin + ProgressHUD)              |
| `src/games/spot-all/SpotAll/SpotAll.test.tsx`                | Update for new mechanic                                                    |
| `src/games/spot-all/SpotAllTile/SpotAllTile.tsx`             | Rewrite (skin tokens, in-cooldown state)                                   |
| `src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx`             | Update (responsive breakpoints)                                            |
| `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`         | Update (AudioButton + i18n)                                                |
| `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx` | Rewrite (grouped picker)                                                   |
| `src/games/spot-all/resolve-simple-config.ts`                | Rewrite (drop easy/medium/hard)                                            |
| `src/games/spot-all/resolve-simple-config.test.ts`           | Update                                                                     |
| `src/games/spot-all/visual-variation/**`                     | **NEW** (pools, pick-variation)                                            |
| `src/games/spot-all/confusable-pair-groups.ts`               | **NEW** (groups confusable-sets by relationship type for the picker UI)    |
| `src/games/spot-all/SpotAll/SpotAll.stories.tsx`             | **NEW**                                                                    |
| `src/games/spot-all/SpotAll/SpotAll.skin.stories.tsx`        | **NEW**                                                                    |
| `src/games/spot-all/SpotAllTile/SpotAllTile.stories.tsx`     | **NEW**                                                                    |
| `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.stories.tsx` | **NEW**                                                                    |
| `src/games/spot-all/SpotAll.config-form.stories.tsx`         | **NEW**                                                                    |
| `src/games/registry.ts`                                      | Keep (entry already exists)                                                |
| `src/games/config-fields-registry.tsx`                       | Update (advanced fields list reflects new schema)                          |
| `src/routes/$locale/_app/game/$gameId.tsx`                   | Update `resolveSpotAllConfig` to validate new schema                       |
| `src/lib/skin/registry.ts`                                   | Update (register `spot-all` with `classicSkin`)                            |
| `src/lib/i18n/locales/en/games.json`                         | Add `spot-all*` keys                                                       |
| `src/lib/i18n/locales/pt-BR/games.json`                      | Add `spot-all*` keys                                                       |
| `tests-vr/spot-all/spot-all.test.ts`                         | **NEW**                                                                    |
| `tests-e2e/spot-all/spot-all.e2e.ts`                         | **NEW**                                                                    |
| `src/lib/distractors/distractors.mdx`                        | **NEW**                                                                    |

---

## Section 11 — Follow-up issues (already filed)

These six follow-ups were filed alongside the spec to capture work that is
**out of scope for PR #252** but logically connected. The plan does **not**
need to refile them — it should reference these IDs in the PR description.

| Issue                                                       | Title                                                                                   | Depends on | Notes                                                                                                                                                                                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#257](https://github.com/leocaseiro/base-skill/issues/257) | Generalise `Slot` with `mode='tap-select'` + extract `useGameRound` hook                | —          | Lets SpotAll wrap in `<AnswerGame>` like other games. Allows future "drop all correct here" variant of SpotAll because Slot stays draggable too. **Blocks #260, #261, #262.**                                        |
| [#258](https://github.com/leocaseiro/base-skill/issues/258) | AnswerGame: bounce animation for `lock-manual` / `lock-auto-eject` wrong-tile behaviors | —          | Independent. Currently `reject` is the only mode that animates.                                                                                                                                                      |
| [#259](https://github.com/leocaseiro/base-skill/issues/259) | Distractor library: future sources meta-issue                                           | —          | Sub-issues: `random-other` (random unrelated chars), `phonemic-confusable` (sound-similar chars, useful for WordSpell), `case-confusable` (`a↔A`, `e↔E`). Each adds one source under `src/lib/distractors/sources/`. |
| [#260](https://github.com/leocaseiro/base-skill/issues/260) | WordSpell: adopt `useGameRound`                                                         | #257       | Per-game refactor, behaviour-preserving                                                                                                                                                                              |
| [#261](https://github.com/leocaseiro/base-skill/issues/261) | NumberMatch: adopt `useGameRound`                                                       | #257       | Per-game refactor                                                                                                                                                                                                    |
| [#262](https://github.com/leocaseiro/base-skill/issues/262) | SortNumbers: adopt `useGameRound`                                                       | #257       | Per-game refactor                                                                                                                                                                                                    |

---

## Risks

| Risk                                                                                                                               | Mitigation                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GameEngineProvider` may demand a richer state contract than SpotAll's opaque `{phase}` stub                                       | Discovered during U6; fallback is to bypass the engine's state recording and let SpotAll persist sessions itself (as it does today). Keeps PR scope contained.                                                                           |
| Some `(font, character)` combos in the variation pool may render ambiguously (e.g. `d` in Edu NSW cursive looks too much like `b`) | U6 includes a Storybook viewing pass over all six tile states with each font. If a combo is unreadable, drop the font from the default `enabledFontIds`.                                                                                 |
| Self-reversal CSS transforms render differently on different web fonts                                                             | Per-font visual check via the `SpotAll.skin.stories.tsx` Storybook                                                                                                                                                                       |
| 2-character sequences (`oa`, `15`) may not fit comfortably in tile chrome at large grid counts                                     | Tile chrome uses `flex items-center`; multi-char labels auto-shrink. Validate via the responsive grid story.                                                                                                                             |
| Empty selection in simple-mode config could let the user start an unplayable round                                                 | `<SpotAllConfigForm>` shows the invalid-selection message; route-level `resolveSpotAllConfig` falls back to the Mirror-Horizontal default if `selectedConfusablePairs.length === 0 && selectedReversibleChars.length === 0` (defensive). |

---

## Appendix A — Group definitions for the picker

Source: `src/games/spot-all/confusable-pair-groups.ts`. Derived deterministically from
`confusable-sets.json` at module load — no manual duplication.

| Group                    | Chips                                       | Source set(s)                |
| ------------------------ | ------------------------------------------- | ---------------------------- |
| Mirror Horizontal        | `b ↔ d`, `p ↔ q`                            | `bdpq`                       |
| Mirror Vertical          | `b ↔ p`, `d ↔ q`                            | `bdpq`                       |
| Rotation 180°            | `b ↔ q`, `d ↔ p`, `6 ↔ 9`, `m ↔ w`, `n ↔ u` | `bdpq`, `69`, `mw`, `nu`     |
| Visual Similarity        | `I, l, 1`, `3 ↔ E`, `S ↔ 5`, `O ↔ 0`        | `il1`, `3e`, `s5`, `o0`      |
| Transposition            | `15 ↔ 51`, `oa ↔ ao`                        | `15-51`, `oa-ao`             |
| Reversible (self-mirror) | each of the 9 reversible characters         | `reversible-characters.json` |

The 3-way `I, l, 1` chip toggles all three pairs (`I↔l`, `I↔1`, `l↔1`) atomically.

---

## Appendix B — Font pool (final)

| ID          | Family stack                         | Label     |
| ----------- | ------------------------------------ | --------- |
| `andika`    | `Andika, sans-serif`                 | Andika    |
| `edu-nsw`   | `"Edu NSW ACT Foundation", cursive`  | Edu NSW   |
| `nunito`    | `Nunito, sans-serif`                 | Nunito    |
| `fraunces`  | `Fraunces, Georgia, serif`           | Fraunces  |
| `manrope`   | `Manrope, sans-serif`                | Manrope   |
| `monospace` | `ui-monospace, "SF Mono", monospace` | Monospace |

All loaded by the app today (theme presets + `styles.css`). No new web-font imports.

---

## Next Steps

1. User reviews this spec.
2. On approval → invoke `superpowers:writing-plans` to produce the implementation plan
   broken into U1, U2, …
3. The implementation plan respects the project skills:
   `write-storybook` for `*.stories.tsx`, `write-e2e-vr-tests` for VR/E2E,
   `update-architecture-docs` if any game-engine file is touched.
