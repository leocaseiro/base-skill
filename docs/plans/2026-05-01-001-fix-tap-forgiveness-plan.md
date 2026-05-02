---
title: 'fix: Tap forgiveness — treat micro-drags as taps'
type: fix
status: shipped
date: 2026-05-01
origin: docs/brainstorms/2026-05-01-tap-forgiveness-requirements.md
---

## Spec Delta — distance-only was insufficient

Implementation initially followed this plan (distance check only). Real-device
testing on Chrome Android and Brave iOS showed distance-only forgiveness has
**zero behavioural impact** because a typical thumb tap registers 75–100px in
50–65ms (thumb-release drift). See the Findings section in the origin
brainstorm for the captured device data.

The shipped implementation adds a duration-based gate alongside the distance
gate: tap if `duration < tapForgivenessTimeMs` (default 150ms) OR
`distance < tapForgivenessThreshold` (default 17px). Same `onTapFallback`
hook contract; same priority order; same per-profile configurability with two
sliders instead of one.

## Summary

Adds a configurable "tap forgiveness" threshold so that touch micro-drags
(accidental finger movement < N pixels during a tap) are treated as taps
rather than cancelled drags. The threshold is stored per-profile in settings
and exposed via a slider in the settings UI. The check fires only for bank
tile drags — slot tile drags are unaffected.

## Problem Frame

Young users accidentally move their finger slightly when tapping bank tiles.
Once movement exceeds the 8px `DRAG_THRESHOLD_PX`, the system enters drag
mode. When the finger lifts still over the bank, the drag cancels as a no-op.
The tile speaks but never places. (see origin:
`docs/brainstorms/2026-05-01-tap-forgiveness-requirements.md`)

## Requirements

- R1. On touch pointer-up, if total displacement < threshold AND pointer is
  over the bank (not a slot zone), treat as tap (place in next slot).
- R2. Existing `DRAG_THRESHOLD_PX = 8` remains unchanged.
- R3. Per-profile `tapForgivenessThreshold` field in `SettingsDoc` with
  default 20px.
- R4. Settings UI slider to tune the threshold.
- R5. Applies globally to all games via `useTouchDrag` (bank tiles only).
- R6. Intentional drags (> threshold) that return to bank still cancel.

## Scope Boundaries

- Time-based detection (rejected)
- Drag recording/analytics (deferred)
- Desktop HTML5 DnD behavior (unaffected — touch-only)
- Fast-tap queue from PR #287 (unaffected)
- Slot tile drag behavior (unaffected — only bank tiles get tap forgiveness)

## Context & Research

### Relevant Code and Patterns

- `src/components/answer-game/useTouchDrag.ts` — `DRAG_THRESHOLD_PX = 8`,
  `onPointerUp` handler with priority-ordered drop detection
- `src/components/answer-game/useDraggableTile.ts` — consumes `useTouchDrag`,
  defines `handleClick` which calls `speakTile` + `placeInNextSlot`
- `src/components/answer-game/useSlotTileDrag.ts` — also consumes
  `useTouchDrag` but for slot-to-slot drags (no tap fallback needed)
- `src/db/schemas/settings.ts` — `SettingsDoc` with existing optional numeric
  fields (volume, speechRate)
- `src/db/hooks/useSettings.ts` — `useSettings()` hook with `settings` object
  and `update` function; merges defaults
- `src/routes/$locale/_app/settings.tsx` — `<Slider>` pattern for
  volume/speechRate already exists

## Key Technical Decisions

- **`onTapFallback` callback pattern**: `useTouchDrag` receives an optional
  callback. When provided + conditions met, it fires instead of the normal
  drop/cancel path. `useDraggableTile` passes it; `useSlotTileDrag` doesn't.
  This avoids adding game-specific awareness into the shared hook.
- **Read settings inside `useDraggableTile`**: The hook already calls
  `useAutoNextSlot`, `useGameTTS`, etc. Adding `useSettings()` follows the
  same pattern and keeps `useTouchDrag` free of database concerns.
