# useGameRound Extraction + Tap-Select Slot — Design

**Date:** 2026-05-03
**Issue:** [#257](https://github.com/leocaseiro/base-skill/issues/257)
**Status:** Approved — ready for implementation plan

**Related issues:**

- [#260](https://github.com/leocaseiro/base-skill/issues/260) — WordSpell
  adopts `useGameRound` (follow-up)
- [#261](https://github.com/leocaseiro/base-skill/issues/261) — NumberMatch
  adopts `useGameRound` (follow-up)
- [#262](https://github.com/leocaseiro/base-skill/issues/262) — SortNumbers
  adopts `useGameRound` (follow-up)
- [SRS v1](https://github.com/leocaseiro/base-skill/blob/master/docs/superpowers/specs/2026-05-01-srs-v1-design.md) —
  subscribes to `round:*` events; `useGameRound` is its critical-path
  dependency
- [Spec 1a](https://github.com/leocaseiro/base-skill/pull/322) —
  Instructions + TTS Lifecycle; `round:tts-played` and `round:shown` events
  are consumed by `useLifecycleTTS`
- [SpotAll redesign](https://github.com/leocaseiro/base-skill/blob/master/docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md) —
  origin of the extraction need; SpotAll v2 requires tap-select Slot mode

---

## Problem

Three problems converge on one extraction:

1. **Duplicated round lifecycle.** WordSpell, NumberMatch, and SortNumbers
   each independently implement round-advance timing, round-complete
   detection, and game-over transitions. The pattern is identical — watch
   for `phase === 'round-complete'`, wait 750 ms, dispatch `ADVANCE_ROUND`
   or `COMPLETE_GAME` — but each game reimplements it with subtle
   differences (SortNumbers adds level progression and emits
   `game:round-advance`; WordSpell and NumberMatch do not emit events).

2. **No round-level event stream.** The `GameEventBus` has `game:*` events
   but no `round:*` namespace. SRS v1 needs per-round signals
   (`round:shown`, `round:resolved`, `first-action`, `mistake`,
   `tts-played`, `visibility-change`) to record attempt data. Spec 1a's
   `useLifecycleTTS` needs `round:shown` and `round:tts-played`. Without a
   shared hook emitting these events, every consumer would have to wire
   into each game independently.

3. **Drag-only Slot.** SpotAll v2 implements a tap-to-select mechanic but
   cannot reuse `<Slot>` because it is hardcoded to drag-and-drop
   (`useDroppable`, pointer tracking). SpotAll ships its own reducer and
   tile component as a workaround, creating a parallel infrastructure that
   diverges from the shared answer-game system.

## Goals

- Extract a `useGameRound` hook that any game can call to get round
  lifecycle (init → advance → complete) without reimplementing the
  dispatcher.
- Emit a `round:*` event namespace on `GameEventBus` that SRS, TTS
  lifecycle, and future consumers subscribe to.
- Add a `mode: 'drag' | 'tap-select'` prop to `Slot` so SpotAll v2 can
  reuse the shared component.
- Migrate WordSpell, NumberMatch, and SortNumbers to `useGameRound`,
  replacing ~50 LOC per game with ~10 LOC.
- Preserve existing behaviour — all four games must compile and pass tests
  unchanged after migration.

## Non-goals

- **SRS integration.** SRS subscribes to the events; this spec only
  ensures they are emitted. SRS's `roundProvider` injection and
  `useSrsRecording` are tracked in the SRS v1 spec.
- **Lifecycle TTS wiring.** Spec 1a wires `useLifecycleTTS` to the events;
  this spec only ensures the events exist.
- **SpotAll full migration.** SpotAll adopts tap-select Slot in its own PR
  (the redesign spec). This spec adds the mode; SpotAll consumes it
  separately.
- **Level progression generalisation.** SortNumbers has levels; other
  games do not. `useGameRound` supports levels but does not force them.

---

## Section 1 — `useGameRound` Hook

### Signature

```ts
type UseGameRoundOptions<TRound> = {
  rounds: TRound[];
  advanceDelayMs?: number; // default 750
  levelBoundaries?: number[]; // optional; SortNumbers uses this
  roundProvider?: RoundProvider<TRound>; // optional; SRS v1 injects this
};

type UseGameRoundReturn<TRound> = {
  currentRound: TRound;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  phase: 'playing' | 'round-complete' | 'level-complete' | 'game-over';
  isLastRound: boolean;
  markResolved: (outcome: RoundOutcome) => void;
};

const useGameRound = <TRound>(
  options: UseGameRoundOptions<TRound>,
): UseGameRoundReturn<TRound>;
```

### Behaviour

1. On mount, emits `round:shown` for the first round.
2. When a game calls `markResolved(outcome)`:
   - Emits `round:resolved` with the outcome.
   - Sets phase to `'round-complete'` (or `'level-complete'` /
     `'game-over'` as appropriate).
   - After `advanceDelayMs`, advances to the next round and emits
     `round:shown`.
3. If `levelBoundaries` is provided, tracks `levelIndex` and emits
   `game:level-advance` at boundaries.
4. If `roundProvider` is provided, delegates round instantiation to it
   (SRS injection point). Otherwise uses the `rounds` array directly.

### State ownership

`useGameRound` owns the round lifecycle state (index, phase, timing).
It does **not** own tile state, zone state, or scoring — those remain
in `answerGameReducer`. The hook communicates with the reducer via
dispatching `ADVANCE_ROUND` and `COMPLETE_GAME` actions.

---

## Section 2 — `round:*` Event Namespace

Six new event types added to `GameEventType` in
`src/types/game-events.ts`:

| Event                     | Emitter                                 | Payload                                                               |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `round:shown`             | `useGameRound` on round mount           | `{ roundId, itemId, ts }`                                             |
| `round:first-action`      | Reducer on first tile place / key / tap | `{ roundId, ts, kind: 'tile' \| 'key' \| 'tap' }`                     |
| `round:mistake`           | Reducer wrong-placement branch          | `{ roundId, ts, expectedTile, actualTile, slotId, distractorSource }` |
| `round:tts-played`        | `speakAuto` and `speakOnDemand` paths   | `{ roundId, ts }`                                                     |
| `round:visibility-change` | `document.visibilitychange` listener    | `{ ts, hidden }`                                                      |
| `round:resolved`          | `useGameRound` on round complete        | `{ roundId, ts, outcome, finalAnswer? }`                              |

### Contract with SRS v1

Per [SRS v1 spec §15.4](docs/superpowers/specs/2026-05-01-srs-v1-design.md),
`useSrsRecording` subscribes to all six events. The payloads above match
the SRS spec's requirements exactly. Both `speakAuto` and `speakOnDemand`
paths emit `round:tts-played` so SRS counts every TTS playback (per
Spec 1a §13.4).

### Contract with Spec 1a

`useLifecycleTTS` subscribes to `round:shown` (trigger auto-speak) and
emits `round:tts-played` (count for SRS). The `round:visibility-change`
event is consumed by SRS only.

### Wildcard subscription

`GameEventBus` already supports `'game:*'` wildcard. The `round:*`
namespace follows the same convention — subscribers can listen to
individual events or `'round:*'` for all round-level events.

---

## Section 3 — Tap-Select Slot Mode

### API change

```ts
type SlotProps = {
  // ... existing props
  interactionMode?: 'drag' | 'tap-select'; // default 'drag'
};
```

### Behaviour by mode

| Aspect            | `drag` (today)               | `tap-select` (new)                  |
| ----------------- | ---------------------------- | ----------------------------------- |
| Pointer handling  | `useDroppable`, drag preview | `onClick` / `onTap` toggle          |
| State model       | Tiles placed into zones      | `selectedSlotIds` set on state      |
| Round complete    | All zones filled correctly   | All correct tiles selected          |
| Wrong interaction | Tile eject + error sound     | Red flash + shake + 600 ms cooldown |
| Drag preview      | Yes (semi-transparent)       | N/A                                 |
| Hit area          | 44 x 44 px minimum           | 44 x 44 px minimum                  |

### State extension

`answerGameReducer` gains:

- `selectedSlotIds: Set<string>` — tracks selected slots in tap-select
  mode.
- `SELECT_SLOT` action — toggles a slot in `selectedSlotIds`. If the
  slot is correct, it stays selected (visual confirmation). If wrong,
  it triggers the reject animation and is removed after cooldown.
- `resolveCompletionPhase()` becomes mode-aware:
  `mode === 'tap-select' ? allCorrectSelected : allSlotsFilled`.

### Coexistence

Both modes coexist at the component level. A game passes
`interactionMode` based on its mechanic. The reducer and event bus
handle both modes identically for round lifecycle purposes — SRS and
TTS lifecycle don't need to know which mode is active.

---

## Section 4 — Per-Game Migration

### WordSpell

**Before:** ~50 LOC in `WordSpell.tsx` handling `phase ===
'round-complete'`, 750 ms delay, `ADVANCE_ROUND` / `COMPLETE_GAME`
dispatch. No event emission.

**After:** `const { phase, markResolved } = useGameRound({ rounds,
advanceDelayMs: 750 })`. Call `markResolved('correct')` when all zones
are filled. ~10 LOC.

### NumberMatch

Same pattern as WordSpell. Currently no event emission. Migration is
structurally identical.

### SortNumbers

**Before:** Has level progression via `ADVANCE_LEVEL` + `generateNextLevel`.
Emits `game:round-advance` and `game:level-advance`. Uses skin-driven
timing via `resolveTiming('roundAdvanceDelay', skin, config)`.

**After:** `const { phase, markResolved, levelIndex } = useGameRound({
rounds, advanceDelayMs: resolveTiming(...), levelBoundaries })`.
Existing `game:round-advance` and `game:level-advance` events are
preserved alongside the new `round:*` events.

### Backward compatibility

- Existing `game:round-advance` and `game:level-advance` events continue
  to fire for any code that subscribes to them.
- `round:*` events are additive — no existing subscriber is broken.
- The `ADVANCE_ROUND`, `ADVANCE_LEVEL`, and `COMPLETE_GAME` reducer
  actions remain unchanged — `useGameRound` dispatches them internally.

---

## Section 5 — Event Bus Changes

### Bus location

`GameEventBus` stays at `src/lib/game-event-bus.ts`. No relocation in
this spec — the bus serves both `game:*` and `round:*` namespaces.

### Type additions

```ts
// Added to GameEventType union
| 'round:shown'
| 'round:first-action'
| 'round:mistake'
| 'round:tts-played'
| 'round:visibility-change'
| 'round:resolved'
```

### `round:*` wildcard

The existing wildcard implementation (`game:*`) is extended to support
`round:*`. Implementation: the `emit` method checks prefix-based
wildcard subscriptions in addition to exact-match subscriptions.

---

## Section 6 — `round:first-action` Detection

First-action detection uses state-diff in the reducer. On the first
`PLACE_TILE`, `TYPE_TILE`, or `SELECT_SLOT` action in a round (detected
by checking `state.firstActionAt === null` for the current round), the
reducer emits `round:first-action` with the action kind:

- `PLACE_TILE` → `kind: 'tile'`
- `TYPE_TILE` → `kind: 'key'`
- `SELECT_SLOT` → `kind: 'tap'`

The `firstActionAt` timestamp is reset on each `ADVANCE_ROUND`.

---

## Section 7 — Mistake Detection

The reducer already has wrong-placement logic in the `PLACE_TILE` branch
(tile is placed but ejected on mismatch). This is extended to emit
`round:mistake` with the full payload SRS needs:

```ts
{
  roundId: state.roundId,
  ts: Date.now(),
  expectedTile: zone.correctTileId,
  actualTile: action.tileId,
  slotId: action.zoneIndex,
  distractorSource: tile.source ?? null,
}
```

For tap-select mode, `SELECT_SLOT` emits `round:mistake` when the
selected slot is incorrect, with `distractorSource` from the slot's
tile metadata.

---

## Section 8 — Visibility Change Tracking

A `useVisibilityTracking()` hook (or inline effect in `useGameRound`)
listens to `document.visibilitychange` and emits
`round:visibility-change` on the bus. Scoped to the active game session
(subscribes on mount, unsubscribes on unmount).

SRS uses `visibilityHiddenMs` from these events to correct idle time in
attempt scoring. No permission prompts needed — standard browser API.

---

## Section 9 — Testing Strategy

### Unit tests

- `useGameRound` hook: round advancement, phase transitions, event
  emission, level boundaries, delay timing.
- `round:*` events: correct payloads for all six event types.
- `Slot` tap-select mode: selection toggle, wrong-tap reject animation,
  round-complete condition.
- `answerGameReducer`: `SELECT_SLOT` action, `selectedSlotIds` state,
  `firstActionAt` tracking, mistake event emission.
- Per-game regression: WordSpell, NumberMatch, SortNumbers compile and
  pass existing tests unchanged after migration.

### Integration tests

- Full round lifecycle: mount → first action → mistake → resolve →
  advance → next round shown.
- Event stream: subscribe to `round:*` wildcard, verify all six events
  fire in correct order with correct payloads.

---

## Section 10 — File Changes

| File                                                 | Change                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `src/lib/game-engine/useGameRound.ts` (new)          | Hook implementation                                                 |
| `src/lib/game-engine/useGameRound.test.ts`           | Hook tests                                                          |
| `src/types/game-events.ts`                           | Add 6 `round:*` event types + payloads                              |
| `src/lib/game-event-bus.ts`                          | `round:*` wildcard support                                          |
| `src/components/answer-game/Slot/Slot.tsx`           | `interactionMode` prop                                              |
| `src/components/answer-game/answer-game-reducer.ts`  | `SELECT_SLOT`, `firstActionAt`, `selectedSlotIds`, mistake emission |
| `src/components/answer-game/types.ts`                | State + action type additions                                       |
| `src/games/word-spell/WordSpell/WordSpell.tsx`       | Migrate to `useGameRound`                                           |
| `src/games/number-match/NumberMatch/NumberMatch.tsx` | Migrate to `useGameRound`                                           |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` | Migrate to `useGameRound`                                           |

---

## Section 11 — Sequencing

This spec is the critical-path blocker for:

- **SRS v1** — subscribes to `round:*` events via `useSrsRecording`.
- **Spec 1a M1** — `useLifecycleTTS` consumes `round:shown` and emits
  `round:tts-played`. M1 can ship before #257 using only `game:*` events
  plus additive `game:prepare`, but `round:*` events are recommended.
- **Spec 1a M2** — full lifecycle vocabulary requires all `round:*`
  events.
- **SpotAll redesign** — needs tap-select Slot mode.

Per-game adoption (#260, #261, #262) follows as separate issues.

---

## Deferred / Open Questions

- **`round:idle` and `round:celebrate`** — Spec 1a M2 adds these two
  additional events. They are not part of this spec because they require
  the lifecycle vocabulary and timer contract that M2 defines. This spec
  provides the foundation; M2 extends it.
- **Bus relocation to `src/lib/game-engine/`** — considered but deferred.
  The bus serves both `game:*` and `round:*`; moving it is a separate
  cleanup issue.
- **`useGameRound` Storybook story** — a `LifecycleEventExplorer` story
  is deferred to Spec 1a M2 (`LifecycleTTSExplorer.stories.tsx`).