- **Euclidean distance, not axis-independent**: A single
  `Math.hypot(dx, dy)` call is simple and matches how users perceive
  movement regardless of direction.
- **Default 20px**: ~2.5x the drag-start threshold. Forgiving enough for
  sloppy taps without catching intentional drags. Tunable per-child via
  settings.

## Open Questions

### Resolved During Planning

- **Should slot tile drags get tap forgiveness?** No — slot tiles are already
  placed; a micro-drag returning to the same slot is correctly a no-op.
- **Should `useTouchDrag` own the settings read?** No — it's a generic
  pointer-events hook. Keeping it settings-unaware improves testability.

### Deferred to Implementation

- Exact i18n key name for the settings label (follow existing pattern in
  translation files).

## Implementation Units

- U1. **Settings schema field**

**Goal:** Add `tapForgivenessThreshold` to the settings schema so it persists
per profile.

**Requirements:** R3

**Dependencies:** None

**Files:**

- Modify: `src/db/schemas/settings.ts`
- Modify: `src/db/hooks/useSettings.ts` (add default to `DEFAULT_SETTINGS`)

**Approach:**

- Add optional `tapForgivenessThreshold?: number` to `SettingsDoc` interface.
- Add to schema properties with `type: 'number'`, `minimum: 8`, `maximum: 60`,
  `default: 20`.
- Add `tapForgivenessThreshold: 20` to `DEFAULT_SETTINGS` in `useSettings.ts`.

**Patterns to follow:**

- Existing `volume` and `speechRate` fields in the same schema.

**Test expectation:** none — pure schema/type addition with no behavioral
change. TypeScript compilation verifies the type is correct.

**Verification:**

- `yarn typecheck` passes with the new field.

- U2. **Tap forgiveness logic in `useTouchDrag`**

**Goal:** Add the distance-check logic to `onPointerUp` that fires
`onTapFallback` when conditions are met.

**Requirements:** R1, R2, R5, R6

**Dependencies:** None (uses threshold as a param, not from settings directly)

**Files:**

- Modify: `src/components/answer-game/useTouchDrag.ts`
- Create: `src/components/answer-game/useTouchDrag.test.ts`

**Approach:**

- Add two optional fields to `UseTouchDragOptions`: `tapForgivenessThreshold`
  (number) and `onTapFallback` (callback `() => void`).
- In `onPointerUp`, after confirming `isDragging.current === true`, before
  existing drop detection logic: calculate Euclidean distance from
  `startPos.current` to `(e.clientX, e.clientY)`. If distance <
  `tapForgivenessThreshold` AND no zone is detected at center point AND
  `onTapFallback` is defined → call `onTapFallback`, `cleanup()`, return
  early.
- Store `onTapFallback` in a ref (same pattern as `onDragCancelRef`).

**Execution note:** Write failing tests first (micro-drag scenario should
call `onTapFallback`; normal drag should NOT).

**Patterns to follow:**

- `onDragCancelRef` pattern for storing callback refs.
- Existing `findZoneAt` helper for zone detection.

**Test scenarios:**

- Happy path: pointer moves 12px (< 20px threshold), no zone under pointer →
  `onTapFallback` is called, `onDrop` is NOT called.
- Happy path: pointer moves 12px but IS over a zone → normal drop fires (zone
  takes priority over tap forgiveness).
- Edge case: pointer moves exactly at threshold boundary (19.9px vs 20.1px) →
  below fires fallback, above does not.
- Edge case: `onTapFallback` is undefined (slot tile drag case) → normal
  cancel path fires even for micro-drags.
- Error path: `startPos.current` is null → no crash, early return.

**Verification:**

- All new tests pass.
- Existing `useDraggableTile.test.tsx` and `useSlotTileDrag.test.tsx` still
  pass (no regression).

- U3. **Wire tap forgiveness in `useDraggableTile`**

**Goal:** Connect the settings threshold and `placeInNextSlot` as the tap
fallback for bank tile drags.

**Requirements:** R1, R3, R5

**Dependencies:** U1, U2

**Files:**

- Modify: `src/components/answer-game/useDraggableTile.ts`
- Modify: `src/components/answer-game/useDraggableTile.test.tsx`

**Approach:**

- Import `useSettings` in `useDraggableTile`.
- Read `settings.tapForgivenessThreshold` (falls back to default 20).
- Pass `tapForgivenessThreshold` and `onTapFallback: () => placeInNextSlot(tile.id)` to `useTouchDrag`.
- Note: `onDragStart` already speaks the tile, so `onTapFallback` only needs
  to place — no double-speak.

**Execution note:** Add a test that simulates a micro-drag through the full
`useDraggableTile` hook and asserts `placeInNextSlot` is called.

**Patterns to follow:**

- Existing `handleClick` in same file (speaks + places).
- Existing `useGameTTS` / `useAutoNextSlot` import pattern.

**Test scenarios:**

- Happy path: micro-drag (< threshold) on a bank tile → `placeInNextSlot`
  called with tile.id.
- Happy path: normal drag (> threshold) → existing drop/cancel path (no
  placement).
- Integration: `onDragStart` speaks tile, then micro-drag fallback places
  tile → tile is spoken once and placed once.

**Verification:**

- `yarn typecheck` passes.
- `npx vitest run src/components/answer-game/useDraggableTile.test.tsx` passes.

- U4. **Settings UI slider**

**Goal:** Expose the tap forgiveness threshold in the settings page for
tuning.

**Requirements:** R4

**Dependencies:** U1

**Files:**

- Modify: `src/routes/$locale/_app/settings.tsx`

**Approach:**

- Add a `<Slider>` block following the volume/speechRate pattern.
- `min={8}` (same as drag-start threshold — below this nothing changes),
  `max={60}`, `step={1}`.
- Label shows current value in pixels.
- `onValueChange` calls `update({ tapForgivenessThreshold: v })`.

**Patterns to follow:**

- Volume slider in same file (exact same structure).

**Test scenarios:**

- Happy path: slider renders with current setting value (or default 20).
- Happy path: sliding to 30 calls `update({ tapForgivenessThreshold: 30 })`.
- Edge case: no settings doc yet → slider shows default 20.

**Verification:**

- Settings page renders without error.
- Slider is visible and interactive.

- U5. **Architecture docs update**

**Goal:** Document the tap forgiveness path in the flows docs (required per
CLAUDE.md when modifying `src/components/answer-game/` drag-related files).

**Requirements:** R1 (documentation of new behavior)

**Dependencies:** U2, U3

**Files:**

- Modify: `src/components/answer-game/AnswerGame/AnswerGame.flows.mdx`

**Approach:**

- Add a "Tap forgiveness" subsection near the existing bank tile tap/drag
  flow documentation.
- Describe the pointer-up distance check and when `onTapFallback` fires.

**Test expectation:** none — documentation only.

**Verification:**

- `yarn fix:md` passes on the modified file.

## System-Wide Impact

- **Interaction graph:** `useTouchDrag` → `onTapFallback` → `placeInNextSlot`
  → same path as `handleClick` (speak already happened at drag-start).
- **State lifecycle risks:** None — tap forgiveness fires before any zone
  mutation occurs. The existing `cleanup()` path clears ghost/pointer state.
- **Unchanged invariants:** Slot tile drag behavior via `useSlotTileDrag` is
  completely unaffected. Desktop HTML5 DnD is unaffected (gated by
  `pointerType !== 'mouse'`). The fast-tap queue from PR #287 operates
  independently inside `useAutoNextSlot`.

## Risks & Dependencies

| Risk                                                                  | Mitigation                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 20px too generous — catches some intentional drags                    | Threshold is configurable per-profile; start conservative and tune with real users    |
| Settings schema migration if field added after production data exists | Field is optional with a hardcoded default; existing docs without the field work fine |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-01-tap-forgiveness-requirements.md](docs/brainstorms/2026-05-01-tap-forgiveness-requirements.md)
- Related code: `src/components/answer-game/useTouchDrag.ts`
- Related PRs/issues: #298, #276, PR #287
